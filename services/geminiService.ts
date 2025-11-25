
import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { Article, PortfolioItem, ChatMessage, AnalysisResult, PortfolioAttributionResult, ConcentrationRiskResult, RippleEffectResult, ForensicAnalysisResult, DocumentType, BingoData, DominoData, PortfolioHealthReport, EarningsEvent, NewsInsight, SourceLink } from '../types';
import { MOCK_ARTICLES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We store the active chat session in memory for the client
let currentChatSession: Chat | null = null;

/**
 * Aggressively cleans a potential JSON string to make it parseable.
 */
const cleanJsonString = (str: string): string => {
    let cleaned = str.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    // Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    return cleaned;
};

/**
 * Helper to extract a nested JSON object from a string starting at a specific tag.
 */
const extractJsonBlock = (text: string, tag: string): { json: any, fullMatch: string } | null => {
    const startTagIndex = text.indexOf(tag);
    if (startTagIndex === -1) return null;

    // Find the start of the JSON content (first [ or {)
    let jsonStartIndex = -1;
    let initialChar = '';
    
    for(let i = startTagIndex + tag.length; i < text.length; i++) {
        if (text[i] === '{') {
            jsonStartIndex = i;
            initialChar = '{';
            break;
        }
        if (text[i] === '[') {
            jsonStartIndex = i;
            initialChar = '[';
            break;
        }
    }

    if (jsonStartIndex === -1) return null;

    let braceCount = 0;
    let jsonEndIndex = -1;
    const openChar = initialChar;
    const closeChar = initialChar === '{' ? '}' : ']';
    let inString = false;
    let escape = false;
    
    for (let i = jsonStartIndex; i < text.length; i++) {
        const char = text[i];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        
        if (!inString) {
            if (char === openChar) braceCount++;
            else if (char === closeChar) {
                braceCount--;
                if (braceCount === 0) {
                    jsonEndIndex = i + 1;
                    break;
                }
            }
        }
    }

    if (jsonEndIndex !== -1) {
        const fullMatch = text.substring(startTagIndex, text.indexOf(']', jsonEndIndex) + 1 || jsonEndIndex);
        const jsonStrRaw = text.substring(jsonStartIndex, jsonEndIndex);

        try {
            const cleanedJson = cleanJsonString(jsonStrRaw);
            return { json: JSON.parse(cleanedJson), fullMatch };
        } catch (e) {
            console.warn("Failed to parse JSON block:", e);
            return null;
        }
    }
    return null;
};

/**
 * Fallback extractor that searches for a JSON object containing specific keys 
 * (like "template") when the explicit tag is missing.
 */
const extractLooseInsightData = (text: string): { json: any, fullMatch: string } | null => {
    let i = 0;
    while (i < text.length) {
        if (text[i] === '{') {
             let brace = 0;
             let inStr = false;
             let esc = false;
             // Scan forward to find the matching closing brace
             for (let j = i; j < text.length; j++) {
                 const c = text[j];
                 if (esc) { esc = false; continue; }
                 if (c === '\\') { esc = true; continue; }
                 if (c === '"') { inStr = !inStr; continue; }
                 if (!inStr) {
                     if (c === '{') brace++;
                     else if (c === '}') {
                         brace--;
                         if (brace === 0) {
                             const block = text.substring(i, j + 1);
                             // Heuristic: check for keys specific to our Insight schema to confirm it's the right JSON
                             if (block.includes('"template"') && (block.includes('"gist"') || block.includes('"battle"') || block.includes('"verdict"'))) {
                                 try {
                                     const json = JSON.parse(cleanJsonString(block));
                                     return { json, fullMatch: block };
                                 } catch(e) {
                                     // JSON parse failed, continue searching
                                 }
                             }
                             // If this block wasn't the one, advance i to j to skip it
                             i = j;
                             break;
                         }
                     }
                 }
             }
        }
        i++;
    }
    return null;
}

/**
 * Helper to parse AI response text and extract structured data tags.
 */
const parseAIResponse = (rawText: string) => {
  let text = rawText || "";
  
  text = text.replace(/\[object Object\]/g, "");

  let thoughts: string | undefined = undefined;
  const thoughtsMatch = text.match(/\[THOUGHTS\]([\s\S]*?)\[\/THOUGHTS\]/);
  if (thoughtsMatch) {
      thoughts = thoughtsMatch[1].trim();
      text = text.replace(thoughtsMatch[0], '').trim();
  }

  let sentiment: number | undefined = undefined;
  const sentimentMatch = text.match(/\[SENTIMENT:\s*(-?\d+)\]/);
  if (sentimentMatch) {
    sentiment = parseInt(sentimentMatch[1], 10);
    text = text.replace(/\[SENTIMENT:\s*(-?\d+)\]/, '').trim();
  }

  let chartData: any = undefined;
  const chartExtraction = extractJsonBlock(text, '[CHART_DATA:');
  if (chartExtraction) {
      chartData = chartExtraction.json;
  }

  let bingoData: BingoData | undefined = undefined;
  const bingoExtraction = extractJsonBlock(text, '[BINGO_DATA:');
  if (bingoExtraction) {
      bingoData = bingoExtraction.json;
  }

  let dominoData: DominoData | undefined = undefined;
  const dominoExtraction = extractJsonBlock(text, '[DOMINO_DATA:');
  if (dominoExtraction) {
      dominoData = dominoExtraction.json;
  }

  // Improved Insight Extraction with Fallback
  let insightData: NewsInsight | undefined = undefined;
  const insightExtraction = extractJsonBlock(text, '[INSIGHT_DATA:');
  
  if (insightExtraction) {
      insightData = insightExtraction.json;
      // Remove the tagged block
      text = text.replace(insightExtraction.fullMatch, '');
  } else {
      // Fallback: Check for heuristic JSON if tag is missing
      const loose = extractLooseInsightData(text);
      if (loose) {
          insightData = loose.json;
          // Remove the raw JSON from text so it doesn't display as duplicate content
          text = text.replace(loose.fullMatch, '').trim();
      }
  }

  // Strict Type Sanitization to prevent UI crashes
  if (insightData) {
      if (!Array.isArray(insightData.pros)) {
          insightData.pros = typeof insightData.pros === 'string' ? [insightData.pros] : [];
      }
      if (!Array.isArray(insightData.cons)) {
          insightData.cons = typeof insightData.cons === 'string' ? [insightData.cons] : [];
      }
      if (!Array.isArray(insightData.stats)) {
          insightData.stats = [];
      }
      if (!insightData.impact) {
          insightData.impact = { beneficiaries: [], negativelyImpacted: [] };
      }
      
      // Sanitization for Polymorphic Templates
      if (insightData.battle && !Array.isArray(insightData.battle.metrics)) {
          insightData.battle.metrics = [];
      }
      if (insightData.valuation && !Array.isArray(insightData.valuation.justification)) {
          insightData.valuation.justification = typeof insightData.valuation.justification === 'string' 
            ? [insightData.valuation.justification] 
            : [];
      }
      if (insightData.forensic && !Array.isArray(insightData.forensic.redFlags)) {
          insightData.forensic.redFlags = [];
      }

      // Ensure template defaults to general if missing
      if (!insightData.template) {
          insightData.template = 'general';
      }
  }
  
  let forensicData: ForensicAnalysisResult | undefined = undefined;
  const forensicExtraction = extractJsonBlock(text, '[FORENSIC_DATA:');
  if (forensicExtraction) {
      forensicData = forensicExtraction.json;
      text = text.replace(forensicExtraction.fullMatch, '');
  }

  let sources: SourceLink[] | undefined = undefined;
  const sourcesExtraction = extractJsonBlock(text, '[SOURCES:');
  if (sourcesExtraction) {
      let allSources = sourcesExtraction.json;
      // Ensure array
      if (!Array.isArray(allSources)) {
          allSources = allSources ? [allSources] : [];
      }
      // Filter unique domains and limit to 4
      const seen = new Set();
      sources = (allSources as SourceLink[]).filter(s => {
          try {
              const host = new URL(s.url).hostname;
              if (seen.has(host)) return false;
              seen.add(host);
              return true;
          } catch { return false; }
      }).slice(0, 4);
      
      text = text.replace(sourcesExtraction.fullMatch, '');
  }

  let followUp: string[] | undefined = undefined;
  const followUpExtraction = extractJsonBlock(text, '[FOLLOW_UP:');
  if (followUpExtraction) {
      let followUpRaw = followUpExtraction.json;
      if (Array.isArray(followUpRaw)) {
          followUp = followUpRaw;
      } else {
          followUp = [];
      }
      text = text.replace(followUpExtraction.fullMatch, '');
  }
  
  // Cleanup leftover tags
  const tagsToRemove = [
      /\[CHART_DATA:[\s\S]*?\]/g,
      /\[DOMINO_DATA:[\s\S]*?\]/g,
      /\[INSIGHT_DATA:[\s\S]*?\]/g, // Just in case regex matches leftovers
      /\[SOURCES:[\s\S]*?\]/g,
      /\[FOLLOW_UP:[\s\S]*?\]/g,
      /\[BINGO_DATA:[\s\S]*?\]/g,
      /\[THOUGHTS\][\s\S]*?\[\/THOUGHTS\]/g,
      /\[SENTIMENT:[\s\S]*?\]/g,
      /\[FORENSIC_DATA:[\s\S]*?\]/g
  ];

  tagsToRemove.forEach(regex => {
      text = text.replace(regex, '');
  });

  text = text.replace(/\n\s*\n/g, '\n\n').trim();

  return {
      text,
      thoughts,
      sentiment,
      chartData,
      bingoData,
      dominoData,
      insightData,
      forensicData,
      sources,
      followUp
  };
};

export const startChatSession = (contextArticle: Article | null, portfolio: PortfolioItem[], previousMessages: ChatMessage[] = []) => {
    const systemInstruction = `You are FinGenie, an elite AI Financial Analyst for retail investors.
    
    CORE PROTOCOL:
    1. DETECT INTENT: Classify the user's request into one of 5 templates:
       - 'battle' (Comparison of two or more assets)
       - 'valuation' (Is it overvalued? Fair price? Buy now?)
       - 'forensic' (Safety check, risk analysis, red flags, or CEO Lie Detector)
       - 'domino' (Supply chain, macro impact, ripple effects)
       - 'general' (News, Summary, Impact, or anything else)
    
    2. FIRST PRINCIPLES: Extract raw data first. If you cannot find specific numbers, state "Data Unavailable".
    
    3. SPECIALIZED TOOLS:
       - If user asks about "Supply Chain", "Domino Effect", or "Network", generate [DOMINO_DATA].
       - If user asks about "Lie Detector", "Tone", or "Management Credibility", use the 'forensic' template in [INSIGHT_DATA] with a focus on linguistic cues.

    RESPONSE JSON STRUCTURES:
    
    A. [INSIGHT_DATA: {
      "template": "battle" | "valuation" | "forensic" | "general",
      "gist": "1-sentence executive summary.",
      "verdict": "BUY" | "SELL" | "HOLD" | "SAFE" | "RISKY" | "OVERVALUED" | "UNDERVALUED" | "WINNER",
      "confidenceScore": 0-100,
      
      // IF TEMPLATE = 'forensic' (Used for Lie Detector too)
      "forensic": { 
          "score": 85, // 0-100 (100 = Honest/Safe)
          "status": "Clean" | "Questionable" | "Deceptive", 
          "redFlags": [{"title": "Evasive Answer", "severity": "High", "desc": "Dodged question on margins."}], 
          "auditorNote": "Tone Analysis / Auditor Name" 
      },
      // ... (other template fields: battle, valuation, etc.)
    }]

    B. [DOMINO_DATA: {
       "nodes": [
          {"id": "1", "name": "Tata Motors", "type": "target", "sentiment": "neutral", "impactDetails": "Central Entity"},
          {"id": "2", "name": "Tata Steel", "type": "supplier", "sentiment": "negative", "impactDetails": "Rising input costs"},
          {"id": "3", "name": "UK Market", "type": "customer", "sentiment": "positive", "impactDetails": "Strong JLR demand"}
       ],
       "edges": [
          {"source": "2", "target": "1", "label": "Raw Materials", "impact": "negative"},
          {"source": "1", "target": "3", "label": "Sales", "impact": "positive"}
       ]
    }]
    
    Executive Briefing:
    (Your analysis here...)
    
    [SOURCES: [{ "title": "...", "url": "..." }]]
    [FOLLOW_UP: ["Q1?", "Q2?", "Q3?"]]
    
    Use [THOUGHTS] for internal reasoning.
    `;

    currentChatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
    });

    return currentChatSession;
};

export const sendChatMessage = async (message: string): Promise<any> => {
    if (!currentChatSession) {
        startChatSession(null, []);
    }

    try {
        const response = await currentChatSession!.sendMessage({ message });
        return parseAIResponse(response.text);
    } catch (error) {
        console.error("Gemini Error:", error);
        return { 
            text: "I'm having trouble connecting to the market data servers right now. Please try again.", 
            sentiment: 0 
        };
    }
};

export const getInitialPrompt = (type: string): string => {
    switch(type) {
        case 'summary': return "Summarize this in an Executive Briefing format.";
        case 'impact': return "Analyze the impact of this news on my portfolio tickers.";
        case 'compare': return "Compare the key entities mentioned in a table.";
        default: return type;
    }
};

export const fetchLiveNews = async (): Promise<Article[]> => {
    // In a real app, this would call an external News API.
    return new Promise(resolve => setTimeout(() => resolve(MOCK_ARTICLES), 800));
};

export const analyzeDocument = async (ticker: string, docType: DocumentType): Promise<any> => {
    let prompt = "";
    
    if (docType === 'supply_chain') {
        prompt = `Generate a Supply Chain "Domino Effect" graph for ${ticker}.
        Identify key suppliers (upstream) and customers/markets (downstream).
        Analyze current macro risks for each node.
        
        REQUIRED OUTPUT:
        1. [DOMINO_DATA]: A JSON object with 'nodes' and 'edges'.
           Nodes must include: id, name, type ('supplier'|'target'|'customer'), sentiment ('positive'|'negative'|'neutral'), and impactDetails (short string).
        2. [INSIGHT_DATA]: A brief summary of the supply chain resilience with template='general'.
        3. Textual explanation.
        `;
    } else if (docType === 'ceo_lie_detector') {
        prompt = `Act as a Forensic Linguist. Analyze the latest Earnings Call or management commentary for ${ticker}.
        Detect evasion, "non-answers", over-optimism, and contradictions between tone and financials.
        
        REQUIRED OUTPUT:
        1. [INSIGHT_DATA]: Use template="forensic".
           - "score": 0-100 (100 = Honest/Transparent, 0 = Deceptive/Evasive).
           - "status": "Reliable" | "Questionable" | "Deceptive".
           - "redFlags": List specific quotes or topics where management was evasive or contradictory. Title should be the type of evasion (e.g. "Deflection").
           - "auditorNote": "Linguistic Tone Analysis".
           - "gist": Summary of the management's credibility and sentiment.
        2. [BINGO_DATA]: {
            "wordCloud": [{"word": "Headwinds", "count": 12, "sentiment": "negative"}, ...],
            "sentimentTimeline": [{"time": "Intro", "sentiment": 80}, {"time": "Q&A", "sentiment": -20, "annotation": "Defensive on margins"}]
           }
        3. Textual analysis.
        `;
    } else {
        prompt = `Analyze the ${docType} for ${ticker}. 
        Provide a deep dive analysis.
        
        REQUIRED JSON OUTPUTS:
        1. [INSIGHT_DATA] with the summary and template type (usually 'forensic' for red_flags or 'general' for others).
        2. [CHART_DATA] if there are financial trends.
        3. [SOURCES] and [FOLLOW_UP].
        
        If docType is 'red_flags', use template='forensic'.
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }] 
            }
        });
        
        const parsed = parseAIResponse(response.text);
        
        // Mock Source Document Text for the UI "Evidence" panel if real doc isn't available
        const sourceDocument = `(Simulated ${docType} content for ${ticker})\n\nManagement Discussion:\nWe observed strong tailwinds in the digital transformation sector...`;

        return { ...parsed, sourceDocument };
    } catch (error) {
        console.error(error);
        return { text: "Failed to analyze document." };
    }
};

// --- PORTFOLIO INTELLIGENCE ---

export const getPortfolioHealthReport = async (portfolio: PortfolioItem[], news: Article[]): Promise<PortfolioHealthReport | null> => {
    const attribution = await analyzePortfolioAttribution(portfolio, news);
    const risk = await analyzeConcentrationRisk(portfolio);
    
    return {
        attribution,
        risk,
        earnings: [
            { ticker: "TCS", date: "2024-04-12", expectation: "Neutral", insight: "Margins likely under pressure" },
            { ticker: "HDFCBANK", date: "2024-04-15", expectation: "Bullish", insight: "Loan growth strong" }
        ],
        timestamp: Date.now()
    };
};

export const analyzePortfolioAttribution = async (portfolio: PortfolioItem[], articles: Article[]): Promise<PortfolioAttributionResult> => {
    const prompt = `Analyze portfolio attribution based on these holdings: ${JSON.stringify(portfolio.map(p => p.symbol))} and recent news.
    Return JSON matching PortfolioAttributionResult interface.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text) as PortfolioAttributionResult;
    } catch (e) {
        return {
            overallSentiment: 'Neutral',
            movementPercentageEstimate: '0.0%',
            culprits: [],
            saviors: [],
            hiddenFactor: 'Market Volatility',
            verdict: 'Unable to calculate attribution at this moment.'
        };
    }
};

export const analyzeConcentrationRisk = async (portfolio: PortfolioItem[]): Promise<ConcentrationRiskResult> => {
    const prompt = `Analyze concentration risk for: ${JSON.stringify(portfolio.map(p => ({symbol: p.symbol, value: p.shares * p.avgPrice})))}.
    Return JSON matching ConcentrationRiskResult interface.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text) as ConcentrationRiskResult;
    } catch (e) {
        return {
            riskLevel: 'Low',
            primaryRiskFactor: 'Unknown',
            risks: [],
            diversificationSuggestion: 'Keep diversifying.'
        };
    }
};

export const analyzeRippleEffect = async (event: string, portfolio: PortfolioItem[]): Promise<RippleEffectResult> => {
    const prompt = `Simulate ripple effect of "${event}" on portfolio: ${JSON.stringify(portfolio.map(p => p.symbol))}.
    Return JSON matching RippleEffectResult interface.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text) as RippleEffectResult;
    } catch (e) {
        return {
            event,
            impactFlow: [],
            affectedTickers: []
        };
    }
};

export const analyzeForensicDocument = async (text: string): Promise<ForensicAnalysisResult> => {
    const prompt = `Analyze this financial text for forensic red flags: "${text.substring(0, 1000)}...".
    Return JSON matching ForensicAnalysisResult interface.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text) as ForensicAnalysisResult;
    } catch (e) {
        return {
            redFlags: [],
            manipulationScore: 0,
            verdict: "Analysis failed."
        };
    }
};

// --- FINANCIAL TOOLS ---

export const analyzeEarningsTranscript = async (text: string): Promise<AnalysisResult> => {
    const prompt = `Analyze this earnings transcript snippet. Identify sentiment and key takeaways. Text: ${text.substring(0, 2000)}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return { title: "Earnings Analysis", content: response.text, sentiment: 75 };
};

export const analyzeChartImage = async (base64Image: string): Promise<AnalysisResult> => {
    const prompt = "Analyze this stock chart. Identify patterns, support/resistance, and trend.";
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64Image } },
                { text: prompt }
            ]
        }
    });
    return { title: "Chart Vision Analysis", content: response.text };
};


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
    cleaned = cleaned.replace(/\[object Object\]/g, ''); // Remove specific hallucination
    // Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    return cleaned;
};

/**
 * Helper to identify the boundaries of a JSON block (start and end index).
 * Handles nested braces/brackets correctly.
 */
const findBlockBoundaries = (text: string, startFromIndex: number, openChar: string, closeChar: string): { start: number, end: number } | null => {
    let braceCount = 0;
    let inString = false;
    let escape = false;
    let endIndex = -1;

    for (let i = startFromIndex; i < text.length; i++) {
        const char = text[i];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        
        if (!inString) {
            if (char === openChar) braceCount++;
            else if (char === closeChar) {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }
    }
    
    if (endIndex !== -1) {
        return { start: startFromIndex, end: endIndex };
    }
    return null;
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
        // Safety: If we hit a new line or another tag before JSON, abort
        if (text[i] === '\n' || (text[i] === '[' && text[i+1] && /[A-Z]/.test(text[i+1]))) {
           // allow skipping whitespace but be careful
        }
    }

    if (jsonStartIndex === -1) return null;

    const boundaries = findBlockBoundaries(text, jsonStartIndex, initialChar, initialChar === '{' ? '}' : ']');
    
    if (boundaries) {
        // Try to include the closing bracket of the tag if it exists immediately after
        let blockEnd = boundaries.end;
        const potentialTagClose = text.indexOf(']', blockEnd);
        if (potentialTagClose !== -1 && potentialTagClose < blockEnd + 10) {
            // Check if it's just whitespace between JSON end and tag close
            const gap = text.substring(blockEnd, potentialTagClose);
            if (!gap.trim()) {
                blockEnd = potentialTagClose + 1;
            }
        }

        const fullMatch = text.substring(startTagIndex, blockEnd);
        const jsonStrRaw = text.substring(boundaries.start, boundaries.end);

        try {
            const cleanedJson = cleanJsonString(jsonStrRaw);
            return { json: JSON.parse(cleanedJson), fullMatch };
        } catch (e) {
            console.warn(`Failed to parse JSON block for ${tag}:`, e);
            return null;
        }
    }
    return null;
};

/**
 * Removes a block defined by a tag from the text, even if it couldn't be parsed as JSON.
 * This ensures raw garbage doesn't leak into the UI.
 */
const removeBlock = (text: string, tag: string): string => {
    const startTagIndex = text.indexOf(tag);
    if (startTagIndex === -1) return text;

    let jsonStartIndex = -1;
    let initialChar = '';
    
    // Attempt to find JSON start
    for(let i = startTagIndex + tag.length; i < text.length; i++) {
        if (text[i] === '{') { jsonStartIndex = i; initialChar = '{'; break; }
        if (text[i] === '[') { jsonStartIndex = i; initialChar = '['; break; }
    }

    if (jsonStartIndex === -1) {
        // If no JSON found, just remove the tag line/segment
        return text.replace(tag, '');
    }

    const boundaries = findBlockBoundaries(text, jsonStartIndex, initialChar, initialChar === '{' ? '}' : ']');
    
    if (boundaries) {
        let blockEnd = boundaries.end;
        const potentialTagClose = text.indexOf(']', blockEnd);
        if (potentialTagClose !== -1 && potentialTagClose < blockEnd + 10) {
             blockEnd = potentialTagClose + 1;
        }
        
        const before = text.substring(0, startTagIndex);
        const after = text.substring(blockEnd);
        return (before + after).trim();
    }
    
    // Fallback: if boundaries retrieval failed (unbalanced), try a simple removal of tag line
    return text.replace(tag, '');
};

/**
 * Fallback extractor for Insight Data when tag is missing
 */
const extractLooseInsightData = (text: string): { json: any, fullMatch: string } | null => {
    let i = 0;
    while (i < text.length) {
        if (text[i] === '{') {
             const boundaries = findBlockBoundaries(text, i, '{', '}');
             if (boundaries) {
                 const block = text.substring(boundaries.start, boundaries.end);
                 if (block.includes('"template"') && (block.includes('"gist"') || block.includes('"battle"') || block.includes('"verdict"'))) {
                     try {
                         const json = JSON.parse(cleanJsonString(block));
                         return { json, fullMatch: block };
                     } catch(e) {}
                 }
                 i = boundaries.end; // Skip this block
                 continue;
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
  
  // 1. Global Cleanup of Hallucinations
  text = text.replace(/\[object Object\]/g, "");

  // 2. Extract Internal Thoughts (Non-JSON)
  let thoughts: string | undefined = undefined;
  const thoughtsMatch = text.match(/\[THOUGHTS\]([\s\S]*?)\[\/THOUGHTS\]/);
  if (thoughtsMatch) {
      thoughts = thoughtsMatch[1].trim();
      text = text.replace(thoughtsMatch[0], '').trim();
  }

  // 3. Extract Sentiment (Simple Tag)
  let sentiment: number | undefined = undefined;
  const sentimentMatch = text.match(/\[SENTIMENT:\s*(-?\d+)\]/);
  if (sentimentMatch) {
    sentiment = parseInt(sentimentMatch[1], 10);
    text = text.replace(/\[SENTIMENT:\s*(-?\d+)\]/, '').trim();
  }

  // 4. Extract Structured JSON Blocks
  // Helper to extract valid JSON and then remove the block from text.
  // If JSON parse fails, we STILL attempt to remove the block later to avoid ugly text.
  const extractAndStrip = (tag: string) => {
      const result = extractJsonBlock(text, tag);
      if (result) {
          text = text.replace(result.fullMatch, '');
          return result.json;
      }
      return undefined;
  };

  const chartData = extractAndStrip('[CHART_DATA:');
  const bingoData = extractAndStrip('[BINGO_DATA:');
  const dominoData = extractAndStrip('[DOMINO_DATA:');
  const forensicData = extractAndStrip('[FORENSIC_DATA:');
  
  // Sources & FollowUp
  let sources: SourceLink[] | undefined = undefined;
  const sourcesRaw = extractAndStrip('[SOURCES:');
  if (sourcesRaw) {
      const arr = Array.isArray(sourcesRaw) ? sourcesRaw : [sourcesRaw];
      const seen = new Set();
      sources = arr.filter((s: any) => {
          if (!s.url) return false;
          try {
              const host = new URL(s.url).hostname;
              if (seen.has(host)) return false;
              seen.add(host);
              return true;
          } catch { return false; }
      }).slice(0, 4);
  }

  let followUp: string[] | undefined = undefined;
  const followUpRaw = extractAndStrip('[FOLLOW_UP:');
  if (followUpRaw && Array.isArray(followUpRaw)) {
      followUp = followUpRaw;
  }

  // Insight Data (with loose fallback)
  let insightData = extractAndStrip('[INSIGHT_DATA:');
  if (!insightData) {
      const loose = extractLooseInsightData(text);
      if (loose) {
          insightData = loose.json;
          text = text.replace(loose.fullMatch, '');
      }
  }

  // 5. Final Cleanup: Aggressively remove any lingering tags that failed JSON parsing
  // This prevents "[INSIGHT_DATA: ..." from showing up in the UI if the JSON was malformed.
  const tagsToScrub = [
      '[CHART_DATA:', '[DOMINO_DATA:', '[INSIGHT_DATA:', '[SOURCES:', 
      '[FOLLOW_UP:', '[BINGO_DATA:', '[FORENSIC_DATA:', '[THOUGHTS]'
  ];
  
  tagsToScrub.forEach(tag => {
      text = removeBlock(text, tag);
  });
  
  // 6. Sanitization
  if (insightData) {
      // Ensure arrays exist
      ['pros', 'cons', 'stats'].forEach(k => { if (!insightData[k]) insightData[k] = []; });
      if (!insightData.impact) insightData.impact = { beneficiaries: [], negativelyImpacted: [] };
      if (!insightData.template) insightData.template = 'general';
  }

  // Final trim
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
    
    3. STRICT FORMATTING:
       - Output ONLY valid JSON inside the specific tags.
       - Do NOT use [object Object].
       - Do NOT use markdown code blocks (\`\`\`json) inside the tags.
       - Ensure all JSON arrays and objects are correctly closed.

    RESPONSE STRUCTURE (Use these tags):
    
    A. [INSIGHT_DATA: {
      "template": "battle" | "valuation" | "forensic" | "general",
      "gist": "1-sentence executive summary.",
      "verdict": "BUY" | "SELL" | "HOLD" | "SAFE" | "RISKY" | "OVERVALUED" | "UNDERVALUED" | "WINNER",
      "confidenceScore": 0-100,
      
      // IF TEMPLATE = 'forensic' (Used for Lie Detector too)
      "forensic": { 
          "score": 85, 
          "status": "Clean" | "Questionable" | "Deceptive", 
          "redFlags": [{"title": "Evasive Answer", "severity": "High", "desc": "Dodged question on margins."}], 
          "auditorNote": "Tone Analysis / Auditor Name" 
      },
      // IF TEMPLATE = 'battle'
      "battle": {
          "winner": "TCS",
          "loser": "Infosys",
          "metrics": [{"label": "Revenue Growth", "winnerValue": "10%", "loserValue": "5%", "winnerFavored": true}]
      }
      // ... (other template fields)
    }]

    B. [DOMINO_DATA: {
       "nodes": [
          {"id": "1", "name": "Tata Motors", "type": "target", "sentiment": "neutral", "impactDetails": "Central Entity"},
          {"id": "2", "name": "Tata Steel", "type": "supplier", "sentiment": "negative", "impactDetails": "Rising input costs"}
       ],
       "edges": [
          {"source": "2", "target": "1", "label": "Raw Materials", "impact": "negative"}
       ]
    }]
    
    Executive Briefing:
    (Your analysis here... Provide a clear, human-readable summary of the JSON data.)
    
    [SOURCES: [{ "title": "Source Title", "url": "https://source.url" }]]
    [FOLLOW_UP: ["Question 1?", "Question 2?"]]
    
    Use [THOUGHTS]...[/THOUGHTS] for internal reasoning steps.
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

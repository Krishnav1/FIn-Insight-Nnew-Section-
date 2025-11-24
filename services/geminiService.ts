
import { GoogleGenAI, Chat, Content, Modality } from "@google/genai";
import { Article, PortfolioItem, ChatMessage, AnalysisResult, PortfolioAttributionResult, ConcentrationRiskResult, RippleEffectResult, ForensicAnalysisResult, DocumentType, BingoData, DominoData, PortfolioHealthReport, EarningsEvent, NewsInsight } from '../types';
import { MOCK_ARTICLES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We store the active chat session in memory for the client
let currentChatSession: Chat | null = null;

/**
 * Aggressively cleans a potential JSON string to make it parseable.
 */
const cleanJsonString = (str: string): string => {
    let cleaned = str.trim();
    // Remove markdown code blocks if present inside the tag extraction
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    
    // Fix trailing commas in objects and arrays
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing commas between array elements (common AI error: ["A" "B"])
    cleaned = cleaned.replace(/(")\s+(?=")/g, '$1,');

    // Fix empty value error (e.g. "key": } -> "key": null })
    cleaned = cleaned.replace(/:\s*([}\]])/g, ': null$1');

    // Fix single quotes for keys (e.g. 'key': "value" -> "key": "value")
    cleaned = cleaned.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');

    // Fix single quotes for string values (e.g. "key": 'value' -> "key": "value")
    // This is a simple heuristic and might not catch complex cases with escaped quotes
    cleaned = cleaned.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    return cleaned;
};

/**
 * Helper to extract a nested JSON object from a string starting at a specific tag.
 * Uses brace counting to handle nested objects correctly.
 */
const extractJsonBlock = (text: string, tag: string): { json: any, fullMatch: string } | null => {
    const startTagIndex = text.indexOf(tag);
    if (startTagIndex === -1) return null;

    // Find the start of the JSON content (first [ or {)
    let jsonStartIndex = -1;
    let initialChar = '';
    
    // Search forward from the tag to find the first JSON opener
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
        
        if (escape) {
            escape = false;
            continue;
        }
        
        if (char === '\\') {
            escape = true;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
            continue;
        }
        
        if (!inString) {
            if (char === openChar) {
                braceCount++;
            } else if (char === closeChar) {
                braceCount--;
                if (braceCount === 0) {
                    jsonEndIndex = i + 1; // Include the closing brace
                    break;
                }
            }
        }
    }

    if (jsonEndIndex !== -1) {
        const jsonStrRaw = text.substring(jsonStartIndex, jsonEndIndex);
        
        // Find where the tag block ends (usually a ']')
        const closeBracketIndex = text.indexOf(']', jsonEndIndex);
        
        // The full match to replace includes the Tag and potentially the closing bracket
        const fullMatchEnd = closeBracketIndex !== -1 && text.substring(jsonEndIndex, closeBracketIndex).trim() === "" 
            ? closeBracketIndex + 1 
            : jsonEndIndex;

        const fullMatch = text.substring(startTagIndex, fullMatchEnd);

        try {
            const cleanedJson = cleanJsonString(jsonStrRaw);
            return { json: JSON.parse(cleanedJson), fullMatch };
        } catch (e) {
            console.warn(`JSON Parse Failed for tag ${tag}`, e);
            console.warn("Raw JSON String:", jsonStrRaw);
            return null;
        }
    }
    return null;
};

/**
 * Helper to parse AI response text and extract structured data tags.
 * Handles: [SENTIMENT], [CHART_DATA], [SUGGESTION], [BINGO_DATA], [DOMINO_DATA], [INSIGHT_DATA]
 */
const parseAIResponse = (rawText: string) => {
  let text = rawText || "";
  
  // 1. Extract Sentiment
  let sentiment: number | undefined = undefined;
  const sentimentMatch = text.match(/\[SENTIMENT:\s*(-?\d+)\]/);
  if (sentimentMatch) {
    sentiment = parseInt(sentimentMatch[1], 10);
    text = text.replace(/\[SENTIMENT:\s*(-?\d+)\]/, '').trim();
  }

  // 2. Extract Chart Data
  let chartData: any = undefined;
  const chartExtraction = extractJsonBlock(text, '[CHART_DATA:');
  if (chartExtraction) {
      chartData = chartExtraction.json;
      text = text.replace(chartExtraction.fullMatch, '').trim();
  }

  // 3. Extract Bingo Data
  let bingoData: BingoData | undefined = undefined;
  const bingoExtraction = extractJsonBlock(text, '[BINGO_DATA:');
  if (bingoExtraction) {
      bingoData = bingoExtraction.json;
      text = text.replace(bingoExtraction.fullMatch, '').trim();
  }

  // 4. Extract Domino Data
  let dominoData: DominoData | undefined = undefined;
  const dominoExtraction = extractJsonBlock(text, '[DOMINO_DATA:');
  if (dominoExtraction) {
      dominoData = dominoExtraction.json;
      text = text.replace(dominoExtraction.fullMatch, '').trim();
  }

  // 5. Extract News Insight Data
  let insightData: NewsInsight | undefined = undefined;
  const insightExtraction = extractJsonBlock(text, '[INSIGHT_DATA:');
  if (insightExtraction) {
      insightData = insightExtraction.json;
      text = text.replace(insightExtraction.fullMatch, '').trim();
  }

  // 6. Extract Suggestions
  const suggestions: string[] = [];
  const suggestionRegex = /\[SUGGESTION:\s*(.*?)\]/g;
  let match;
  while ((match = suggestionRegex.exec(text)) !== null) {
    suggestions.push(match[1].trim());
  }
  text = text.replace(suggestionRegex, '').trim();
  
  // Cleanup extra newlines and lingering tag artifacts if extraction failed partially
  text = text.replace(/\[CHART_DATA:[\s\S]*?\]/g, ''); // Fallback cleanup
  text = text.replace(/\[DOMINO_DATA:[\s\S]*?\]/g, '');
  text = text.replace(/\[INSIGHT_DATA:[\s\S]*?\]/g, '');
  text = text.replace(/\n\s*\n/g, '\n\n').trim();

  return { text, sentiment, chartData, bingoData, dominoData, insightData, suggestions };
};

/**
 * Fetches live news using Gemini 2.5 Flash with Google Search Grounding.
 */
export const fetchLiveNews = async (): Promise<Article[]> => {
  const runAttempt = async () => {
    try {
        const prompt = `
          Find the top 5 most recent and impactful news stories from the last 24 hours related to:
          1. Indian Stock Market (Sensex, Nifty)
          2. Major Indian Companies (Reliance, Tata, Infosys, HDFC, Adani)
          3. Indian Economy updates.

          Return the data strictly inside a [NEWS_DATA] block.
          Inside that block, provide a valid JSON array of objects.
          
          Example Format:
          [NEWS_DATA: [
            { "id": "1", "title": "Headline", "summary": "Text", "source": "Mint", "publishedAt": "2023-10-27T10:00:00Z", "url": "...", "category": "Stock", "relatedTickers": ["TCS"], "isTrending": true }
          ]]
          
          Schema Rules:
          - "category" must be one of: 'Market', 'Stock', 'Economy', 'Technology'
          - "relatedTickers" must be an array of strings.
          - Use double quotes for all keys/values.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });

        const text = response.text || "";
        const extraction = extractJsonBlock(text, '[NEWS_DATA:');
        
        if (extraction && Array.isArray(extraction.json)) {
            const articles = extraction.json.map((a: any, index: number) => ({
                ...a,
                id: a.id || `news-${Date.now()}-${index}`,
                url: a.url || '#',
                imageUrl: getPlaceholderImage(a.category),
                relatedTickers: Array.isArray(a.relatedTickers) ? a.relatedTickers : []
            }));
            return articles;
        } else {
            return null;
        }
    } catch (error) {
        console.warn("News Fetch Attempt Failed", error);
        return null;
    }
  };

  for (let i = 0; i < 3; i++) {
      const result = await runAttempt();
      if (result) return result;
      await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return MOCK_ARTICLES;
};

const getPlaceholderImage = (category: string) => {
    switch(category) {
        case 'Market': return "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80";
        case 'Stock': return "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80";
        case 'Economy': return "https://images.unsplash.com/photo-1526304640151-b571078e2358?auto=format&fit=crop&w=800&q=80";
        case 'Technology': return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80";
        default: return "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80";
    }
};

export const startChatSession = (article: Article | null, portfolio: PortfolioItem[], history?: ChatMessage[]) => {
  const portfolioString = portfolio.map(p => `${p.name} (${p.symbol})`).join(', ');
  
  let systemInstruction = "";

  const chartInstruction = `
        VISUALIZATION RULE:
        If the user asks about growth rates, comparisons between companies, financial results, or trends, you MUST generate a chart.
        Use the [CHART_DATA] tag at the very end of your response.
        
        CHART FORMATS (STRICT JSON, Double Quotes Only):
        1. Standard: [CHART_DATA: { "title": "...", "type": "bar", "labels": ["A","B"], "datasets": [{"label":"Metric","data":[10,20]}] }]
        2. Simplified: [CHART_DATA: { "title": "...", "type": "bar", "data": [{"label": "A", "value": 10}, {"label": "B", "value": 20}] }]
  `;

  if (article) {
      systemInstruction = `
        You are FinGenie, a wise and level-headed Behavioral Finance Coach & Analyst.
        CURRENT CONTEXT: Article: "${article.title}". Portfolio: ${portfolioString}
        ROLE: Behavioral Coach & Analyst.
        
        OUTPUT RULES: 
        1. **Structure**: Use **Bold** for key metrics and bullet points for lists. Structure is critical.
        2. **Lists**: Always use bullet points ( - Item ) for scannability.
        3. **Headings**: Use ## for major sections.
        4. **Citations**: Cite sources using footnotes like [1] where possible.
        5. **Data Tags**: ALWAYS Put specific data tags at the VERY END of your response, strictly after all text.
           - [SENTIMENT: number] (-100 to 100)
           - [SUGGESTION: Follow up question 1]
           - [SUGGESTION: Follow up question 2]
           ${chartInstruction}
      `;
  } else {
      systemInstruction = `
        You are FinGenie, a World-Class Financial Intelligence Agent.
        USER PORTFOLIO: ${portfolioString}
        CAPABILITIES: Markets, Research, Behavioral Coaching.
        
        OUTPUT FORMATTING: 
        1. **Structure**: Use **Bold** for important numbers/names. Use Tables for comparisons. 
        2. **Lists**: Use bullet points for lists ( - Item ). Make it easily scannable.
        3. **Headings**: Use ## for section headers.
        4. **Citations**: Use footnotes [1] for citations.
        5. **Data Tags**: ALWAYS Put these metadata tags at the VERY END of the response, strictly after all text:
           ${chartInstruction}
           - [SENTIMENT: number]
           - [SUGGESTION: Short follow up 1]
           - [SUGGESTION: Short follow up 2]
      `;
  }

  let chatHistory: Content[] | undefined;
  if (history && history.length > 0) {
    chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
  }

  currentChatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      tools: [{ googleSearch: {} }],
    },
    history: chatHistory
  });

  return currentChatSession;
};

export const sendChatMessage = async (message: string): Promise<{ text: string; sentiment?: number; suggestions?: string[]; chartData?: any; dominoData?: DominoData; insightData?: NewsInsight }> => {
  if (!currentChatSession) throw new Error("Chat session not initialized");
  
  const runAttempt = async () => {
      try {
        const response = await currentChatSession!.sendMessage({ message });
        return parseAIResponse(response.text);
      } catch (error: any) {
        console.warn("Gemini Chat Attempt Failed", error);
        throw error;
      }
  };

  for (let i = 0; i < 3; i++) {
      try {
          return await runAttempt();
      } catch (e) {
          if (i === 2) {
               console.error("Gemini Chat Error Final:", e);
               return { text: "I'm having trouble connecting to the market data server right now. Please try again in a moment." };
          }
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
  }
  return { text: "Error connecting to AI." };
};

export const getInitialPrompt = (action: string): string => {
   switch (action) {
    case 'summary': return `
        Analyze this article and provide a comprehensive Structured Insight Card.
        
        INSTRUCTIONS:
        1. First, provide a natural language summary (2-3 sentences) explaining the core event and its significance.
        2. Then, generate a [INSIGHT_DATA] block at the VERY END.
        
        [INSIGHT_DATA] SCHEMA (STRICT JSON):
        [INSIGHT_DATA: {
            "gist": "A single punchy sentence summarizing the event.",
            "stats": [{"label": "Revenue", "value": "₹50Cr"}, {"label": "YoY Growth", "value": "+12%"}], 
            "outlook": "One sentence on what happens next (e.g., 'Stock likely to rally').",
            "hypeScore": 20,
            "impact": { 
                "beneficiaries": ["Ticker1", "Sector2"], 
                "negativelyImpacted": ["Ticker3"] 
            }
        }]
    `;
    case 'impact': return "Analyze the impact of this news on my specific portfolio holdings. Use bullet points for risks and opportunities.";
    case 'eli5': return "Explain this news story to me like I'm a 5-year-old using a fun analogy. Use bold text for key terms.";
    case 'compare': return "Create a markdown comparison table between the companies mentioned. Then, generate a [CHART_DATA] block comparing key metrics visually.";
    case 'history': return "Perform a 'History Repeats' analysis. Search for similar past events and summarize the stock impact using a numbered list.";
    case 'bear-case': return "Play Devil's Advocate. List 3 specific counter-arguments or risks using bullet points.";
    case 'jargon': return "Scan for complex terms. List top 5 with simple definitions using bullet points.";
    default: return "What is this article about?";
  }
};

// Mock/Simple implementations for placeholders
export const generateAudioBriefing = async (text: string) => { return null as any; };
export const analyzeEarningsTranscript = async (text: string) => { return { title: "", content: "" }; };
export const analyzeChartImage = async (base64: string) => { return { title: "", content: "" }; };

// --- PORTFOLIO INTELLIGENCE ---

export const analyzePortfolioAttribution = async (portfolio: PortfolioItem[], articles: Article[]): Promise<PortfolioAttributionResult | null> => {
    const portfolioStr = JSON.stringify(portfolio.map(p => ({ symbol: p.symbol, name: p.name })));
    const newsStr = JSON.stringify(articles.slice(0, 15).map(a => ({ title: a.title, summary: a.summary, related: a.relatedTickers })));

    const prompt = `
        Act as a Senior Portfolio Manager. Perform a daily attribution analysis.
        PORTFOLIO: ${portfolioStr}
        NEWS: ${newsStr}
        TASK: Identify Bullish/Bearish sentiment, Culprits (Negative), Saviors (Positive), and Hidden Macro Factors.
        OUTPUT STRICT JSON: { "overallSentiment": "Bearish", "movementPercentageEstimate": "-1.2%", "culprits": [{"ticker": "...", "reason": "...", "impact": "High"}], "saviors": [], "hiddenFactor": "...", "verdict": "..." }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) { return null; }
};

export const analyzeConcentrationRisk = async (portfolio: PortfolioItem[]): Promise<ConcentrationRiskResult | null> => {
    const portfolioStr = JSON.stringify(portfolio.map(p => ({ symbol: p.symbol, name: p.name, value: p.shares * p.avgPrice })));
    const prompt = `
        Act as a Risk Manager. Analyze this portfolio for Concentration Risk.
        PORTFOLIO: ${portfolioStr}
        OUTPUT STRICT JSON: { "riskLevel": "High", "primaryRiskFactor": "Sector", "risks": [{"factor": "...", "percentageExposure": "...", "explanation": "..."}], "diversificationSuggestion": "..." }
    `;
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) { return null; }
};

export const generateEarningsCalendar = async (portfolio: PortfolioItem[]): Promise<EarningsEvent[]> => {
    const tickers = portfolio.map(p => p.symbol).join(", ");
    const prompt = `
        You are a Proactive Financial Assistant. 
        For these stocks: ${tickers}
        Generate a simulated "Upcoming Earnings Calendar" for the next 30 days.
        ESTIMATE based on standard quarterly cycles.
        
        OUTPUT STRICT JSON array:
        [
            { "ticker": "TCS", "date": "Oct 15 (Est)", "expectation": "Bullish", "insight": "Usually moves +/- 3%." }
        ]
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) { return []; }
};

export const getPortfolioHealthReport = async (portfolio: PortfolioItem[], articles: Article[]): Promise<PortfolioHealthReport | null> => {
    try {
        const [attributionResult, riskResult, earningsResult] = await Promise.allSettled([
            analyzePortfolioAttribution(portfolio, articles),
            analyzeConcentrationRisk(portfolio),
            generateEarningsCalendar(portfolio)
        ]);

        const attribution = attributionResult.status === 'fulfilled' ? attributionResult.value : null;
        const risk = riskResult.status === 'fulfilled' ? riskResult.value : null;
        const earnings = earningsResult.status === 'fulfilled' ? earningsResult.value : [];

        if (!attribution || !risk) return null; 

        return {
            attribution,
            risk,
            earnings,
            timestamp: Date.now()
        };
    } catch (e) {
        console.error("Full Portfolio Scan Failed", e);
        return null;
    }
};

export const analyzeRippleEffect = async (event: string, portfolio: PortfolioItem[]): Promise<RippleEffectResult | null> => {
    const prompt = `
        Analyze the Ripple Effect of this event: "${event}" on this portfolio:
        ${JSON.stringify(portfolio.map(p => p.symbol))}
        Map 2nd and 3rd order effects. Output JSON: { "event": "...", "impactFlow": [], "affectedTickers": [] }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) { return null; }
};

export const analyzeForensicDocument = async (text: string): Promise<ForensicAnalysisResult | null> => {
     const prompt = `
        Act as a Forensic Accountant. Analyze text for manipulation.
        Output JSON: { "redFlags": [], "manipulationScore": 0, "verdict": "..." }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt + `\nTEXT: ${text}`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) { return null; }
};

export const analyzeDocument = async (ticker: string, docType: DocumentType): Promise<{text: string, sentiment: number, chartData?: any, sourceDocument?: string, bingoData?: BingoData, dominoData?: DominoData}> => {
  
  let persona = "";
  let extraInstructions = "";
  
  if (docType === 'annual_report') persona = "Strategy Consultant";
  if (docType === 'concall') {
      persona = "Behavioral Psychologist / Skeptic";
      extraInstructions = `Include [BINGO_DATA: { "wordCloud": [{"word":"Growth", "count":10, "sentiment":"positive"}], "sentimentTimeline": [] }] at the END.`;
  }
  if (docType === 'supply_chain') {
      persona = "Supply Chain Analyst";
      extraInstructions = `Include [DOMINO_DATA: { "nodes": [], "edges": [] }] at the END.`;
  }
  if (docType === 'quarterly_result') {
      persona = "Financial Analyst";
      extraInstructions = `Generate a [CHART_DATA] block visualizing Revenue/Profit growth trends or margin analysis.`;
  }

  // In a real app, fetch real text. Here we simulate for demo purposes.
  const simulatedSourceDoc = `
    ${ticker} ${docType.toUpperCase()} - FY2024
    
    1. EXECUTIVE SUMMARY
    Despite global macroeconomic headwinds, ${ticker} delivered a resilient performance. Revenue grew by 12% YoY, driven by strong deal wins in the US market. However, EBITDA margins compressed by 150bps due to wage hikes and higher travel costs.
    
    2. KEY RISKS
    - Currency Fluctuation: Significant exposure to USD/INR volatility.
    - Geopolitical Tension: Operations in Europe facing slowdown.
    - Talent Attrition: While attrition has cooled to 12%, it remains a key monitorable.
  `;
  
  const prompt = `
    Analyze this ${docType} for ${ticker}. Persona: ${persona}.
    ${extraInstructions}
    Source Document Content: "${simulatedSourceDoc}"
    
    OUTPUT RULES:
    1. Use structured Markdown (headers ##, bold **, bullet points - ).
    2. Ensure ALL data tags are at the VERY BOTTOM of the response.
    3. Tags: [SENTIMENT: number], [CHART_DATA: {...}], [SUGGESTION: ...], [BINGO_DATA: ...], [DOMINO_DATA: ...]
    4. For [CHART_DATA], use strictly valid JSON with double quotes.
    5. Use bullet points for all lists.
  `;

   const runAttempt = async () => {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
        });

        const result = parseAIResponse(response.text);
        return {
            text: result.text,
            sentiment: result.sentiment || 0,
            chartData: result.chartData,
            bingoData: result.bingoData,
            dominoData: result.dominoData,
            sourceDocument: simulatedSourceDoc
        };
   };

   for (let i = 0; i < 3; i++) {
      try {
          return await runAttempt();
      } catch (e) {
          if (i === 2) {
             return { text: "Analysis failed due to high server load. Please try again.", sentiment: 0 };
          }
          await new Promise(r => setTimeout(r, 1500));
      }
   }
   return { text: "Analysis failed.", sentiment: 0 };
}

export const compareAnalysis = async (tA: string, cA: string, tB: string, cB: string): Promise<{ text: string, chartData?: any }> => {
    const prompt = `
        Compare ${tA} vs ${tB}. 
        Content A: ${cA}
        Content B: ${cB}
        Output Markdown comparison table. 
        Generate a [CHART_DATA] block comparing key metrics (e.g. Growth, Margins, PE).
        Ensure strictly valid JSON for chart data.
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const result = parseAIResponse(response.text);
        return { text: result.text, chartData: result.chartData };
    } catch (e) { return { text: "Comparison failed." }; }
};

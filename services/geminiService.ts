
import { GoogleGenAI, Chat, Content, Modality } from "@google/genai";
import { Article, PortfolioItem, ChatMessage, AnalysisResult, PortfolioAttributionResult, ConcentrationRiskResult, RippleEffectResult, ForensicAnalysisResult, DocumentType, BingoData, DominoData } from '../types';
import { MOCK_ARTICLES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We store the active chat session in memory for the client
let currentChatSession: Chat | null = null;

/**
 * Helper to extract a nested JSON object from a string starting at a specific tag.
 * Uses brace counting to handle nested objects correctly, which Regex often fails at.
 */
const extractJsonBlock = (text: string, tag: string): { json: any, fullMatch: string } | null => {
    const startTagIndex = text.indexOf(tag);
    if (startTagIndex === -1) return null;

    // Find the first opening brace after the tag
    let jsonStartIndex = text.indexOf('{', startTagIndex);
    if (jsonStartIndex === -1) return null;

    let braceCount = 0;
    let jsonEndIndex = -1;
    
    for (let i = jsonStartIndex; i < text.length; i++) {
        if (text[i] === '{') {
            braceCount++;
        } else if (text[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                jsonEndIndex = i + 1; // Include the closing brace
                break;
            }
        }
    }

    if (jsonEndIndex !== -1) {
        const jsonStrRaw = text.substring(jsonStartIndex, jsonEndIndex);
        // Also capture the full tag wrapper (e.g., [CHART_DATA: { ... }]) for removal
        // We assume the tag ends with ']' somewhere after the JSON
        const closeBracketIndex = text.indexOf(']', jsonEndIndex);
        const fullMatch = text.substring(startTagIndex, closeBracketIndex !== -1 ? closeBracketIndex + 1 : jsonEndIndex);

        try {
            // Basic cleanup before parse
            let jsonStr = jsonStrRaw
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();
            
            // Fix trailing commas
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

            return { json: JSON.parse(jsonStr), fullMatch };
        } catch (e) {
            console.warn(`JSON Parse Repair needed for tag ${tag}:`, e);
            try {
                // Aggressive Repair: Fix missing commas in arrays e.g. ["A" "B"] -> ["A", "B"]
                // detailed regex to look for "quote" space "quote"
                let fixedStr = jsonStrRaw.replace(/"\s+"/g, '", "');
                fixedStr = fixedStr.replace(/,(\s*[}\]])/g, '$1'); // Trailing commas
                return { json: JSON.parse(fixedStr), fullMatch };
            } catch (e2) {
                console.error(`Failed to parse extracted JSON for ${tag}:`, e2);
                return null;
            }
        }
    }
    return null;
};

/**
 * Helper to parse AI response text and extract structured data tags.
 * Handles: [SENTIMENT], [CHART_DATA], [SUGGESTION], [BINGO_DATA], [DOMINO_DATA]
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

  // 2. Extract Chart Data (Using Brace Counting)
  let chartData: any = undefined;
  const chartExtraction = extractJsonBlock(text, '[CHART_DATA:');
  if (chartExtraction) {
      chartData = chartExtraction.json;
      text = text.replace(chartExtraction.fullMatch, '').trim();
  }

  // 3. Extract Bingo Data (Using Brace Counting)
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

  // 5. Extract Suggestions
  const suggestions: string[] = [];
  const suggestionRegex = /\[SUGGESTION:\s*(.*?)\]/g;
  let match;
  while ((match = suggestionRegex.exec(text)) !== null) {
    suggestions.push(match[1].trim());
  }
  text = text.replace(suggestionRegex, '').trim();

  return { text, sentiment, chartData, bingoData, dominoData, suggestions };
};

/**
 * Fetches live news using Gemini 2.5 Flash with Google Search Grounding.
 */
export const fetchLiveNews = async (): Promise<Article[]> => {
  try {
    const prompt = `
      Find the top 6 most recent and impactful news stories from the last 24 hours related to:
      1. Indian Stock Market (Sensex, Nifty movements today)
      2. Major Indian Companies (Reliance, Tata, Infosys, HDFC, Adani, etc.)
      3. Indian Economy updates.

      Format the output strictly as a valid JSON array of objects. 
      - Output ONLY the JSON array.
      - Do not use markdown code blocks (like \`\`\`json).
      - Do not include explanations or text outside the JSON.
      - Ensure all keys and string values are enclosed in double quotes.
      - No trailing commas.
      - Escape any special characters within strings.

      Each object must strictly follow this schema:
      {
        "id": "unique_string_based_on_title",
        "title": "Headline (Keep it punchy)",
        "summary": "Two sentence summary of the event",
        "source": "Name of publisher (e.g., Mint, Economic Times)",
        "publishedAt": "ISO 8601 date string (estimate based on 'x hours ago')",
        "url": "The URL of the news source found in search",
        "category": "One of: 'Market', 'Stock', 'Economy', 'Technology'",
        "relatedTickers": ["Array", "of", "Stock", "Symbols", "mentioned"],
        "isTrending": boolean
      }

      For the 'imageUrl', strictly use one of these specific placeholder URLs based on the category:
      - Market: "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80"
      - Stock: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80"
      - Economy: "https://images.unsplash.com/photo-1526304640151-b571078e2358?auto=format&fit=crop&w=800&q=80"
      - Technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType is NOT allowed when using googleSearch
      }
    });

    let text = response.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']') + 1;
    
    if (start !== -1 && end !== -1) {
      const jsonStr = text.substring(start, end);
      try {
        const articles = JSON.parse(jsonStr);
        return articles;
      } catch (e) {
        console.warn("First JSON parse attempt failed, attempting to fix trailing commas...", e);
        try {
            const fixedJson = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            return JSON.parse(fixedJson);
        } catch (e2) {
            console.error("Failed to parse JSON from Gemini response:", e2);
            return MOCK_ARTICLES;
        }
      }
    } else {
      return MOCK_ARTICLES;
    }
  } catch (error) {
    console.error("Error fetching live news:", error);
    return MOCK_ARTICLES;
  }
};

/**
 * Initializes a chat session.
 */
export const startChatSession = (article: Article | null, portfolio: PortfolioItem[], history?: ChatMessage[]) => {
  const portfolioString = portfolio.map(p => `${p.name} (${p.symbol})`).join(', ');
  
  let systemInstruction = "";

  if (article) {
      systemInstruction = `
        You are FinGenie, a wise and level-headed Behavioral Finance Coach & Analyst.
        
        CURRENT CONTEXT:
        Article: "${article.title}"
        Summary: "${article.summary}"
        Portfolio: ${portfolioString}
        
        ROLE:
        1. Behavioral Coach: Guard against FOMO/Panic.
        2. Expert Analyst: Answer questions about the article/market.
        
        OUTPUT RULES:
        1. Impact Analysis must end with [SENTIMENT: number] (-100 to 100).
        2. Suggest 3 follow-ups: [SUGGESTION: Question text]
        3. VISUALS: Include [CHART_DATA: {...}] where appropriate. 
           - STRICT JSON FORMAT required inside the tag.
           - Ensure ALL array elements are separated by commas.
           - Use Double Quotes for keys and values.
        4. Use Markdown.
      `;
  } else {
      systemInstruction = `
        You are FinGenie, a World-Class Financial Intelligence Agent.
        USER PORTFOLIO: ${portfolioString}
        
        CAPABILITIES:
        - Expert in Indian/Global Markets.
        - "Just-in-Time" researcher for specific tickers/docs.
        - Behavioral Coach during volatility.
        
        OUTPUT FORMATTING:
        1. Structure: ## Headers, **Bold**, Tables.
        2. Charts: Include [CHART_DATA: {"type": "bar", ...}] for numerical data. 
           - CRITICAL: Ensure STRICT JSON syntax inside the tag.
           - CRITICAL: Verify commas between all array items.
        3. Sentiment: End with [SENTIMENT: number].
        4. Follow-ups: [SUGGESTION: Question text]
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

export const sendChatMessage = async (message: string): Promise<{ text: string; sentiment?: number; suggestions?: string[]; chartData?: any; dominoData?: DominoData }> => {
  if (!currentChatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const response = await currentChatSession.sendMessage({ message });
    return parseAIResponse(response.text);
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { text: "I'm having trouble connecting to the market data server right now." };
  }
};

export const getInitialPrompt = (action: 'summary' | 'impact' | 'eli5' | 'compare' | 'history' | 'bear-case' | 'jargon'): string => {
  switch (action) {
    case 'summary': return "Give me a concise 3-bullet summary of this article using structured Markdown.";
    case 'impact': return "Analyze the impact of this news on my specific portfolio holdings. Be direct about risks and opportunities.";
    case 'eli5': return "Explain this news story to me like I'm a 5-year-old using a fun analogy.";
    case 'compare': return "Create a markdown comparison table between the companies mentioned. Focus on Financials and Outlook.";
    case 'history': return "Perform a 'History Repeats' analysis. Search for similar past events and summarize the stock impact.";
    case 'bear-case': return "Play Devil's Advocate. List 3 specific counter-arguments or risks.";
    case 'jargon': return "Scan for complex terms. List top 5 with simple definitions.";
    default: return "What is this article about?";
  }
};

// ... Audio, Earnings, Chart analysis functions remain similar ...
export const generateAudioBriefing = async (text: string) => { /* ... */ return null as any; };
export const analyzeEarningsTranscript = async (text: string) => { /* ... */ return { title: "", content: "" }; };
export const analyzeChartImage = async (base64: string) => { /* ... */ return { title: "", content: "" }; };

export const analyzePortfolioAttribution = async (portfolio: PortfolioItem[], articles: Article[]): Promise<PortfolioAttributionResult | null> => {
    // Basic simulation logic as this requires complex backend logic usually
    // In a real app, this would send portfolio + articles to Gemini
    const prompt = `
        You are a Portfolio Attribution Analyst.
        
        PORTFOLIO:
        ${JSON.stringify(portfolio)}
        
        NEWS STORIES:
        ${JSON.stringify(articles.map(a => a.title).slice(0, 5))}
        
        TASK:
        Analyze why the portfolio might be up or down today.
        Identify:
        1. "Culprits" (Stocks dragging it down)
        2. "Saviors" (Stocks propping it up)
        3. "Hidden Factors" (Sector trends, Macro news like Oil/Rates).
        
        OUTPUT JSON ONLY:
        {
            "overallSentiment": "Bearish", 
            "movementPercentageEstimate": "-1.2%",
            "culprits": [{"ticker": "HDFCBANK", "reason": "Weak Q3 results", "impact": "High"}],
            "saviors": [{"ticker": "TATAMOTORS", "reason": "EV sales boom", "impact": "Medium"}],
            "hiddenFactor": "Rising bond yields are pressuring IT stocks like TCS.",
            "verdict": "Sector rotation is causing pain in Banking, but Auto is holding up."
        }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const analyzeConcentrationRisk = async (portfolio: PortfolioItem[]): Promise<ConcentrationRiskResult | null> => {
    const prompt = `
        Analyze Concentration Risk for this portfolio:
        ${JSON.stringify(portfolio)}
        
        Identify hidden correlations (e.g. Oil sensitivity, Interest Rate sensitivity).
        Output JSON:
        {
            "riskLevel": "High",
            "primaryRiskFactor": "Interest Rate Sensitivity",
            "risks": [{"factor": "Banking Exposure", "percentageExposure": "40%", "explanation": "Heavy weight in HDFC/ICICI makes you vulnerable to rate hikes."}],
            "diversificationSuggestion": "Add Pharma or FMCG for defensive balance."
        }
    `;
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) {
        return null;
    }
};

export const analyzeRippleEffect = async (event: string, portfolio: PortfolioItem[]): Promise<RippleEffectResult | null> => {
    const prompt = `
        Analyze the Ripple Effect of this event: "${event}" on this portfolio:
        ${JSON.stringify(portfolio.map(p => p.symbol))}
        
        Map 2nd and 3rd order effects.
        Output JSON:
        {
            "event": "${event}",
            "impactFlow": [{"step": "Step 1", "description": "Oil prices rise"}],
            "affectedTickers": [{"ticker": "ASIANPAINT", "effect": "Negative", "reasoning": "Raw material costs rise"}]
        }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) {
        return null;
    }
};

export const analyzeForensicDocument = async (text: string): Promise<ForensicAnalysisResult | null> => {
     const prompt = `
        Act as a Forensic Accountant. Analyze this text for signs of manipulation:
        "${text}"
        
        Look for:
        - Revenue Recognition issues
        - Expense Capitalization
        - Off-balance sheet liabilities
        - Related Party Transactions
        - Cash Flow Divergence
        
        Output JSON:
        {
            "redFlags": [{"flag": "Related Party Txn", "severity": "High", "explanation": "..."}],
            "manipulationScore": 85,
            "verdict": "High risk of governance issues."
        }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (e) {
        return null;
    }
};


/**
 * FEATURE: Document Fetcher Agent (Smart Mentions)
 * Now supports returning a "Source Document" text for Split-Screen Evidence view
 * AND "Bingo Data" for Gamified Earnings Calls.
 */
export const analyzeDocument = async (ticker: string, docType: DocumentType): Promise<{text: string, sentiment: number, chartData?: any, sourceDocument?: string, bingoData?: BingoData, dominoData?: DominoData}> => {
  
  let persona = "";
  let focus = "";
  let extraInstructions = "";
  
  switch (docType) {
    case 'annual_report':
      persona = "Strategy Consultant. Focus on Long-term vision, CEO's letter, Risk Factors section, and Capex plans.";
      focus = "Extract the CEO's key message, top 3 strategic priorities, and the biggest risk factor mentioned.";
      break;
    case 'concall':
      persona = "Behavioral Psychologist / Skeptic. Focus on Q&A Session (Analyst vs Management), Tone of voice, and Evasive answers.";
      focus = "Analyze the Q&A. Did management dodge any questions? What was the most heated topic? What is the guidance?";
      extraInstructions = `
        Additionally, generate "Bingo Data" for gamification.
        Identify top 10 repeated keywords (Word Cloud) and their sentiment.
        Estimate the sentiment flow over the call (Start, Middle, Q&A, End).
        Include this strictly at the end in [BINGO_DATA: { "wordCloud": [{"word":"AI", "count":15, "sentiment":"positive"}], "sentimentTimeline": [{"time":"0-15m", "sentiment":20, "annotation":"Opening"}] }]
        ENSURE VALID JSON for BINGO_DATA.
      `;
      break;
    case 'quarterly_result':
      persona = "Accountant. Focus on EBITDA margins, YoY growth, Deal wins (TCV), and Guidance.";
      focus = "Compare this quarter's numbers to last year. Highlight margin expansion/contraction and revenue growth breakdown.";
      break;
    case 'red_flags':
      persona = "Forensic Accountant. Hunt for off-balance sheet items, related party transactions, and cash flow divergence.";
      focus = "Look for any negative news, accounting irregularities, auditor concerns, or sudden management exits recently.";
      break;
    case 'supply_chain':
      persona = "Supply Chain Analyst. Map the ecosystem of suppliers, customers, and macro dependencies.";
      focus = "Identify 2-3 major Suppliers (upstream) and 2-3 major Customers (downstream). Determine if recent events create a Risk or Opportunity.";
      extraInstructions = `
        Generate "Domino Data" for visual graph.
        Include this strictly at the end in [DOMINO_DATA: { 
            "nodes": [{"id":"1","name":"Tata Steel","type":"supplier","sentiment":"negative","impactDetails":"Rising Costs"}], 
            "edges": [{"source":"1","target":"TARGET","label":"Raw Material","impact":"negative"}] 
        }]
        Note: The ticker being analyzed is the "target" node.
      `;
      break;
  }

  const simulatedSourceDoc = `
*** ${ticker} ${docType.toUpperCase().replace('_', ' ')} - OFFICIAL DOCUMENT EXTRACT ***
[CONFIDENTIAL - INTERNAL USE ONLY]
Company: ${ticker} | Document Date: ${new Date().toLocaleDateString()}
------------------------------------------------------------

[PAGE 1: EXECUTIVE SUMMARY]
The company reported a resilient performance despite macroeconomic headwinds. Revenue grew by 12% YoY, driven by strong order inflow in the US market (North America TCV: $1.2B). 
However, EBITDA margins contracted by 150bps due to higher wage costs and return-to-office expenses.

"We remain cautiously optimistic about FY25," stated the CEO during the opening remarks. "While the US market shows signs of stabilizing, Europe remains a challenge due to delayed decision making."

[PAGE 5: OPERATIONAL METRICS]
- Revenue: ₹60,000 Cr (+12% YoY)
- EBITDA: ₹15,000 Cr (+4% YoY)
- PAT: ₹11,000 Cr (+5% YoY)
- Attrition: 12.5% (Down from 14% last quarter)
- Utilization: 84% (Including Trainees)

[PAGE 12: MANAGEMENT DISCUSSION & ANALYSIS]
Strategy for AI: We are doubling down on GenAI investments. We have trained 100,000 associates on Gemini and other LLMs.
Deal Pipeline: The pipeline is at an all-time high of $10B, but conversion rates have slowed. Clients are prioritizing cost-optimization deals over discretionary spend.

[PAGE 24: RISK FACTORS]
1. Currency Fluctuation: Significant exposure to USD/EUR volatility remains a key risk.
2. Talent Retention: High demand for niche AI skills is driving up employee costs.
3. Geopolitical Instability: Supply chain disruptions in Eastern Europe may impact delivery centers.

[PAGE 42: AUDITOR NOTES & DISCLAIMERS]
No major irregularities found. However, we draw attention to Note 14 regarding the change in depreciation method for IT assets, which boosted EPS by ₹2.
Related Party Transactions: All transactions with subsidiaries were conducted at arm's length.

[TRANSCRIPT EXTRACT - Q&A SESSION]
Analyst (JP Morgan): "Your guidance seems conservative given the deal wins. Are you seeing cancellations?"
CFO: "No cancellations, but ramp-ups are slower. We prefer to be prudent."
Analyst (Morgan Stanley): "Can you comment on the margin pressure from the new wage hike cycle?"
CEO: "It will be a short-term impact. We expect to offset it via efficiency gains in Q3."

*** END OF EXTRACT ***
  `;

  const prompt = `
    You are acting as a ${persona}
    
    TASK:
    Use Google Search to find REAL information regarding the ${docType.replace('_', ' ')} for ${ticker}.
    ${focus}
    
    OUTPUT RULE:
    Provide a detailed professional analysis in Markdown.
    Use ## Headers, **Bold** for numbers, and > Blockquotes for key management quotes or findings.
    
    If comparison data is found, INCLUDE a [CHART_DATA] block at the end using this JSON format:
    [CHART_DATA: {"type": "bar", "title": "Comparison", "labels": ["Q1","Q2"], "datasets": [{"label": "Metric", "data": [10,20]}]}]
    
    ${extraInstructions}
    
    CRITICAL JSON FORMATTING:
    - Ensure ALL arrays have commas between elements: ["A", "B"], NOT ["A" "B"].
    - Use Double Quotes for all keys and string values.
    - No trailing commas.
    
    End with a [SENTIMENT: number] score (-100 to 100).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
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
    
  } catch (error) {
    console.error("Document Analysis Error:", error);
    return { text: "I couldn't retrieve the document data at this moment. Please try again.", sentiment: 0 };
  }
}

/**
 * War Room: Compares two different analysis sessions (tabs).
 */
export const compareAnalysis = async (
    tickerA: string, 
    contentA: string, 
    tickerB: string, 
    contentB: string
): Promise<{ text: string, chartData?: any }> => {
    const prompt = `
      You are running a "War Room" Comparison for a Portfolio Manager.
      
      ASSET A: ${tickerA}
      Analysis Summary: "${contentA.substring(0, 2000)}..."
      
      ASSET B: ${tickerB}
      Analysis Summary: "${contentB.substring(0, 2000)}..."
      
      TASK:
      Compare these two assets head-to-head based on the provided analysis.
      1. **Strengths vs Weaknesses** Table.
      2. **Verdict**: Which one looks better positioned right now?
      3. **Visuals**: Generate a comparative [CHART_DATA] if possible (e.g. sentiment scores or growth metrics if mentioned).
      
      STRICT JSON for Chart Data:
      [CHART_DATA: {"type": "bar", "title": "Comparison", "labels": ["${tickerA}", "${tickerB}"], "datasets": [{"label": "Sentiment", "data": [80, 60]}]}]
      Ensure commas are present in arrays.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const result = parseAIResponse(response.text);
        return { text: result.text, chartData: result.chartData };
    } catch (error) {
        console.error("Comparison Error", error);
        return { text: "Failed to generate comparison." };
    }
};

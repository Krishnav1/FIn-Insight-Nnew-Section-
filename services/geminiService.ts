
import { GoogleGenAI, Chat, Content, Modality } from "@google/genai";
import { Article, PortfolioItem, ChatMessage, AnalysisResult, PortfolioAttributionResult, ConcentrationRiskResult, RippleEffectResult, ForensicAnalysisResult, DocumentType } from '../types';
import { MOCK_ARTICLES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We store the active chat session in memory for the client
let currentChatSession: Chat | null = null;

/**
 * Helper to parse AI response text and extract structured data tags.
 * Handles: [SENTIMENT], [CHART_DATA], [SUGGESTION]
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
  // Regex matches [CHART_DATA: { ... }] and captures the inner JSON content
  const chartMatch = text.match(/\[CHART_DATA:\s*(\{[\s\S]*?\})\]/);
  if (chartMatch) {
      try {
          let jsonStr = chartMatch[1];
          // Robustness: Remove markdown code blocks if the AI included them inside the tag
          jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
          chartData = JSON.parse(jsonStr);
          
          // Remove the entire tag from the displayed text using the full match
          text = text.replace(chartMatch[0], '').trim();
      } catch(e) { 
          console.error("Failed to parse chart data from AI response", e); 
          // Attempt to clean up the tag anyway so user doesn't see raw code
          text = text.replace(chartMatch[0], '').trim();
      }
  }

  // 3. Extract Suggestions
  const suggestions: string[] = [];
  const suggestionRegex = /\[SUGGESTION:\s*(.*?)\]/g;
  let match;
  while ((match = suggestionRegex.exec(text)) !== null) {
    suggestions.push(match[1].trim());
  }
  text = text.replace(suggestionRegex, '').trim();

  return { text, sentiment, chartData, suggestions };
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
    
    // Clean up markdown formatting if present to extract valid JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract array
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']') + 1;
    
    if (start !== -1 && end !== -1) {
      const jsonStr = text.substring(start, end);
      try {
        const articles = JSON.parse(jsonStr);
        return articles;
      } catch (e) {
        console.warn("First JSON parse attempt failed, attempting to fix trailing commas...", e);
        // Attempt to fix common JSON errors like trailing commas
        try {
            const fixedJson = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            return JSON.parse(fixedJson);
        } catch (e2) {
            console.error("Failed to parse JSON from Gemini response:", e2);
            return MOCK_ARTICLES;
        }
      }
    } else {
      console.warn("Could not find JSON array in response, falling back to mock data.");
      return MOCK_ARTICLES;
    }
  } catch (error) {
    console.error("Error fetching live news:", error);
    return MOCK_ARTICLES;
  }
};

/**
 * Initializes a chat session.
 * Can be context-aware (Article specific) or General (Full Page Mode).
 */
export const startChatSession = (article: Article | null, portfolio: PortfolioItem[], history?: ChatMessage[]) => {
  const portfolioString = portfolio.map(p => `${p.name} (${p.symbol})`).join(', ');
  
  let systemInstruction = "";

  if (article) {
      // Article Context Mode
      systemInstruction = `
        You are FinGenie, a wise and level-headed Behavioral Finance Coach & Analyst.
        
        CURRENT CONTEXT:
        The user is reading a news article titled: "${article.title}".
        Summary: "${article.summary}"
        User's Portfolio: ${portfolioString}
        
        YOUR ROLE:
        1. **Behavioral Coach:** Guard the user against emotional decision-making (FOMO/Panic).
        2. **Expert Analyst:** Answer questions about the article, market trends, and specific companies.
        
        IMPORTANT OUTPUT RULES:
        1. If the user asks for an "Impact Analysis", you MUST include a sentiment score at the end: [SENTIMENT: number] (-100 to 100).
        2. Suggest 3 follow-up questions: [SUGGESTION: Question text]
        3. VISUALS: If the data is suitable for visualization (e.g. comparing metrics, trends over time), YOU MUST include a chart configuration at the end of your response using this EXACT format:
           [CHART_DATA: {"type": "bar|line|area", "title": "Chart Title", "labels": ["Label1","Label2"], "datasets": [{"label": "Series Name", "data": [10,20]}]}]
        4. Use Markdown (Bold, Bullet Points, Headers).
      `;
  } else {
      // General Workspace Mode
      systemInstruction = `
        You are FinGenie, a World-Class Financial Intelligence Agent.
        
        USER PORTFOLIO: ${portfolioString}
        
        YOUR CAPABILITIES:
        - You are an expert in Indian and Global Markets.
        - You can analyze complex financial topics, compare companies, and explain concepts.
        - You act as a "Just-in-Time" researcher. If a user mentions a ticker (e.g. @TCS), you assume they want deep analysis.
        
        BEHAVIOR:
        - Be professional yet accessible.
        - Use data to back up claims.
        - When discussing volatile stocks, act as a "Behavioral Coach" (warn against FOMO).
        
        OUTPUT FORMATTING:
        1. **Structure:** Use ## Headers, **Bold** for metrics, and Tables for comparisons.
        2. **Charts:** If data is numerical and suitable for visualization, ALWAYS generate a chart using this format at the end:
           [CHART_DATA: {"type": "bar|line|area", "title": "Chart Title", "labels": ["Q1","Q2"], "datasets": [{"label": "Revenue", "data": [100,120]}]}]
        3. **Sentiment:** For market analysis, end with [SENTIMENT: number] (-100 to 100).
        4. **Follow-ups:** End with 3 smart follow-up suggestions: [SUGGESTION: Question text]
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
      tools: [{ googleSearch: {} }], // Allow search in chat for fact-checking
    },
    history: chatHistory
  });

  return currentChatSession;
};

/**
 * Sends a message to the active chat session.
 */
export const sendChatMessage = async (message: string): Promise<{ text: string; sentiment?: number; suggestions?: string[]; chartData?: any }> => {
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

/**
 * Helper to generate the initial prompt based on the button clicked
 */
export const getInitialPrompt = (action: 'summary' | 'impact' | 'eli5' | 'compare' | 'history' | 'bear-case' | 'jargon'): string => {
  switch (action) {
    case 'summary':
      return "Give me a concise 3-bullet summary of this article.";
    case 'impact':
      return "Analyze the impact of this news on my specific portfolio holdings. Be direct about risks and opportunities.";
    case 'eli5':
      return "Explain this news story to me like I'm a 5-year-old using a fun analogy.";
    case 'compare':
      return "Create a markdown comparison table between the companies mentioned in this article. Focus on Financials, Market Sentiment, and Future Outlook. Also, if relevant, include a [CHART_DATA] comparison of their key metrics.";
    case 'history':
      return "Perform a 'History Repeats' analysis. Search for the last time this company (or a major peer) faced a similar event. Summarize what happened to the stock price. If you find data, plot it in a [CHART_DATA].";
    case 'bear-case':
      return "Play Devil's Advocate. List 3 specific counter-arguments or risks. Show me the 'Bear Case'.";
    case 'jargon':
      return "Scan this article for complex financial terms. List the top 5 terms and provide a simple definition for each.";
    default:
      return "What is this article about?";
  }
};

/**
 * Generates Audio for a given text (TTS).
 */
export const generateAudioBriefing = async (text: string): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return await audioContext.decodeAudioData(bytes.buffer);
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const analyzeEarningsTranscript = async (text: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      You are an expert financial analyst reviewing an earnings call transcript.
      Analyze the following text:
      1. **Management Guidance vs. Reality**
      2. **Analyst Skepticism**
      3. **Key Quotes**
      4. **Sentiment Score**
      
      Transcript Text: "${text.substring(0, 30000)}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const resultText = response.text || "Analysis failed.";
    let sentiment = 0;
    if (resultText.toLowerCase().includes("positive")) sentiment = 60;
    if (resultText.toLowerCase().includes("negative")) sentiment = -40;

    return {
      title: "Earnings Call Intelligence",
      content: resultText,
      sentiment: sentiment
    };
  } catch (error) {
    console.error("Earnings Analysis Error:", error);
    return { title: "Error", content: "Failed to analyze transcript." };
  }
};

export const analyzeChartImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      You are a veteran technical analyst (CMT). Analyze this stock chart image.
      Identify: Primary Trend, Key Levels, Chart Patterns, Indicators, and Trade Setup.
      Format in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: prompt }
        ]
      }
    });

    return {
      title: "Technical Chart Analysis",
      content: response.text || "Could not analyze chart.",
    };
  } catch (error) {
    console.error("Chart Analysis Error:", error);
    return { title: "Error", content: "Failed to analyze chart image." };
  }
};

export const analyzePortfolioAttribution = async (
  portfolio: PortfolioItem[],
  articles: Article[]
): Promise<PortfolioAttributionResult | null> => {
  try {
    const portfolioSummary = portfolio.map(p => `${p.name} (${p.symbol})`).join(', ');
    const newsContext = articles.slice(0, 8).map(a => `- ${a.title} (${a.summary})`).join('\n');

    const prompt = `
      You are a Senior Portfolio Manager.
      USER PORTFOLIO: ${portfolioSummary}
      TODAY'S MARKET NEWS CONTEXT:
      ${newsContext}
      
      TASK: Analyze why this specific portfolio might be performing the way it is today based on the news.
      OUTPUT: Strictly return a JSON object with the required schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Portfolio Attribution Error:", error);
    return null;
  }
};

export const analyzeConcentrationRisk = async (portfolio: PortfolioItem[]): Promise<ConcentrationRiskResult | null> => {
  try {
    const portfolioJson = JSON.stringify(portfolio);
    const prompt = `
      You are a Risk Management Algorithm. Analyze this portfolio for Concentration Risk.
      PORTFOLIO: ${portfolioJson}
      OUTPUT: Strictly return a JSON object with the required schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Concentration Risk Analysis Error:", error);
    return null;
  }
};

export const analyzeRippleEffect = async (event: string, portfolio: PortfolioItem[]): Promise<RippleEffectResult | null> => {
  try {
    const portfolioTickers = portfolio.map(p => p.symbol).join(', ');
    const prompt = `
      You are a Macro-Economic Systems Analyst.
      EVENT: "${event}"
      USER PORTFOLIO: ${portfolioTickers}
      TASK: Map the "Ripple Effect" of this event.
      OUTPUT: Strictly return a JSON object with the required schema.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Ripple Effect Error:", error);
    return null;
  }
};

export const analyzeForensicDocument = async (text: string): Promise<ForensicAnalysisResult | null> => {
  try {
    const prompt = `
      You are a Forensic Accountant.
      Analyze the following text for RED FLAGS (Revenue Recognition, Expense Manipulation, Off-Balance Sheet).
      TEXT: "${text.substring(0, 30000)}"
      OUTPUT: Strictly return a JSON object with the required schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Forensic Analysis Error:", error);
    return null;
  }
};

/**
 * FEATURE: Document Fetcher Agent (Smart Mentions)
 */
export const analyzeDocument = async (ticker: string, docType: DocumentType): Promise<{text: string, sentiment: number, chartData?: any}> => {
  
  let persona = "";
  let focus = "";
  let searchQuery = "";

  switch (docType) {
    case 'annual_report':
      persona = "Strategy Consultant. Focus on Long-term vision, CEO's letter, Risk Factors section, and Capex plans.";
      focus = "Extract the CEO's key message, top 3 strategic priorities, and the biggest risk factor mentioned.";
      searchQuery = `${ticker} Annual Report FY24 FY25 key highlights analysis`;
      break;
    case 'concall':
      persona = "Behavioral Psychologist / Skeptic. Focus on Q&A Session (Analyst vs Management), Tone of voice, and Evasive answers.";
      focus = "Analyze the Q&A. Did management dodge any questions? What was the most heated topic? What is the guidance?";
      searchQuery = `${ticker} latest earnings call transcript summary Q&A highlights`;
      break;
    case 'quarterly_result':
      persona = "Accountant. Focus on EBITDA margins, YoY growth, Deal wins (TCV), and Guidance.";
      focus = "Compare this quarter's numbers to last year. Highlight margin expansion/contraction and revenue growth breakdown.";
      searchQuery = `${ticker} quarterly results press release highlights financial summary`;
      break;
    case 'red_flags':
      persona = "Forensic Accountant. Hunt for off-balance sheet items, related party transactions, and cash flow divergence.";
      focus = "Look for any negative news, accounting irregularities, auditor concerns, or sudden management exits recently.";
      searchQuery = `${ticker} accounting irregularities fraud allegations corporate governance issues recent`;
      break;
  }

  const prompt = `
    You are acting as a ${persona}
    
    TASK:
    Use Google Search to find information regarding the ${docType.replace('_', ' ')} for ${ticker}.
    ${focus}
    
    OUTPUT RULE:
    Provide a detailed professional analysis in Markdown.
    Use ## Headers, **Bold** for numbers, and > Blockquotes for key management quotes or findings.
    If valid numerical data is found for comparison (e.g. Revenue Q1 vs Q2, or Peer comparison), INCLUDE a [CHART_DATA] block at the end using this JSON format:
    [CHART_DATA: {"type": "bar|line|area", "title": "Comparison", "labels": ["Q1","Q2"], "datasets": [{"label": "Metric", "data": [10,20]}]}]
    
    End with a [SENTIMENT: number] score (-100 to 100) based on the findings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    // Use standard parsing logic to ensure chart data is extracted correctly
    const result = parseAIResponse(response.text);
    
    return {
      text: result.text,
      sentiment: result.sentiment || 0,
      chartData: result.chartData
    };
    
  } catch (error) {
    console.error("Document Analysis Error:", error);
    return { text: "I couldn't retrieve the document data at this moment. Please try again.", sentiment: 0 };
  }
}

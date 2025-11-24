
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
    cleaned = cleaned.replace(/:\s*'([^']*)'/g, ': "$1"');
    
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
        const jsonStrRaw = text.substring(jsonStartIndex, jsonEndIndex);
        // Clean up the match range
        const closeBracketIndex = text.indexOf(']', jsonEndIndex);
        const fullMatchEnd = closeBracketIndex !== -1 && text.substring(jsonEndIndex, closeBracketIndex).trim() === "" 
            ? closeBracketIndex + 1 
            : jsonEndIndex;

        const fullMatch = text.substring(startTagIndex, fullMatchEnd);

        try {
            const cleanedJson = cleanJsonString(jsonStrRaw);
            return { json: JSON.parse(cleanedJson), fullMatch };
        } catch (e) {
            return null;
        }
    }
    return null;
};

/**
 * Helper to parse AI response text and extract structured data tags.
 */
const parseAIResponse = (rawText: string) => {
  let text = rawText || "";
  
  // 1. Clean Accidental Object Stringification (Safety Check)
  // Sometimes older React renderers might have injected this into chat history context passed back to LLM, 
  // causing it to hallucinate it back. We strip it here.
  text = text.replace(/\[object Object\]/g, "");

  // 2. Extract Thoughts/Reasoning
  let thoughts: string | undefined = undefined;
  const thoughtsMatch = text.match(/\[THOUGHTS\]([\s\S]*?)\[\/THOUGHTS\]/);
  if (thoughtsMatch) {
      thoughts = thoughtsMatch[1].trim();
      text = text.replace(thoughtsMatch[0], '').trim();
  }

  // 3. Extract Sentiment
  let sentiment: number | undefined = undefined;
  const sentimentMatch = text.match(/\[SENTIMENT:\s*(-?\d+)\]/);
  if (sentimentMatch) {
    sentiment = parseInt(sentimentMatch[1], 10);
    text = text.replace(/\[SENTIMENT:\s*(-?\d+)\]/, '').trim();
  }

  // 4. Extract Chart Data
  let chartData: any = undefined;
  const chartExtraction = extractJsonBlock(text, '[CHART_DATA:');
  if (chartExtraction) {
      chartData = chartExtraction.json;
      text = text.replace(chartExtraction.fullMatch, '').trim();
  }

  // 5. Extract Bingo Data
  let bingoData: BingoData | undefined = undefined;
  const bingoExtraction = extractJsonBlock(text, '[BINGO_DATA:');
  if (bingoExtraction) {
      bingoData = bingoExtraction.json;
      text = text.replace(bingoExtraction.fullMatch, '').trim();
  }

  // 6. Extract Domino Data
  let dominoData: DominoData | undefined = undefined;
  const dominoExtraction = extractJsonBlock(text, '[DOMINO_DATA:');
  if (dominoExtraction) {
      dominoData = dominoExtraction.json;
      text = text.replace(dominoExtraction.fullMatch, '').trim();
  }

  // 7. Extract News Insight Data
  let insightData: NewsInsight | undefined = undefined;
  const insightExtraction = extractJsonBlock(text, '[INSIGHT_DATA:');
  if (insightExtraction) {
      insightData = insightExtraction.json;
      text = text.replace(insightExtraction.fullMatch, '').trim();
  }

  // 8. Extract Suggestions
  const suggestions: string[] = [];
  const suggestionRegex = /\[SUGGESTION:\s*(.*?)\]/g;
  let match;
  while ((match = suggestionRegex.exec(text)) !== null) {
    suggestions.push(match[1].trim());
  }
  text = text.replace(suggestionRegex, '').trim();
  
  // Cleanup
  text = text.replace(/\[CHART_DATA:[\s\S]*?\]/g, ''); 
  text = text.replace(/\[DOMINO_DATA:[\s\S]*?\]/g, '');
  text = text.replace(/\[INSIGHT_DATA:[\s\S]*?\]/g, '');
  text = text.replace(/\[THOUGHTS\][\s\S]*?\[\/THOUGHTS\]/g, '');
  text = text.replace(/\n\s*\n/g, '\n\n').trim();

  return { text, thoughts, sentiment, chartData, bingoData, dominoData, insightData, suggestions };
};

export const fetchLiveNews = async (): Promise<Article[]> => {
  const runAttempt = async () => {
    try {
        const prompt = `
          Find the top 5 most recent and impactful news stories from the last 24 hours related to:
          1. Indian Stock Market (Sensex, Nifty)
          2. Major Indian Companies (Reliance, Tata, Infosys, HDFC, Adani)
          3. Indian Economy updates.

          Return the data strictly inside a [NEWS_DATA] block as valid JSON.
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
                imageUrl: "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80",
                relatedTickers: Array.isArray(a.relatedTickers) ? a.relatedTickers : []
            }));
            return articles;
        } else {
            return null;
        }
    } catch (error) {
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

export const startChatSession = (article: Article | null, portfolio: PortfolioItem[], history?: ChatMessage[]) => {
  const portfolioString = portfolio.map(p => `${p.name} (${p.symbol})`).join(', ');
  
  const chartInstruction = `
        VISUALIZATION RULE:
        If relevant, generate a chart using [CHART_DATA: { "title": "...", "type": "bar", "datasets": [{"label":"Metric","data":[...]}] }] at the very end.
  `;
  
  const reasoningInstruction = `
        REASONING RULE:
        Start your response with [THOUGHTS] 1. Analyzing query... 2. Checking facts... [/THOUGHTS]
  `;

  const systemInstruction = `
        You are FinGenie, a friendly and smart Financial Assistant for Retail Investors.
        USER PORTFOLIO: ${portfolioString}
        
        TONE: Simple, clear, helpful. Avoid overly complex jargon. If you use a hard term, explain it.
        
        OUTPUT RULES: 
        1. **Reasoning**: ${reasoningInstruction}
        2. **Formatting**: Use **Bold** for key insights. Use bullet points.
        3. **Visuals**: ${chartInstruction}
        4. **Tags**: End with [SENTIMENT: score]
  `;

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

export const sendChatMessage = async (message: string): Promise<{ text: string; thoughts?: string; sentiment?: number; suggestions?: string[]; chartData?: any; dominoData?: DominoData; insightData?: NewsInsight }> => {
  if (!currentChatSession) throw new Error("Chat session not initialized");
  
  try {
    const response = await currentChatSession!.sendMessage({ message });
    return parseAIResponse(response.text);
  } catch (error: any) {
    return { text: "I'm having trouble connecting to the market data server right now. Please try again." };
  }
};

export const getInitialPrompt = (action: string): string => {
   // These are largely replaced by the specific Workflow Wizards now, 
   // but kept for the "Quick Actions" on news cards.
   switch (action) {
    case 'summary': return `Summarize this in simple terms. What does it mean for a regular investor?`;
    case 'impact': return "How does this news impact my portfolio stocks? Be specific.";
    case 'eli5': return "Explain this like I'm 5 years old. Use a fun analogy.";
    case 'compare': return "Compare the companies mentioned in a simple table. Who looks stronger?";
    case 'history': return "Has something like this happened before? What happened to the stock price then?";
    case 'bear-case': return "What could go wrong? Give me the risks.";
    case 'jargon': return "Explain the difficult financial terms in this article simply.";
    default: return "Analyze this.";
  }
};

// --- PORTFOLIO INTELLIGENCE STUBS ---
export const analyzePortfolioAttribution = async (portfolio: PortfolioItem[], articles: Article[]): Promise<PortfolioAttributionResult | null> => {
    return null; // Stub for brevity in this update
};

export const analyzeConcentrationRisk = async (portfolio: PortfolioItem[]): Promise<ConcentrationRiskResult | null> => {
    return null; // Stub
};

export const generateEarningsCalendar = async (portfolio: PortfolioItem[]): Promise<EarningsEvent[]> => {
    return []; // Stub
};

export const getPortfolioHealthReport = async (portfolio: PortfolioItem[], articles: Article[]): Promise<PortfolioHealthReport | null> => {
     // Stub implementation for the demo flow
     return {
         attribution: { overallSentiment: 'Bullish', movementPercentageEstimate: '+1.2%', culprits: [], saviors: [], hiddenFactor: 'None', verdict: 'Looks good.' },
         risk: { riskLevel: 'Low', primaryRiskFactor: 'None', risks: [], diversificationSuggestion: 'Keep it up.' },
         earnings: [],
         timestamp: Date.now()
     };
};

export const analyzeRippleEffect = async (event: string, portfolio: PortfolioItem[]): Promise<RippleEffectResult | null> => {
    return null; // Stub
};

export const analyzeForensicDocument = async (text: string): Promise<ForensicAnalysisResult | null> => {
    return null; // Stub
};

export const analyzeDocument = async (ticker: string, docType: DocumentType): Promise<{text: string, thoughts?: string, sentiment: number, chartData?: any, sourceDocument?: string, bingoData?: BingoData, dominoData?: DominoData}> => {
  const simulatedSourceDoc = `Simulated ${docType} for ${ticker}... Revenue up, margins stable. Management optimistic.`;
  
  const prompt = `
    Analyze this ${docType} for ${ticker} for a RETAIL investor.
    Keep it simple.
    Source: "${simulatedSourceDoc}"
    
    Start with [THOUGHTS]...[/THOUGHTS].
    End with [SENTIMENT: 50].
  `;

   try {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
        });

        const result = parseAIResponse(response.text);
        return {
            text: result.text,
            thoughts: result.thoughts,
            sentiment: result.sentiment || 0,
            sourceDocument: simulatedSourceDoc
        };
   } catch (e) {
       return { text: "Analysis failed.", sentiment: 0 };
   }
}

export const analyzeEarningsTranscript = async (text: string) => { return { title: "", content: "" }; };
export const analyzeChartImage = async (base64: string) => { return { title: "", content: "" }; };
export const compareAnalysis = async (tA: string, cA: string, tB: string, cB: string): Promise<{ text: string, chartData?: any }> => { return { text: "" }; };

import { GoogleGenAI, Chat, Content } from "@google/genai";
import { Article, PortfolioItem, ChatMessage } from '../types';
import { MOCK_ARTICLES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We store the active chat session in memory for the client
let currentChatSession: Chat | null = null;

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

      Format the output strictly as a JSON array of objects. Do not include markdown code blocks or explanations.
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
        "isTrending": boolean (true if it's a major headline)
      }

      For the 'imageUrl', strictly use one of these specific placeholder URLs based on the category (do not hallucinate other URLs):
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
    text = text.replace(/```json/g, '').replace(/```/g, '');
    
    // Extract array
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']') + 1;
    
    if (start !== -1 && end !== -1) {
      const jsonStr = text.substring(start, end);
      const articles = JSON.parse(jsonStr);
      return articles;
    } else {
      console.warn("Could not parse JSON from Gemini response, falling back to mock data.");
      return MOCK_ARTICLES;
    }
  } catch (error) {
    console.error("Error fetching live news:", error);
    return MOCK_ARTICLES;
  }
};

/**
 * Initializes a chat session specific to an article.
 */
export const startChatSession = (article: Article, portfolio: PortfolioItem[], history?: ChatMessage[]) => {
  const portfolioString = portfolio.map(p => `${p.name} (${p.symbol})`).join(', ');
  
  const systemInstruction = `
    You are FinGenie, an expert financial analyst assistant.
    The user is reading a news article titled: "${article.title}".
    
    Article Context: "${article.summary}"
    Article Source URL: "${article.url}"
    
    User's Portfolio: ${portfolioString}
    
    Your Goal: Answer questions specifically about this article and its impact on the user's portfolio.
    
    IMPORTANT OUTPUT RULES:
    1. If the user asks for an "Impact Analysis", you MUST include a sentiment score at the end of your response: [SENTIMENT: number] (-100 to 100).
    
    2. ALWAYS end your response by suggesting exactly 3 short, relevant follow-up questions that the user might want to ask next based on the context.
       Format these strictly as: [SUGGESTION: Question text]
       Example:
       "This news is positive...
       [SUGGESTION: What are the risks?]
       [SUGGESTION: How does this compare to peers?]
       [SUGGESTION: Long-term outlook?]"
    
    Keep responses concise, professional, but accessible. Use Markdown for formatting.
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
      tools: [{ googleSearch: {} }], // Allow search in chat for fact-checking
    },
    history: chatHistory
  });

  return currentChatSession;
};

/**
 * Sends a message to the active chat session.
 */
export const sendChatMessage = async (message: string): Promise<{ text: string; sentiment?: number; suggestions?: string[] }> => {
  if (!currentChatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const response = await currentChatSession.sendMessage({ message });
    let text = response.text || "I couldn't generate a response.";
    
    // Parse Sentiment
    let sentiment: number | undefined = undefined;
    const sentimentMatch = text.match(/\[SENTIMENT:\s*(-?\d+)\]/);
    
    if (sentimentMatch) {
      sentiment = parseInt(sentimentMatch[1], 10);
      // Remove the tag from the visible text
      text = text.replace(/\[SENTIMENT:\s*(-?\d+)\]/, '').trim();
    }

    // Parse Suggestions
    const suggestions: string[] = [];
    const suggestionRegex = /\[SUGGESTION:\s*(.*?)\]/g;
    let match;
    while ((match = suggestionRegex.exec(text)) !== null) {
      suggestions.push(match[1].trim());
    }
    // Remove suggestions from visible text
    text = text.replace(suggestionRegex, '').trim();

    return { text, sentiment, suggestions };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { text: "I'm having trouble connecting to the market data server right now." };
  }
};

/**
 * Helper to generate the initial prompt based on the button clicked
 */
export const getInitialPrompt = (action: 'summary' | 'impact' | 'eli5'): string => {
  switch (action) {
    case 'summary':
      return "Give me a concise 3-bullet summary of this article.";
    case 'impact':
      return "Analyze the impact of this news on my specific portfolio holdings. Be direct about risks and opportunities.";
    case 'eli5':
      return "Explain this news story to me like I'm a 5-year-old using a fun analogy.";
    default:
      return "What is this article about?";
  }
};
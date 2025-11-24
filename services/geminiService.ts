
import { GoogleGenAI, Chat, Content, Modality } from "@google/genai";
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
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    cleaned = cleaned.replace(/(")\s+(?=")/g, '$1,');
    cleaned = cleaned.replace(/:\s*([}\]])/g, ': null$1');
    cleaned = cleaned.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
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
        // Try to find the closing bracket of the tag
        const tagCloseIndex = text.indexOf(']', jsonEndIndex);
        
        // If ] is found relatively close (within 10 chars), assume it's the tag closer
        const fullMatchEnd = (tagCloseIndex !== -1 && tagCloseIndex - jsonEndIndex < 10) 
            ? tagCloseIndex + 1 
            : jsonEndIndex;

        const fullMatch = text.substring(startTagIndex, fullMatchEnd);
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

  let insightData: NewsInsight | undefined = undefined;
  const insightExtraction = extractJsonBlock(text, '[INSIGHT_DATA:');
  if (insightExtraction) {
      insightData = insightExtraction.json;
  }

  let sources: SourceLink[] | undefined = undefined;
  const sourcesExtraction = extractJsonBlock(text, '[SOURCES:');
  if (sourcesExtraction) {
      const allSources = sourcesExtraction.json as SourceLink[];
      // Filter unique domains and limit to 4
      const seen = new Set();
      sources = allSources.filter(s => {
          try {
              const host = new URL(s.url).hostname;
              if (seen.has(host)) return false;
              seen.add(host);
              return true;
          } catch { return false; }
      }).slice(0, 4);
  }

  let followUp: string[] | undefined = undefined;
  const followUpExtraction = extractJsonBlock(text, '[FOLLOW_UP:');
  if (followUpExtraction) {
      followUp = followUpExtraction.json;
  }
  
  const tagsToRemove = [
      /\[CHART_DATA:[\s\S]*?\]/g,
      /\[DOMINO_DATA:[\s\S]*?\]/g,
      /\[INSIGHT_DATA:[\s\S]*?\]/g,
      /\[SOURCES:[\s\S]*?\]/g,
      /\[FOLLOW_UP:[\s\S]*?\]/g,
      /\[BINGO_DATA:[\s\S]*?\]/g,
      /\[THOUGHTS\][\s\S]*?\[\/THOUGHTS\]/g,
      /\[SENTIMENT:[\s\S]*?\]/g
  ];

  tagsToRemove.forEach(regex => {
      text = text.replace(regex, '');
  });

  text = text.replace(/\n\s*\n/
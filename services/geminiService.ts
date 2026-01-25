
import { GoogleGenAI, Type } from "@google/genai";
import { Recommendation, Song } from "../types";

// Initialize AI client using the environment variable API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fallback audio URL for search results (when direct stream link is unavailable)
const PREVIEW_STREAM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

export interface OnlineSongResult {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  sourceUri?: string;
}

/**
 * Searches for music online using Google Search grounding.
 * Optimized for speed by simplifying the prompt and schema expectations.
 */
export const searchMusicOnline = async (query: string): Promise<OnlineSongResult[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for music: "${query}". 
      Return a JSON array of 5 best matches with keys: title, artist, album, coverUrl. 
      Use real data from Google Search. If no coverUrl found, use 'https://picsum.photos/seed/[title]/400/400'.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              coverUrl: { type: Type.STRING },
              sourceUri: { type: Type.STRING }
            },
            required: ["title", "artist"],
          }
        }
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    return [];
  } catch (error) {
    console.error("Online search error:", error);
    return [];
  }
};

/**
 * Gets mood-based music recommendations using Google Search grounding.
 */
export const getMoodRecommendation = async (
  mood: string, 
  favorites?: string[],
  availableSongs?: Song[]
): Promise<any> => {
  try {
    const ai = getAI();
    const favsStr = favorites && favorites.length > 0 ? ` Favs: ${favorites.slice(0, 3).join(', ')}.` : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Mood: "${mood}".${favsStr} Suggest 5 songs in JSON: vibe, description, suggestedPlaylist (array of {title, artist}).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vibe: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedPlaylist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING }
                },
                required: ["title", "artist"]
              }
            }
          },
          required: ["vibe", "description", "suggestedPlaylist"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text.trim());
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return { ...data, sources };
  } catch (error: any) {
    if (error?.message?.toLowerCase().includes('quota') || error?.status === 429) {
      return { error: true, code: 'QUOTA_EXCEEDED' };
    }
    return null;
  }
};

export const getSongStory = async (title: string, artist: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Story of "${title}" by "${artist}". Short, Vietnamese.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "Âm nhạc kể câu chuyện của riêng nó.";
};

export const getSongInsight = async (title: string, artist: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Insight about "${title}" - "${artist}".`,
  });
  return response.text || "";
};

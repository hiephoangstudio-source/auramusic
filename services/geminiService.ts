
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
 */
export const searchMusicOnline = async (query: string): Promise<OnlineSongResult[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tìm kiếm danh sách các bài hát liên quan đến: "${query}". 
      Hãy trả về thông tin chi tiết của ít nhất 5 bài hát phù hợp nhất.
      Sử dụng Google Search để lấy thông tin chính xác về nghệ sĩ, album và link ảnh bìa (nếu có).
      Nếu không có link ảnh bìa thực tế, hãy sử dụng URL ảnh giả lập từ picsum.photos dựa trên tên bài hát.`,
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
            propertyOrdering: ["title", "artist", "album", "coverUrl", "sourceUri"]
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
 * Extracts grounding sources for UI display.
 */
export const getMoodRecommendation = async (
  mood: string, 
  favorites?: string[],
  availableSongs?: Song[]
): Promise<any> => {
  try {
    const ai = getAI();
    const favsStr = favorites && favorites.length > 0 ? ` Favorites: ${favorites.join(', ')}.` : '';
    const libStr = availableSongs && availableSongs.length > 0 ? ` Available in library: ${availableSongs.map(s => s.title).join(', ')}.` : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tâm trạng người dùng: "${mood}".${favsStr}${libStr} Hãy gợi ý 5 bài hát trending phù hợp nhất. Trả về JSON.`,
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
                required: ["title", "artist"],
                propertyOrdering: ["title", "artist"]
              }
            }
          },
          required: ["vibe", "description", "suggestedPlaylist"],
          propertyOrdering: ["vibe", "description", "suggestedPlaylist"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text.trim());
    
    // Extracting grounding chunks to comply with Google Search grounding requirements
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Search Result",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return { ...data, sources };
  } catch (error: any) {
    console.error("Mood recommendation error:", error);
    // Special handling for quota errors as requested by UI.
    // Check for quota exceeded message or 429 status code.
    if (error?.message?.toLowerCase().includes('quota') || error?.status === 429) {
      return { error: true, code: 'QUOTA_EXCEEDED' };
    }
    return null;
  }
};

/**
 * Generates a story about a song using Google Search grounding.
 */
export const getSongStory = async (title: string, artist: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Kể chuyện về bài hát "${title}" của "${artist}". Ngắn gọn, tiếng Việt.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "Âm nhạc kể câu chuyện của riêng nó.";
};

/**
 * Provides insights about a song.
 */
export const getSongInsight = async (title: string, artist: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Insight ngắn về "${title}" - "${artist}".`,
  });
  return response.text || "";
};

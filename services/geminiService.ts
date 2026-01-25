
import { GoogleGenAI, Type } from "@google/genai";
import { Recommendation, Song } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });
const PREVIEW_STREAM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

export interface OnlineSongResult {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  sourceUri?: string;
}

const safeParseJSON = (text: string) => {
  try {
    // Xử lý trường hợp AI trả về JSON bọc trong block code Markdown
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
};

export const searchMusicOnline = async (query: string): Promise<OnlineSongResult[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Quick search music: "${query}". Return a JSON array of 5 tracks with keys: title, artist, album, coverUrl.`,
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
            },
            required: ["title", "artist", "album", "coverUrl"],
          }
        }
      },
    });

    return safeParseJSON(response.text) || [];
  } catch (error) {
    console.error("Online search error:", error);
    return [];
  }
};

// Fixed: Added availableSongs parameter to match the caller in AIDJ.tsx
export const getMoodRecommendation = async (mood: string, favorites?: string[], availableSongs?: Song[]): Promise<any> => {
  try {
    const ai = getAI();
    // Providing context of available songs if needed
    const context = availableSongs && availableSongs.length > 0 
      ? `\nUser's existing library: ${availableSongs.slice(0, 10).map(s => `${s.title} by ${s.artist}`).join(', ')}.`
      : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Mood: "${mood}".${context}\nRecommend music and describe the vibe.`,
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
                  artist: { type: Type.STRING },
                },
                required: ["title", "artist"],
              }
            }
          },
          required: ["vibe", "description", "suggestedPlaylist"],
        }
      }
    });

    const data = safeParseJSON(response.text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return data ? { ...data, sources } : null;
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
    contents: `Tell a 2-sentence story about song "${title}" by "${artist}" in Vietnamese.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "Âm nhạc kể câu chuyện của riêng nó.";
};

export const getSongInsight = async (title: string, artist: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `One-line insight for "${title}" - "${artist}".`,
  });
  return response.text || "";
};

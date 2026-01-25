
import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

// Always create a new instance right before use to ensure the latest API key from the environment/dialog is used.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });
const PREVIEW_STREAM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

export interface OnlineSongResult {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  sourceUri?: string;
}

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  if (error?.message?.toLowerCase().includes('quota') || error?.status === 429 || error?.message?.includes('429')) {
    return { error: true, code: 'QUOTA_EXCEEDED' };
  }
  if (error?.message?.includes('Requested entity was not found')) {
    return { error: true, code: 'ENTITY_NOT_FOUND' };
  }
  return { error: true, code: 'UNKNOWN_ERROR', message: error?.message };
};

const safeParseJSON = (text: string) => {
  try {
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
};

export const searchMusicOnline = async (query: string): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for tracks matching "${query}" on the web. Return a JSON array of 5 tracks. Each track MUST have: title, artist, album, coverUrl. Be brief.`,
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

    const data = safeParseJSON(response.text);
    // Extract grounding sources for search results as required by guidelines
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return data ? { tracks: data, sources } : [];
  } catch (error) {
    return handleApiError(error);
  }
};

export const getMoodRecommendation = async (mood: string, favorites?: string[], availableSongs?: Song[]): Promise<any> => {
  try {
    const ai = getAI();
    const context = availableSongs && availableSongs.length > 0 
      ? `\nUser's existing library: ${availableSongs.slice(0, 10).map(s => `${s.title} by ${s.artist}`).join(', ')}.`
      : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Mood: "${mood}".${context}\nRecommend 5 actual music tracks and describe the vibe.`,
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
    // Extract grounding sources as required by guidelines
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return data ? { ...data, sources } : null;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const getSongStory = async (title: string, artist: string): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tell a 2-sentence story about song "${title}" by "${artist}" in Vietnamese. Briefly mention its impact or style.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const text = response.text || "Âm nhạc kể câu chuyện của riêng nó.";
    // Extract grounding sources as required by guidelines
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Nguồn tin",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return { text, sources };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getSongInsight = async (title: string, artist: string): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Short one-line trivia or insight for "${title}" - "${artist}".`,
    });
    return response.text || "";
  } catch (error) {
    return handleApiError(error);
  }
};

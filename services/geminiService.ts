
import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

// Sử dụng mô hình gemini-3-flash-preview cho các tác vụ văn bản cơ bản
const MODEL_NAME = 'gemini-3-flash-preview';

// Khởi tạo instance GoogleGenAI ngay trước khi gọi API để đảm bảo key mới nhất
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  if (error?.message?.toLowerCase().includes('quota') || error?.status === 429) {
    return { error: true, code: 'QUOTA_EXCEEDED' };
  }
  return { error: true, code: 'UNKNOWN_ERROR', message: error?.message };
};

const safeParseJSON = (text: string) => {
  try {
    // Trích xuất JSON từ khối mã nếu có, hoặc làm sạch văn bản
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const cleanText = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("Failed to parse JSON response:", text);
    return null;
  }
};

export const searchMusicOnline = async (query: string): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Search for tracks matching "${query}". Return a JSON array of 5 tracks. Each track object must have: title, artist, album, coverUrl. Provide only the JSON array.`,
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

    // Theo hướng dẫn, response.text có thể không phải JSON khi dùng googleSearch. 
    // Chúng tôi sử dụng safeParseJSON để xử lý linh hoạt.
    const data = safeParseJSON(response.text);
    
    // Bắt buộc trích xuất URL từ groundingChunks theo yêu cầu
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return data ? { tracks: data, sources } : { tracks: [], sources };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getMoodRecommendation = async (mood: string, favorites?: string[], availableSongs?: Song[]): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `The user is feeling "${mood}". Recommend 5 actual music tracks that match this mood and describe the vibe briefly. Return a JSON object.`,
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
    return handleApiError(error);
  }
};

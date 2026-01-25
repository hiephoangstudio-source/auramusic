
import { GoogleGenAI, Type } from "@google/genai";
import { Recommendation, Song } from "../types";

// Hàm khởi tạo instance AI mới để đảm bảo luôn dùng Key mới nhất nếu người dùng thay đổi
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeminiError extends Error {
  status?: number;
  reason?: string;
}

export const getMoodRecommendation = async (
  mood: string, 
  favorites?: string[], 
  versionRequest?: string,
  availableSongs?: Song[]
): Promise<Recommendation | { error: string; code: string } | null> => {
  try {
    const ai = getAI();
    const favoriteContext = favorites && favorites.length > 0 
      ? `Người dùng thích các bài hát: ${favorites.join(", ")}.` 
      : "";
    
    const libraryContext = availableSongs && availableSongs.length > 0
      ? `DƯỚI ĐÂY LÀ DANH SÁCH BÀI HÁT CÓ SẴN TRONG THƯ VIỆN: ${availableSongs.map(s => `"${s.title}" của "${s.artist}"`).join(", ")}.`
      : "";

    const versionPrompt = versionRequest 
      ? `ĐẶC BIỆT: Tìm các phiên bản "${versionRequest}" cho tâm trạng này.` 
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Người dùng cảm thấy: "${mood}". ${favoriteContext} ${libraryContext} ${versionPrompt}
      Hãy phân tích và đề xuất playlist 5 bài phù hợp dạng JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vibe: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedArtist: { type: Type.STRING },
            suggestedGenre: { type: Type.STRING },
            suggestedPlaylist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING }
                }
              }
            },
            remixSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  version: { type: Type.STRING }
                }
              }
            }
          },
          required: ["vibe", "description", "suggestedArtist", "suggestedGenre"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error: any) {
    console.error("Gemini recommendation error:", error);
    if (error.message?.includes("quota") || error.status === 429) {
      return { error: "Hết hạn mức sử dụng (Quota Exceeded)", code: "QUOTA_EXCEEDED" };
    }
    return null;
  }
};

export const getSongStory = async (title: string, artist: string, alternate: boolean = false): Promise<string> => {
  try {
    const ai = getAI();
    const styleInstruction = alternate 
      ? "Hãy kể một câu chuyện siêu thực hoặc tương lai hơn." 
      : "Hãy kể một câu chuyện ngắn gọn hoặc ý nghĩa đằng sau bài hát.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${styleInstruction} về bài hát "${title}" của "${artist}". Trả lời bằng tiếng Việt, khoảng 80 từ.`,
    });
    return response.text || "Mỗi bài hát là một cuộc hành trình.";
  } catch (error: any) {
    if (error.status === 429) return "QUOTA_LIMIT_REACHED";
    return "Câu chuyện đang được viết tiếp...";
  }
};

export const getSongInsight = async (title: string, artist: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Thông tin thú vị về bài hát "${title}" của "${artist}". Dưới 40 từ, tiếng Việt.`,
    });
    return response.text || "Giai điệu mang linh hồn riêng.";
  } catch (error: any) {
    return "AI DJ đang suy ngẫm...";
  }
};

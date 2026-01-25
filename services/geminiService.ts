
import { GoogleGenAI, Type } from "@google/genai";
import { Recommendation, Song } from "../types";

// Always use the process.env.API_KEY directly in the constructor.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMoodRecommendation = async (
  mood: string, 
  favorites?: string[], 
  versionRequest?: string,
  availableSongs?: Song[]
): Promise<Recommendation | null> => {
  try {
    const favoriteContext = favorites && favorites.length > 0 
      ? `Người dùng thích các bài hát: ${favorites.join(", ")}.` 
      : "";
    
    const libraryContext = availableSongs && availableSongs.length > 0
      ? `DƯỚI ĐÂY LÀ DANH SÁCH BÀI HÁT CÓ SẴN TRONG THƯ VIỆN (Hãy ưu tiên đề xuất các bài này trong phần suggestedPlaylist để người dùng có thể phát ngay): ${availableSongs.map(s => `"${s.title}" của "${s.artist}"`).join(", ")}.`
      : "";

    const versionPrompt = versionRequest 
      ? `ĐẶC BIỆT: Người dùng yêu cầu tìm các phiên bản "${versionRequest}" cho tâm trạng này. Nếu là "Radio", hãy đề xuất các bài hát phù hợp để phát trên đài phát thanh (thịnh hành, bắt tai).` 
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Người dùng cảm thấy: "${mood}". ${favoriteContext} ${libraryContext} ${versionPrompt}
      Hãy phân tích và đề xuất:
      1. Một vibe âm nhạc chủ đạo.
      2. Mô tả ngắn gọn (tiếng Việt).
      3. Thể loại và nghệ sĩ tiêu biểu.
      4. Một danh sách phát 5 bài phù hợp (ƯU TIÊN TUYỆT ĐỐI CÁC BÀI TRONG THƯ VIỆN ĐÃ CUNG CẤP).
      5. Đề xuất 2-3 phiên bản Remix, Acoustic, Live hoặc Radio cho tâm trạng hoặc yêu cầu này.`,
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
  } catch (error) {
    console.error("Gemini recommendation error:", error);
    return null;
  }
};

export const getSongStory = async (title: string, artist: string, alternate: boolean = false): Promise<string> => {
  try {
    const styleInstruction = alternate 
      ? "Hãy kể một câu chuyện khác hẳn, theo phong cách siêu thực, trừu tượng hoặc tương lai hơn." 
      : "Hãy kể một câu chuyện ngắn gọn hoặc ý nghĩa đằng sau bài hát.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${styleInstruction} về bài hát "${title}" của "${artist}". Trả lời bằng tiếng Việt, khoảng 80-100 từ.`,
    });
    return response.text || "Mỗi bài hát là một cuộc hành trình của tâm hồn.";
  } catch (error) {
    return "Câu chuyện về giai điệu này đang được viết tiếp...";
  }
};

export const getSongInsight = async (title: string, artist: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Cung cấp một thông tin thú vị, đậm chất nghệ thuật về bài hát "${title}" của "${artist}". Giới hạn dưới 50 từ, bằng tiếng Việt.`,
    });
    return response.text || "Giai điệu này mang một linh hồn riêng biệt.";
  } catch (error) {
    return "AI DJ đang suy ngẫm về giai điệu này...";
  }
};

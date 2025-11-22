import { GoogleGenAI, Modality } from "@google/genai";

// Safely get API key from Vercel Environment Variables
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  process.env.VITE_API_KEY ||
  "";

if (!apiKey && import.meta.env.PROD) {
  console.error("%cGEMINI API KEY IS MISSING!", "color:red;font-size:20px");
}

// Initialise Gemini
const ai = new GoogleGenAI({ apiKey });

// TEXT + IMAGE CHAT
export const generateTextResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  prompt: string,
  imageParts?: { inlineData: { data: string; mimeType: string } }[],
  modelName: string = "gemini-1.5-flash",
  systemInstruction?: string
) => {
  try {
    const cleanHistory = history
      .map(h => ({
        role: h.role,
        parts: h.parts.filter(p => p.text && p.text.trim())
      }))
      .filter(h => h.parts.length > 0);

    const chat = ai.chats.create({
      model: modelName,
      history: cleanHistory,
      config: { systemInstruction, maxOutputTokens: 800 }
    });

    const payload = imageParts ? [...imageParts, { text: prompt }] : [{ text: prompt }];

    const result = await chat.sendMessage({ message: payload });
    return result.text || "No response.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return Sorry, something went wrong: ${error.message};
  }
};

// IMAGE GENERATION
export const generateImage = async (prompt: string) => {
  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "1:1"
      }
    });

    const base64 = response.generatedImages[0].image.imageBytes;
    return data:image/jpeg;base64,${base64};
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

// TEXT-TO-SPEECH (optional)
export const generateSpeech = async (text: string, voiceName = "Fenrir") => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    });

    const audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audio ? data:audio/wav;base64,${audio} : null;
  } catch (error: any) {
    console.error("TTS Error:", error);
    return null;
  }
};

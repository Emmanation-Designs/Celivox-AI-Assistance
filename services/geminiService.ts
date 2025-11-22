import { GoogleGenAI, Modality } from "@google/genai";

// Assume process.env.API_KEY is available as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTextResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  prompt: string,
  imageParts?: { inlineData: { data: string; mimeType: string } }[],
  modelName: string = 'gemini-2.5-flash',
  systemInstruction?: string
) => {
  try {
    // Sanitize history: Gemini rejects empty text parts
    const cleanHistory = history.map(h => ({
      role: h.role,
      parts: h.parts.filter(p => p.text && p.text.trim().length > 0)
    })).filter(h => h.parts.length > 0);

    // Ensure history starts with user if it exists (Gemini requirement)
    // (The app logic usually ensures this, but safety check is good)
    
    const chat = ai.chats.create({
      model: modelName,
      history: cleanHistory,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 500 // Prevent extremely long responses to improve speed
      }
    });

    // When sending images, pass an array of parts: [ImagePart, TextPart]
    // If strictly text, pass text string or part in array
    const messagePayload = imageParts 
      ? [...imageParts, { text: prompt }] 
      : [{ text: prompt }]; // Always wrap in array for strict Part[] compatibility

    const result = await chat.sendMessage({
      message: messagePayload
    });

    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Text Ewrror:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string) => {
  try {
    // Using imagen-4.0-generate-001 for high quality images
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });
    
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Fenrir') => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};
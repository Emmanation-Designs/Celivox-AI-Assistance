import { GoogleGenerativeAI, Modality } from "@google/generative-ai";

// Safely get the API key from Vercel Environment Variables
// Works with any of these names (covers all possibilities)
const getApiKey = (): string => {
  return (
    // Standard Google names (recommended)
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    // Your old name
    process.env.API_KEY ||
    // Vite-style
    process.env.VITE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ""
  );
};

const apiKey = getApiKey();

if (!apiKey) {
  console.error(
    "%cGEMINI API KEY MISSING!",
    "color: red; font-size: 20px; font-weight: bold;"
  );
  console.error(
    "Go to Vercel → Settings → Environment Variables and add GEMINI_API_KEY with your real key."
  );
}

// Initialise Gemini with the safe key
const genAI = new GoogleGenerativeAI(apiKey);

// TEXT + IMAGE CHAT
export const generateTextResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  prompt: string,
  imageParts?: { inlineData: { data: string; mimeType: string } }[],
  modelName: string = "gemini-1.5-flash",
  systemInstruction?: string
) => {
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });

    const chat = model.startChat({
      history: history.flatMap((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: h.parts,
      })),
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.9,
      },
    });

    const result = await chat.sendMessage(
      imageParts ? [...imageParts, { text: prompt }] : prompt
    );

    return result.response.text() || "No response from Gemini.";
  } catch (error: any) {
    console.error("Gemini Text Error:", error);
    return Error: ${error.message || "Something went wrong"};
  }
};

// IMAGE GENERATION (Imagen)
export const generateImage = async (prompt: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: "", // dummy – required for some versions
        },
      },
    ]);

    const base64 = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64) throw new Error("No image data returned");

    return data:image/png;base64,${base64};
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

// TEXT-TO-SPEECH (optional – keep if you use voice)
export const generateSpeech = async (text: string, voiceName: string = "alloy") => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent([
      [
        {
          text: text,
        },
      ],
      {
        generationConfig: {
          responseMimeType: "audio/wav",
        },
      }
    );

    const audioBase64 = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) throw new Error("No audio generated");

    return data:audio/wav;base64,${audioBase64};
  } catch (error: any) {
    console.error("TTS Error:", error);
    return null;
  }
};

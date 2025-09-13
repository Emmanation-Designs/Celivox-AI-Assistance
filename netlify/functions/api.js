import fetch from "node-fetch";

// Environment variables from Netlify
const geminiKey = process.env.GEMINI_KEY;
const openRouterKey = process.env.OPENROUTER_KEY;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.message; // ✅ match frontend (HTML sends {message: ...})
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  try {
    // === Gemini API Request ===
    let reply = null;
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        reply =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch (e) {
      console.error("Gemini error:", e.message);
    }

    // === Fallback: OpenRouter API Request ===
    if (!reply) {
      try {
        const openRouterResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-3.5-turbo",
              messages: [{ role: "user", content: prompt }],
            }),
          }
        );
        if (openRouterResponse.ok) {
          const openRouterData = await openRouterResponse.json();
          reply = openRouterData?.choices?.[0]?.message?.content || null;
        }
      } catch (e) {
        console.error("OpenRouter error:", e.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: reply || "❌ No AI response available",
      }),
    };
  } catch (error) {
    console.error("API request failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "API request failed",
        details: error.message || error.toString(),
      }),
    };
  }
}

import fetch from "node-fetch";

const geminiKey = process.env.GEMINI_KEY;
const openRouterKey = process.env.OPENROUTER_KEY;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { message, provider } = body;

  try {
    let reply = null;

    if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
        }
      );
      const data = await res.json();
      console.log("Gemini response:", JSON.stringify(data, null, 2)); // 🔎 log full response
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    if (!reply && provider === "openRouter") {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        }),
      });
      const data = await res.json();
      console.log("OpenRouter response:", JSON.stringify(data, null, 2)); // 🔎 log full response
      reply = data?.choices?.[0]?.message?.content || null;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: reply || "❌ No response" }),
    };
  } catch (error) {
    console.error("API request failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
        }

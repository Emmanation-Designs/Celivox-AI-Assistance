import fetch from 'node-fetch';

const geminiKey = process.env.GEMINI_KEY;       // Gemini key from Netlify env
const openRouterKey = process.env.OPENROUTER_KEY; // OpenRouter key from Netlify env

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
    if (!prompt) throw new Error("Prompt is required");
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body", details: err.message })
    };
  }

  try {
    // ===== Gemini API request =====
    const geminiResponse = await fetch('https://api.gemini.com/v1/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    const geminiData = await geminiResponse.json();

    // ===== OpenRouter API request =====
    const openRouterResponse = await fetch('https://api.openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    // Ensure we get valid JSON
    const openRouterText = await openRouterResponse.text();
    let openRouterData;
    try {
      openRouterData = JSON.parse(openRouterText);
    } catch (jsonErr) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Invalid JSON from OpenRouter",
          details: openRouterText
        })
      };
    }

    // Return both API responses
    return {
      statusCode: 200,
      body: JSON.stringify({
        gemini: geminiData,
        openRouter: openRouterData
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API request failed", details: err.message })
    };
  }
                            }

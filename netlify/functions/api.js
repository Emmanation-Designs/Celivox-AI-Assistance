import fetch from 'node-fetch';

// Environment variables from Netlify
const geminiKey = process.env.GEMINI_KEY;
const openRouterKey = process.env.OPENROUTER_KEY;

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  try {
    // === Gemini API Request ===
    const geminiResponse = await fetch('https://api.gemini.com/v1/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    const geminiData = await geminiResponse.json();

    // === OpenRouter API Request ===
    const openRouterResponse = await fetch('https://openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    const openRouterData = await openRouterResponse.json();

    // Return both API responses
    return {
      statusCode: 200,
      body: JSON.stringify({
        gemini: geminiData,
        openRouter: openRouterData,
      }),
    };

  } catch (error) {
    console.error('API request failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'API request failed',
        details: error.message || error.toString(),
      }),
    };
  }
}

import fetch from 'node-fetch';

const geminiKey = process.env.GEMINI_KEY;       // Gemini key from Netlify env
const openRouterKey = process.env.OPENROUTER_KEY; // OpenRouter key from Netlify env

export async function handler(req, res) {
  const { prompt } = req.body;

  try {
    // Gemini API request
    const geminiResponse = await fetch('https://api.gemini.com/v1/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    const geminiData = await geminiResponse.json();

    // OpenRouter API request
    const openRouterResponse = await fetch('https://openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    const openRouterData = await openRouterResponse.json();

    // Return both responses
    res.status(200).json({ gemini: geminiData, openRouter: openRouterData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'API request failed' });
  }
      }

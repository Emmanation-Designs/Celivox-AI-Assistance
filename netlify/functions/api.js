// api.js
const fetch = require('node-fetch');

const geminiKey = process.env.GEMINI_KEY;       // Gemini key from Netlify env
const openRouterKey = process.env.OPENROUTER_KEY; // OpenRouter key from Netlify env

exports.handler = async function(event, context) {
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
    // Gemini API request
    const geminiResponse = await fetch('https://api.gemini.com/v1/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    const geminiData = await geminiResponse.json();

    // OpenRouter API request
    const openRouterResponse = await fetch('https://openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    const openRouterData = await openRouterResponse.json();

    // Return both responses
    return {
      statusCode: 200,
      body: JSON.stringify({ gemini: geminiData, openRouter: openRouterData }),
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API request failed' }),
    };
  }
};

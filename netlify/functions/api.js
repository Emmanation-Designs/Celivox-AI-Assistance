// api.js - Netlify serverless function
// Place this in the same folder as index.html and home.html

const fetch = require('node-fetch'); // Netlify functions support node-fetch

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const { message, provider } = body;

    if (!message || !provider) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing message or provider' })
      };
    }

    let apiResponse;

    if (provider === 'gemini') {
      apiResponse = await fetch('https://api.gemini.com/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_GEMINI_API_KEY'
        },
        body: JSON.stringify({ prompt: message })
      });
    } else if (provider === 'openrouter') {
      apiResponse = await fetch('https://api.openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_OPENROUTER_API_KEY'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: message }]
        })
      });
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid provider' })
      };
    }

    const data = await apiResponse.json();

    // Adjust response depending on provider
    let reply;
    if (provider === 'gemini') {
      reply = data.response || 'No response from Gemini';
    } else if (provider === 'openrouter') {
      reply = data.choices?.[0]?.message?.content || 'No response from OpenRouter';
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

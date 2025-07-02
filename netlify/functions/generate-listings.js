// File: netlify/functions/generate-listings.js

import { OpenAI } from 'openai';

// Initialize OpenAI with the key from Netlify's environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { images, prompt } = JSON.parse(event.body);

    // This combined logic handles both text-only and image requests correctly.
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        // If images exist, map them into the correct format with the required prefix.
        // If not, this does nothing, leaving it as a text-only request.
        ...(images && images.length > 0
          ? images.map(img => ({
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${img}` }
            }))
          : [])
      ],
    }];
    
    // Create a base request object
    const request = {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1500,
    };

    // **IMPORTANT**: Only force a JSON response when images are present,
    // otherwise the text-only Q&A would fail.
    if (images && images.length > 0) {
      request.response_format = { "type": "json_object" };
    }
    
    // Call the OpenAI API with the prepared request
    const response = await openai.chat.completions.create(request);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'There was an error processing your request.' }),
    };
  }
};

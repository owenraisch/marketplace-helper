// File: netlify/functions/generate-listing.js
// You may need to install the openai library for local testing: npm install openai
const { OpenAI } = require('openai');

// Initialize OpenAI with the key from Netlify's environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  // Set headers for the response
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allows your frontend to call this function
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { images, prompt } = JSON.parse(event.body);

    // Prepare the messages array for the OpenAI API call
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        // Map images to the format OpenAI expects
        ...(images ? images.map(img => ({ type: 'image_url', image_url: { url: img } })) : [])
      ],
    }];
    
    // Call the OpenAI API using the gpt-4o model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response), // Send the entire response back
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'There was an error processing your request.' }),
    };
  }
};

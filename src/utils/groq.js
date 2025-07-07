// utils/groq.js
import axios from 'axios';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_TOKEN; // get from https://console.groq.com/

export async function getSuggestedFields(prompt) {
  console.log('Groq API Key:', GROQ_API_KEY ? 'Present' : 'Missing');
  
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'compound-beta',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that creates form fields. Always respond with a valid JSON array of field objects. Each field should have: name, type, and label properties. Valid types are: text, email, number, tel, password, textarea, select.' 
          },
          { 
            role: 'user', 
            content: `Create form fields for: ${prompt}. Return only a JSON array like: [{"name":"fullname","type":"text","label":"Full Name"},{"name":"email","type":"email","label":"Email Address"}]` 
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('Groq API Response:', response.data);
    
    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response format from Groq API');
    }

    const content = response.data.choices[0].message.content.trim();
    console.log('Groq generated content:', content);
    
    try {
      // Try to extract JSON from the response
      let jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(suggestions)) {
          return suggestions;
        }
      }
      
      // If no JSON array found, try to parse the whole content
      const suggestions = JSON.parse(content);
      if (Array.isArray(suggestions)) {
        return suggestions;
      } else {
        throw new Error('Response is not a valid array');
      }
    } catch (parseError) {
      console.error('Failed to parse JSON from Groq response:', parseError);
      throw new Error(`Invalid JSON response from AI: ${content}`);
    }
    
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Groq API key. Please check your token configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('Groq API rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 503) {
      throw new Error('Groq API is temporarily unavailable. Please try again later.');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timeout. Groq API is taking too long to respond.');
    } else {
      throw new Error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

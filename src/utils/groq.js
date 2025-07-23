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
            content: 'You are a helpful assistant that creates form fields. Always respond with a valid JSON array of field objects. Each field should have: field_type (or type), label, required (boolean), placeholder (optional), and options (array of strings for select/radio/checkbox fields). Valid field_type values are: text, email, number, tel, password, textarea, select, radio, checkbox, date, file. For options, use simple string arrays like ["Option 1", "Option 2"], not objects.' 
          },
          { 
            role: 'user', 
            content: `Create form fields for: ${prompt}. Return only a JSON array like: [{"field_type":"text","label":"Full Name","required":true,"placeholder":"Enter your full name"},{"field_type":"email","label":"Email Address","required":true},{"field_type":"select","label":"Subject","required":true,"options":["General Inquiry","Support","Sales"]}]` 
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

export async function generateFormStructure(prompt) {
  console.log('Groq API Key:', GROQ_API_KEY ? 'Present' : 'Missing');
  
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a form generation expert. You must ALWAYS respond with ONLY a valid JSON object as described below. Do NOT include any markdown, explanation, or extra text. If you cannot follow the format, return an empty object {}.

Format:
{
  "name": "Form Name (max 50 chars)",
  "type": "form category (survey/contact/feedback/application/registration/order/event)",
  "description": "Brief description (max 100 chars)",
  "fields": [
    {
      "type": "field type (text/email/tel/textarea/select/radio/checkbox/number/date/url/file)",
      "label": "Field Label",
      "required": true/false,
      "options": ["option1", "option2"] // only for select/radio fields
    }
  ]
}

Rules:
- Absolutely no markdown, no explanation, no extra text, only the JSON object.
- Include 3-8 relevant fields.
- Always include name and email unless specifically anonymous.
- Use appropriate field types.
- Make critical fields required.
- Keep labels concise and clear.
- Options array only for select/radio fields.
- If you cannot follow the format, return {}.

Examples:
User: Create a customer feedback form for a restaurant with food and service ratings.
Output:
{"name":"Restaurant Feedback","type":"feedback","description":"Feedback on food and service","fields":[{"type":"text","label":"Full Name","required":true},{"type":"email","label":"Email","required":true},{"type":"radio","label":"Food Quality","required":true,"options":["Excellent","Good","Average","Poor"]},{"type":"radio","label":"Service Quality","required":true,"options":["Excellent","Good","Average","Poor"]},{"type":"textarea","label":"Comments","required":false}]}

User: Job application form for software engineers.
Output:
{"name":"Software Engineer Application","type":"application","description":"Apply for software engineer position","fields":[{"type":"text","label":"Full Name","required":true},{"type":"email","label":"Email","required":true},{"type":"number","label":"Years of Experience","required":true},{"type":"file","label":"Resume","required":true},{"type":"textarea","label":"Cover Letter","required":false}]}

User: Event registration form with dietary preferences.
Output:
{"name":"Event Registration","type":"registration","description":"Register for the event","fields":[{"type":"text","label":"Full Name","required":true},{"type":"email","label":"Email","required":true},{"type":"select","label":"Dietary Preference","required":false,"options":["None","Vegetarian","Vegan","Gluten-Free","Other"]},{"type":"textarea","label":"Special Requirements","required":false}]}
`
          },
          {
            role: 'user',
            content: prompt
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('Groq Form Generation Response:', response.data);
    
    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response format from Groq API');
    }

    const content = response.data.choices[0].message.content.trim();
    console.log('Groq generated form structure:', content);
    
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = content.replace(/```json\n?|```\n?/g, '').trim();
      const formStructure = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!formStructure.name || !formStructure.fields || !Array.isArray(formStructure.fields)) {
        throw new Error('Invalid form structure from AI');
      }
      
      // Clean and validate field data
      formStructure.fields = formStructure.fields.map(field => ({
        type: field.type || field.field_type || 'text',
        label: field.label || 'Untitled Field',
        required: Boolean(field.required),
        options: field.options && Array.isArray(field.options) ? field.options : undefined
      }));
      
      return formStructure;
      
    } catch (parseError) {
      console.error('Failed to parse JSON from Groq response:', parseError);
      console.log('Raw response:', content);
      throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
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

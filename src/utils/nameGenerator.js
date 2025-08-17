// AI-powered name generator
// Uses Groq API to generate creative, personalized names

import axios from 'axios';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_TOKEN;

/**
 * Cache for AI-generated names to avoid repeated API calls
 * Structure: { email: { name: string, timestamp: number } }
 */
const nameCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Simple fallback name generator using email hash
 * Only used when AI is completely unavailable
 * @param {string} email - The user's email address
 * @returns {string} - A simple fallback name
 */
function generateSimpleFallback(email) {
  if (!email) return 'Anonymous User';
  
  // Simple fallback based on email characteristics
  const username = email.split('@')[0];
  const firstLetter = username.charAt(0).toUpperCase();
  const hasNumbers = /\d/.test(username);
  const hasUnderscore = username.includes('_');
  const hasDot = username.includes('.');
  
  // Generate a simple but personalized fallback
  let prefix = 'Creative';
  if (hasNumbers) prefix = 'Digital';
  else if (hasUnderscore) prefix = 'Modern';
  else if (hasDot) prefix = 'Professional';
  else if (firstLetter >= 'A' && firstLetter <= 'M') prefix = 'Stellar';
  else prefix = 'Cosmic';
  
  let suffix = 'User';
  if (username.length > 8) suffix = 'Builder';
  else if (username.includes('admin') || username.includes('dev')) suffix = 'Developer';
  else if (username.includes('design')) suffix = 'Designer';
  else suffix = 'Creator';
  
  return `${prefix} ${suffix}`;
}

/**
 * Generates an AI-powered creative name based on email characteristics
 * @param {string} email - The user's email address
 * @returns {Promise<string>} - AI-generated name like "Stellar Codeweaver" or "Quantum Dreamforge"
 */
async function generateAIName(email) {
  // Check cache first
  const cached = nameCache.get(email);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.name;
  }

  if (!GROQ_API_KEY) {
    console.log('Groq API key not available, falling back to hardcoded names');
    return generateFallbackName(email);
  }

  try {
    // Extract email characteristics for AI context
    const emailParts = email.split('@');
    const username = emailParts[0];
    const domain = emailParts[1] || '';
    
    // Create a personalized prompt based on email characteristics
    const prompt = `Generate a creative, memorable username that sounds like a GitHub/Docker container name but more personalized. 
    
Context: User email starts with "${username.substring(0, 3)}" and uses ${domain.includes('.com') ? 'commercial' : domain.includes('.org') ? 'organization' : domain.includes('.edu') ? 'educational' : 'professional'} domain.

Requirements:
- Two words: [Adjective] [Noun]
- Professional yet creative (like "Stellar Architect", "Quantum Navigator", "Cosmic Builder")
- Avoid generic tech terms
- Should feel unique and memorable
- No numbers or special characters
- Suitable for a form builder app user

Return ONLY the two-word name, nothing else.`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192',
        messages: [
          { 
            role: 'system', 
            content: 'You are a creative naming assistant. Generate unique, professional usernames that are memorable and personalized. Always respond with exactly two words separated by a space.' 
          },
          { 
            role: 'user', 
            content: prompt
          },
        ],
        temperature: 0.8, // Higher creativity
        max_tokens: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      const aiName = response.data.choices[0].message.content.trim();
      
      // Validate the response (should be two words)
      const words = aiName.split(' ').filter(word => word.length > 0);
      if (words.length === 2 && words.every(word => /^[a-zA-Z]+$/.test(word))) {
        const formattedName = words.map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        
        // Cache the result
        nameCache.set(email, { name: formattedName, timestamp: Date.now() });
        
        console.log(`AI generated name for ${email}: ${formattedName}`);
        return formattedName;
      }
    }
    
    console.log('AI response not in expected format, falling back to hardcoded names');
    return generateFallbackName(email);
    
  } catch (error) {
    console.error('Error generating AI name:', error.message);
    return generateFallbackName(email);
  }
}

/**
 * Fallback function using simple email-based logic
 * @param {string} email - The user's email address
 * @returns {string} - A generated name based on email characteristics
 */
function generateFallbackName(email) {
  return generateSimpleFallback(email);
}

/**
 * Generates a consistent name for a given email address using AI when possible
 * @param {string} email - The user's email address
 * @returns {Promise<string>} - A generated name like "Stellar Architect" or "Quantum Navigator"
 */
export async function generateUserName(email) {
  return await generateAIName(email);
}

/**
 * Generates a display name - same as generateUserName for consistency
 * @param {string} email - The user's email address
 * @returns {Promise<string>} - A generated name like "Stellar Architect" or "Quantum Navigator"
 */
export async function generateDisplayName(email) {
  return await generateUserName(email);
}

/**
 * Gets the first name from a generated name
 * @param {string} email - The user's email address
 * @returns {Promise<string>} - The first part of the generated name like "Stellar" or "Quantum"
 */
export async function getFirstName(email) {
  const displayName = await generateDisplayName(email);
  return displayName.split(' ')[0];
}

/**
 * Synchronous version that returns cached name or generates fallback immediately
 * Useful for immediate display while async generation happens in background
 * @param {string} email - The user's email address
 * @returns {string} - Cached name or fallback name
 */
export function getDisplayNameSync(email) {
  // Check cache first
  const cached = nameCache.get(email);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.name;
  }
  
  // Return simple fallback immediately
  return generateSimpleFallback(email);
}

/**
 * Synchronous version for first name
 * @param {string} email - The user's email address
 * @returns {string} - First part of cached/fallback name
 */
export function getFirstNameSync(email) {
  const displayName = getDisplayNameSync(email);
  return displayName.split(' ')[0];
}

// Session management utilities for draft handling

/**
 * Generate a unique session ID for the current tab/window
 * This ID persists for the current browser session only
 */
export const getSessionId = () => {
  // Check if we already have a session ID for this tab
  let sessionId = sessionStorage.getItem('form_session_id');
  
  if (!sessionId) {
    // Generate a new session ID (timestamp + random string)
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('form_session_id', sessionId);
  }
  
  return sessionId;
};

/**
 * Clear the current session ID (useful for testing or reset)
 */
export const clearSessionId = () => {
  sessionStorage.removeItem('form_session_id');
};

/**
 * Generate a unique draft ID combining form, user, and session
 */
export const generateDraftId = (formId, userId, sessionId = null, forceUnique = false) => {
  const actualSessionId = sessionId || getSessionId();
  
  if (forceUnique) {
    // Add timestamp and random string for truly unique drafts
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    return `${formId}_${userId}_${actualSessionId}_${timestamp}_${randomString}`;
  }
  
  return `${formId}_${userId}_${actualSessionId}`;
};

/**
 * Parse a draft ID to extract components
 */
export const parseDraftId = (draftId) => {
  const parts = draftId.split('_');
  if (parts.length < 3) return null;
  
  // The session part might contain underscores, so we need to be careful
  const formId = parts[0];
  const userId = parts[1];
  const sessionId = parts.slice(2).join('_'); // Rejoin in case session ID has underscores
  
  return { formId, userId, sessionId };
};

/**
 * Check if a draft belongs to the current session
 */
export const isDraftFromCurrentSession = (draftId) => {
  const currentSessionId = getSessionId();
  const parsed = parseDraftId(draftId);
  return parsed && parsed.sessionId === currentSessionId;
};

/**
 * Format session display name for UI
 */
export const formatSessionDisplay = (sessionId) => {
  if (!sessionId) return 'Unknown Session';
  
  // Extract timestamp from session ID
  const parts = sessionId.split('_');
  if (parts.length >= 2 && parts[0] === 'session') {
    const timestamp = parseInt(parts[1]);
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp);
      return `Tab opened ${date.toLocaleString()}`;
    }
  }
  
  return 'Browser Tab';
};

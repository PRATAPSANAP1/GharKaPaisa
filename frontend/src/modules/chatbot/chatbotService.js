import api from '../../services/api';

const SESSION_KEY = 'gkp_chatbot_session_id';

export function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function resetSessionId() {
  const sid = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, sid);
  return sid;
}

/**
 * Create or retrieve an active conversation for the current session.
 */
export async function createConversation(sessionId) {
  const sid = sessionId || getSessionId();
  const res = await api.post('/chatbot/conversation', { session_id: sid });
  return res.data;
}

/**
 * Send message to chatbot backend endpoint
 */
export async function sendMessage(message, userRole = 'PUBLIC', panel = 'public') {
  const sessionId = getSessionId();
  const res = await api.post('/chatbot/message', {
    message,
    session_id: sessionId,
    user_role: userRole,
    panel: panel
  });
  return res.data;
}

/**
 * Send action click to chatbot backend endpoint
 */
export async function sendAction(action, label, userRole = 'PUBLIC', panel = 'public') {
  const sessionId = getSessionId();
  const res = await api.post('/chatbot/action', {
    action,
    label,
    session_id: sessionId,
    user_role: userRole,
    panel: panel
  });
  return res.data;
}

/**
 * Reset active conversation session
 */
export async function resetConversation(sessionId) {
  const sid = sessionId || getSessionId();
  const res = await api.post('/chatbot/reset', { session_id: sid });
  resetSessionId();
  return res.data;
}

/**
 * Submit feedback rating (1-5)
 */
export async function submitFeedback(rating) {
  const sessionId = getSessionId();
  const res = await api.post('/chatbot/feedback', {
    session_id: sessionId,
    rating
  });
  return res.data;
}

/**
 * Search knowledge base
 */
export async function searchKnowledgeBase(keyword) {
  const res = await api.get('/chatbot/search', { params: { keyword } });
  return res.data;
}

/**
 * Get FAQ entries by category
 */
export async function getFAQ(category) {
  const res = await api.get(`/chatbot/faq/${category}`);
  return res.data;
}

/**
 * chatbotService.js — Frontend API layer for the free chatbot backend
 *
 * Uses the existing `api` axios instance (services/api.js) which handles
 * auth token injection and refresh automatically.
 *
 * Session IDs are persisted in sessionStorage so conversations survive
 * page navigations within the same tab.
 */
import api from './api';

// ── Session Management ────────────────────────────────────────────────────────
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

// ── API Calls ─────────────────────────────────────────────────────────────────

/**
 * Create or retrieve an active conversation for the current session.
 */
export async function createConversation(sessionId) {
  const res = await api.post('/chatbot/conversation', { session_id: sessionId });
  return res.data;
}

/**
 * Send a text message and get the bot's NLP-powered response.
 * Backend runs intent detection (keyword scoring algorithm — 100% free).
 */
export async function sendMessage(sessionId, message, userRole = 'PUBLIC') {
  const res = await api.post('/chatbot/message', {
    session_id: sessionId,
    message,
    user_role: userRole,
  });
  return res.data;
}

/**
 * Send an action chip click and get the response + optional redirect URL.
 */
export async function sendAction(sessionId, action, label, userRole = 'PUBLIC') {
  const res = await api.post('/chatbot/action', {
    session_id: sessionId,
    action,
    label,
    user_role: userRole,
  });
  return res.data;
}

/**
 * Reset the current conversation (marks old as RESOLVED, starts new).
 */
export async function resetConversation(sessionId) {
  const res = await api.post('/chatbot/reset', { session_id: sessionId });
  return res.data;
}

/**
 * Submit a satisfaction rating (1–5) for the conversation.
 * Requires JWT authentication.
 */
export async function submitFeedback(sessionId, rating) {
  const res = await api.post('/chatbot/feedback', {
    session_id: sessionId,
    rating,
  });
  return res.data;
}

/**
 * Search the knowledge base by keyword.
 */
export async function searchKnowledgeBase(keyword) {
  const res = await api.get('/chatbot/search', { params: { keyword } });
  return res.data;
}

/**
 * Get FAQ entries for a specific category.
 */
export async function getFAQ(category) {
  const res = await api.get(`/chatbot/faq/${category}`);
  return res.data;
}

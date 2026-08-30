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
export async function resetConversation() {
  const sessionId = getSessionId();
  const res = await api.post('/chatbot/reset', { session_id: sessionId });
  resetSessionId();
  return res.data;
}

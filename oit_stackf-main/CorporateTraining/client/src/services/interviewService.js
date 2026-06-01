import api from './api';

const interviewService = {
  startInterview: (type) => api.post('/interview/start', { type }),
  sendAnswer: (history, answer, type) => api.post('/interview/answer', { history, answer, type }),
  endInterview: (history, duration, type) => api.post('/interview/end', { history, duration, type }),
  getHistory: () => api.get('/interview/history'),
};

export default interviewService;


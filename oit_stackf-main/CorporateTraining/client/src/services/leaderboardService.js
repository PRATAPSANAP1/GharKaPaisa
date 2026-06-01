import api from './api';

const leaderboardService = {
  getLeaderboard: (params) => api.get('/leaderboard', { params }),
};

export default leaderboardService;


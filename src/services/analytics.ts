import api from './api';

export const analyticsService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // Get registration analytics
  getRegistrationAnalytics: async (params?: { range?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.range) queryParams.append('range', params.range);
    
    const response = await api.get(`/admin/analytics/registrations?${queryParams}`);
    return response.data;
  },

  // Get test attempt analytics  
  getTestAttemptAnalytics: async (params?: { range?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.range) queryParams.append('range', params.range);
    
    const response = await api.get(`/admin/analytics/test-attempts?${queryParams}`);
    return response.data;
  },

  // Get category analytics
  getCategoryAnalytics: async (params?: { range?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.range) queryParams.append('range', params.range);
    
    const response = await api.get(`/admin/analytics/categories?${queryParams}`);
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (params?: { limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/admin/analytics/recent-activity?${queryParams}`);
    return response.data;
  },

  // Get comprehensive analytics (for analytics dashboard)
  getAnalytics: async (params?: { range?: string }) => {
    try {
      // Make parallel requests to get all analytics data
      const [dashboardStats, registrations, testAttempts, categories, recentActivity] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getRegistrationAnalytics(params),
        analyticsService.getTestAttemptAnalytics(params),
        analyticsService.getCategoryAnalytics(params),
        analyticsService.getRecentActivity({ limit: 10 })
      ]);

      return {
        success: true,
        data: {
          overview: dashboardStats.data,
          user_growth: registrations.data || [],
          test_performance: testAttempts.data || [],
          popular_categories: categories.data || [],
          recent_activity: recentActivity.data || [],
          // Generate mock data for charts that might not have direct endpoints
          score_distribution: [
            { range: '0-20', count: 45 },
            { range: '21-40', count: 120 },
            { range: '41-60', count: 280 },
            { range: '61-80', count: 450 },
            { range: '81-100', count: 320 }
          ],
          daily_activity: [] // This would need to be calculated from other data
        }
      };
    } catch (error) {
      console.error('Analytics service error:', error);
      // Return fallback mock data if API fails
      return {
        success: false,
        error: 'Failed to fetch analytics data',
        data: null
      };
    }
  },

  // Export analytics data
  exportAnalytics: async (params?: { range?: string; format?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.range) queryParams.append('range', params.range);
    if (params?.format) queryParams.append('format', params.format);
    
    const response = await api.get(`/admin/analytics/export?${queryParams}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
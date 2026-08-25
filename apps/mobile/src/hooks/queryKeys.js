/**
 * React Query cache contracts. Keep user-scoped keys consistent so mutations
 * can invalidate every related query without duplicating array shapes.
 */
export const queryKeys = {
  appointments: (userId) => ['appointments', userId],
  categoryPrefs: (userId) => ['category_prefs', userId],
  community: {
    feed: (userId, filter, filters = {}) => [
      'community_feed',
      userId,
      filter,
      ...(filters.followedCategoryIds ? [filters.followedCategoryIds] : []),
      ...(filters.blockedCategoryIds ? [filters.blockedCategoryIds] : []),
      ...(filters.categoryId ? [filters.categoryId] : []),
    ],
    root: (userId) => ['community_feed', userId],
    post: (postId, userId) => ['post_detail', postId, userId],
    postRoot: (postId) => ['post_detail', postId],
    notifications: (userId) => ['community_notifications', userId],
  },
  education: (userId) => ['education', userId],
  emergencyContacts: (userId) => ['emergencyContacts', userId],
  contactCallLogs: (userId, contactId) => ['contactCallLogs', userId, contactId],
  dailySummaries: (userId, startDate = null) => ['dailySummaries', userId, startDate],
  dailySummariesRoot: (userId) => ['dailySummaries', userId],
  healthLogs: (userId, date) => ['healthLogs', userId, date],
  healthLogsRoot: (userId) => ['healthLogs', userId],
  triggers: (userId, startDate, endDate) => ['triggers', userId, startDate, endDate],
  hydrationContainers: (userId) => ['hydrationContainers', userId],
  medications: (userId) => ['medications', userId],
  medicationHistory: (userId, medicationId) => ['medicationHistory', userId, medicationId],
  drugInfo: (drugName) => ['drugInfo', drugName?.toLowerCase()],
  metricGoals: (userId) => ['metricGoals', userId],
  profile: (userId) => ['profile', userId],
  savedFacilities: (userId) => ['savedFacilities', userId],
  streak: (userId) => ['streak', userId],
  systemNotifications: (userId) => ['system_notifications', userId],
};

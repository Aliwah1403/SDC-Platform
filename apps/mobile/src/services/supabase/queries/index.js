// Read-only Supabase boundary. Domain files remain compatibility modules while
// callers migrate to this explicit query surface.
export {
  fetchAppointments,
} from '../appointments';
export {
  fetchCommunityFeed,
  fetchPostDetail,
  fetchCategoryPreferences,
  fetchCommunityNotifications,
  fetchSystemNotifications,
} from '../community';
export { fetchDrugInfo, fetchDoseForm } from '../drug-info';
export { fetchEducationCategories, fetchEducationArticles } from '../education';
export { fetchEmergencyContacts, fetchContactCallLogs } from '../emergency-contacts';
export { fetchSavedFacilities } from '../facilities';
export { fetchMetricGoals } from '../goals';
export { fetchDailySummaries, fetchHealthLogs, fetchTriggersInRange } from '../health';
export { fetchHydrationContainers } from '../hydration';
export { fetchMedications, fetchMedicationHistory } from '../medications';
export { fetchProfile } from '../profile';
export { fetchStreak } from '../streak';

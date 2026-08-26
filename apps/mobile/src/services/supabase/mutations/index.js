// State-changing Supabase boundary. Keep external-service orchestration out of
// these functions; long-running work belongs in apps/workers.
export {
  addAppointment,
  updateAppointment,
  deleteAppointment,
} from '../appointments';
export {
  createCommunityPost,
  deleteCommunityPost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  reportCommunityPost,
  reportCommunityComment,
  addComment,
  addReply,
  deleteComment,
  voteOnPoll,
  upsertCategoryPreference,
  deleteCategoryPreference,
  markAllCommunityNotificationsRead,
  markAllSystemNotificationsRead,
} from '../community';
export {
  addEmergencyContact,
  uploadContactPhoto,
  recordContactCall,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../emergency-contacts';
export { saveFacility, unsaveFacility } from '../facilities';
export { updateMetricGoal } from '../goals';
export { submitHealthLog, addHydrationQuickly } from '../health';
export {
  addHydrationContainer,
  updateHydrationContainer,
  removeHydrationContainer,
  setDefaultHydrationContainer,
} from '../hydration';
export {
  addMedication,
  updateMedication,
  deleteMedication,
  toggleMedicationTaken,
  addMedicationLog,
  deleteMedicationLogById,
  deleteLatestMedicationLog,
  markGroupTaken,
} from '../medications';
export { updateProfile, uploadAvatar, completeOnboarding } from '../profile';
export { acknowledgeStreakLoss, repairStreak, updateClaimedBadges } from '../streak';

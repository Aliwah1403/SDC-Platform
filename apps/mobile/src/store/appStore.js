import { create } from "zustand";
import { mockCommunityPosts, mockNotifications } from "@/types";

export const useAppStore = create((set) => ({
  // ── Onboarding form state (ephemeral; written to Supabase on complete) ────────
  onboardingData: {
    nickname: null,
    dob: null,
    scdType: null,
    emergencyContacts: [],
    checkInTime: null,
    notificationsEnabled: false,
    biometricsEnabled: false,
    height: null,
    weight: null,
    locationEnabled: false,
    medications: [],
    healthDataConnected: [],
    bloodType: null,
    allergies: [],
  },

  setOnboardingField: (field, value) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, [field]: value },
    })),

  resetOnboarding: () =>
    set({
      onboardingData: {
        nickname: null,
        dob: null,
        scdType: null,
        emergencyContacts: [],
        checkInTime: null,
        notificationsEnabled: false,
        biometricsEnabled: false,
        height: null,
        weight: null,
        locationEnabled: false,
        medications: [],
        healthDataConnected: [],
        bloodType: null,
        allergies: [],
      },
    }),

  // ── Symptom log form state (ephemeral; reset after submission) ─────────────
  currentSymptomLog: {
    painLevel: 0,
    bodyLocations: [],
    symptoms: [],
    mood: "fair",
    hydration: 0,
    notes: "",
    triggers: [],
    activities: [],
  },

  updateSymptomLog: (updates) =>
    set((state) => ({
      currentSymptomLog: { ...state.currentSymptomLog, ...updates },
    })),

  resetSymptomLog: () =>
    set({
      currentSymptomLog: {
        painLevel: 0,
        bodyLocations: [],
        symptoms: [],
        mood: "fair",
        hydration: 0,
        notes: "",
        triggers: [],
        activities: [],
      },
    }),

  // ── Client-only UI state ────────────────────────────────────────────────────
  isEmergencyMode: false,
  setEmergencyMode: (v) => set({ isEmergencyMode: v }),

  // ── Milestone celebration ───────────────────────────────────────────────────
  // { milestoneId, type, title, subtitle, streakCount? } | null
  pendingMilestone: null,
  setPendingMilestone: (m) => set({ pendingMilestone: m }),
  clearPendingMilestone: () => set({ pendingMilestone: null }),

  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Community state ────────────────────────────────────────────────────────
  communityPosts: mockCommunityPosts,
  addCommunityPost: (post) =>
    set((state) => ({ communityPosts: [post, ...state.communityPosts] })),

  likedPostIds: [],
  toggleLike: (postId) =>
    set((state) => ({
      likedPostIds: state.likedPostIds.includes(postId)
        ? state.likedPostIds.filter((id) => id !== postId)
        : [...state.likedPostIds, postId],
    })),

  savedPostIds: [],
  toggleSave: (postId) =>
    set((state) => ({
      savedPostIds: state.savedPostIds.includes(postId)
        ? state.savedPostIds.filter((id) => id !== postId)
        : [...state.savedPostIds, postId],
    })),

  followedCategoryIds: [],
  toggleFollowCategory: (categoryId) =>
    set((state) => ({
      followedCategoryIds: state.followedCategoryIds.includes(categoryId)
        ? state.followedCategoryIds.filter((id) => id !== categoryId)
        : [...state.followedCategoryIds, categoryId],
      // unblock when following
      blockedCategoryIds: state.blockedCategoryIds.filter(
        (id) => id !== categoryId
      ),
    })),

  blockedCategoryIds: [],
  toggleBlockCategory: (categoryId) =>
    set((state) => ({
      blockedCategoryIds: state.blockedCategoryIds.includes(categoryId)
        ? state.blockedCategoryIds.filter((id) => id !== categoryId)
        : [...state.blockedCategoryIds, categoryId],
      // unfollow when blocking
      followedCategoryIds: state.followedCategoryIds.filter(
        (id) => id !== categoryId
      ),
    })),

  // ── Polls ──────────────────────────────────────────────────────────────────
  pollVotes: {}, // { [postId]: optionId }
  voteOnPoll: (postId, optionId) =>
    set((state) => {
      const prev = state.pollVotes[postId];
      const updatedPosts = state.communityPosts.map((p) => {
        if (p.id !== postId || !p.poll) return p;
        return {
          ...p,
          poll: {
            ...p.poll,
            options: p.poll.options.map((o) => ({
              ...o,
              votes:
                o.id === optionId
                  ? o.votes + 1
                  : o.id === prev
                  ? Math.max(0, o.votes - 1)
                  : o.votes,
            })),
          },
        };
      });
      return {
        pollVotes: { ...state.pollVotes, [postId]: optionId },
        communityPosts: updatedPosts,
      };
    }),

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: mockNotifications,
  notificationCount: mockNotifications.filter((n) => !n.read).length,
  markAllNotificationsRead: () =>
    set((state) => ({
      notificationCount: 0,
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  // ── Saved facilities ───────────────────────────────────────────────────────
  // Full facility objects persisted to Supabase. Optimistically updated locally.
  savedFacilities: [],
  setSavedFacilities: (facilities) => set({ savedFacilities: facilities }),
  toggleSavedFacility: (facility) =>
    set((state) => {
      const exists = state.savedFacilities.some((f) => f.placeId === facility.placeId);
      return {
        savedFacilities: exists
          ? state.savedFacilities.filter((f) => f.placeId !== facility.placeId)
          : [...state.savedFacilities, facility],
      };
    }),

  // ── Facility search caches ─────────────────────────────────────────────────
  // facilitiesCache: keyed by "lat,lng" — stores list results + nextPageToken + timestamp
  // placeDetailsCache: keyed by placeId — stores individual normalized facility objects
  facilitiesCache: {},
  placeDetailsCache: {},
  setFacilitiesCache: (key, payload) =>
    set((state) => ({
      facilitiesCache: { ...state.facilitiesCache, [key]: { ...payload, ts: Date.now() } },
    })),
  setPlaceDetails: (id, data) =>
    set((state) => ({
      placeDetailsCache: { ...state.placeDetailsCache, [id]: data },
    })),

  // ── Chat state (local AI session) ──────────────────────────────────────────
  chatMessages: [],
  isTyping: false,
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setTyping: (v) => set({ isTyping: v }),
  clearChat: () => set({ chatMessages: [] }),

  // ── Crisis plan (user-editable, persists across sessions) ─────────────────
  crisisPlan: {
    warningSigns: [
      "Sudden severe pain in chest, abdomen, or limbs",
      "Difficulty breathing or shortness of breath",
      "Stroke symptoms: slurred speech, facial droop, arm weakness",
      "Severe headache or vision changes",
      "High fever (above 38.5°C / 101.3°F)",
      "Priapism (painful, prolonged erection)",
      "Severe anaemia symptoms: extreme fatigue, pale skin",
    ],
    bloodType: null,
    allergies: [],
    erNotes: "",
  },
  updateCrisisPlan: (updates) =>
    set((state) => ({
      crisisPlan: { ...state.crisisPlan, ...updates },
    })),

  // ── Crisis mode (active crisis session state) ──────────────────────────────
  crisisMode: {
    isActive: false,
    startedAt: null,
    currentStep: 1,              // 1 = Mild, 2 = Moderate, 3 = Severe
    initialPainLevel: 0,
    checkInHistory: [],          // { timestamp, response: 'better'|'same'|'worse', step }
    scheduledNotificationIds: [],
    alertsSent: [],              // { timestamp, contactId }
  },
  startCrisisMode: (painLevel) =>
    set({
      crisisMode: {
        isActive: true,
        startedAt: new Date().toISOString(),
        currentStep: painLevel <= 4 ? 1 : painLevel <= 7 ? 2 : 3,
        initialPainLevel: painLevel,
        checkInHistory: [],
        scheduledNotificationIds: [],
        alertsSent: [],
      },
    }),
  endCrisisMode: () =>
    set((state) => ({
      crisisMode: { ...state.crisisMode, isActive: false },
    })),
  recordCrisisCheckIn: (response) =>
    set((state) => {
      const entry = {
        timestamp: new Date().toISOString(),
        response,
        step: state.crisisMode.currentStep,
      };
      const shouldEscalate =
        response === "worse" && state.crisisMode.currentStep < 3;
      return {
        crisisMode: {
          ...state.crisisMode,
          checkInHistory: [...state.crisisMode.checkInHistory, entry],
          currentStep: shouldEscalate
            ? state.crisisMode.currentStep + 1
            : state.crisisMode.currentStep,
        },
      };
    }),
  escalateCrisis: () =>
    set((state) => ({
      crisisMode: {
        ...state.crisisMode,
        currentStep: Math.min(state.crisisMode.currentStep + 1, 3),
      },
    })),
  deescalateCrisis: () =>
    set((state) => ({
      crisisMode: {
        ...state.crisisMode,
        currentStep: Math.max(state.crisisMode.currentStep - 1, 1),
      },
    })),
  addCrisisAlert: (contactId) =>
    set((state) => ({
      crisisMode: {
        ...state.crisisMode,
        alertsSent: [
          ...state.crisisMode.alertsSent,
          { timestamp: new Date().toISOString(), contactId },
        ],
      },
    })),
  setCrisisNotificationIds: (ids) =>
    set((state) => ({
      crisisMode: { ...state.crisisMode, scheduledNotificationIds: ids },
    })),
}));

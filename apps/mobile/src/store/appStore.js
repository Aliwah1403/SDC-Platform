import { create } from "zustand";
import { mockCommunityPosts } from "@/types";

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

  // ── Facility favourites ────────────────────────────────────────────────────
  favouriteHospitalIds: [],
  toggleFavouriteHospital: (id) =>
    set((state) => ({
      favouriteHospitalIds: state.favouriteHospitalIds.includes(id)
        ? state.favouriteHospitalIds.filter((fid) => fid !== id)
        : [...state.favouriteHospitalIds, id],
    })),

  // ── Chat state (local AI session) ──────────────────────────────────────────
  chatMessages: [],
  isTyping: false,
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setTyping: (v) => set({ isTyping: v }),
  clearChat: () => set({ chatMessages: [] }),
}));

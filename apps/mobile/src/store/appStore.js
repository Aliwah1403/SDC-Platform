import { create } from "zustand";

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

  // ── Community — device-local only (hide is not synced to server) ───────────
  hiddenPostIds: [],
  hidePost: (postId) =>
    set((state) => ({
      hiddenPostIds: state.hiddenPostIds.includes(postId)
        ? state.hiddenPostIds
        : [...state.hiddenPostIds, postId],
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

  // ── Apple Health / HealthKit ────────────────────────────────────────────────
  // healthKitData: keyed by "YYYY-MM-DD"; merged into healthData for display.
  // Values silently override steps/heartRate/sleepHours from manual logs.
  // New fields (spO2, temperature, respiratoryRate) are additive.
  healthKitConnected: false,
  healthKitData: {},
  healthKitAlerts: [],
  healthKitPreferences: {
    readSteps: true,
    readHeartRate: true,
    readSpO2: true,
    readTemperature: true,
    readRespiratoryRate: true,
    readSleep: true,
    writeHydration: true,
    writeSymptoms: true,
    writeMood: true,
  },

  healthKitBaselines: null,
  computedAlertState: null,

  setHealthKitConnected: (val) => set({ healthKitConnected: val }),
  setHealthKitBaselines: (b) => set({ healthKitBaselines: b }),
  setComputedAlertState: (s) => set({ computedAlertState: s }),

  setHealthKitPreference: (key, value) =>
    set((state) => ({
      healthKitPreferences: { ...state.healthKitPreferences, [key]: value },
    })),

  mergeHealthKitDay: (date, metrics) =>
    set((state) => ({
      healthKitData: {
        ...state.healthKitData,
        [date]: { ...(state.healthKitData[date] ?? {}), ...metrics },
      },
    })),

  setHealthKitRange: (rangeMap) =>
    set((state) => {
      const merged = { ...state.healthKitData };
      for (const [date, metrics] of Object.entries(rangeMap)) {
        merged[date] = { ...(merged[date] ?? {}), ...metrics };
      }
      return { healthKitData: merged };
    }),

  addHealthKitAlert: (alert) =>
    set((state) => ({
      healthKitAlerts: [
        ...state.healthKitAlerts.filter((a) => a.id !== alert.id),
        alert,
      ],
    })),

  dismissHealthKitAlert: (id) =>
    set((state) => ({
      healthKitAlerts: state.healthKitAlerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    })),

  // ── App Lock ────────────────────────────────────────────────────────────────
  appLockEnabled: false,
  appLockTimeout: 1, // minutes: 0=immediately, 1, 5, 15, 60
  setAppLockEnabled: (val) => set({ appLockEnabled: val }),
  setAppLockTimeout: (minutes) => set({ appLockTimeout: minutes }),

  // ── Push notifications ─────────────────────────────────────────────────────
  expoPushToken: null,
  setExpoPushToken: (token) => set({ expoPushToken: token }),

  // ── Apple Health manual baselines ──────────────────────────────────────────
  // Overrides the rolling-average baseline for users with chronic atypical values.
  healthKitManualBaselines: {
    spO2: null,       // e.g. 93 (%) — user's known chronic SpO2
    heartRate: null,  // e.g. 88 (bpm) — user's known resting HR
  },
  setHealthKitManualBaseline: (metric, value) =>
    set((state) => ({
      healthKitManualBaselines: { ...state.healthKitManualBaselines, [metric]: value },
    })),
}));

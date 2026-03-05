import { create } from "zustand";
import { mockUser, generateMockHealthData, mockEmergencyContacts } from "../types";

const mockHealthData = generateMockHealthData();

export const useAppStore = create((set, get) => ({
  // User & Profile State
  currentUser: mockUser,
  isOnboardingComplete: true, // Set to true to skip onboarding for now

  // Health Tracking State
  healthStreak: 23,
  lastLogDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday — no log today
  todaysLog: null,
  healthData: mockHealthData,

  // Streak Repairs State
  repairsAvailable: 2,
  repairsUsed: 1,
  repairsEarned: 3,
  daysUntilNextRepair: 14,
  missedDay: null, // Store info about the missed day that can be repaired

  // Emergency State
  emergencyContacts: mockEmergencyContacts,
  isEmergencyMode: false,

  // Navigation State
  activeTab: "dashboard",

  // Symptom Tracking
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

  // Chat State (for AI Learn section)
  chatMessages: [],
  isTyping: false,

  // Actions
  setUser: (user) => set({ currentUser: user }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setEmergencyMode: (isEmergency) => set({ isEmergencyMode: isEmergency }),

  updateSymptomLog: (updates) =>
    set((state) => ({
      currentSymptomLog: { ...state.currentSymptomLog, ...updates },
    })),

  submitSymptomLog: () => {
    const state = get();
    const newLog = {
      id: Date.now().toString(),
      userId: state.currentUser?.id,
      date: new Date(),
      ...state.currentSymptomLog,
    };

    // Add to health data
    const todayStr = new Date().toISOString().split("T")[0];
    const updatedHealthData = [...state.healthData];
    const existingIndex = updatedHealthData.findIndex(
      (d) => d.date === todayStr,
    );

    const moodValue =
      state.currentSymptomLog.mood === "excellent"
        ? 5
        : state.currentSymptomLog.mood === "good"
          ? 4
          : state.currentSymptomLog.mood === "fair"
            ? 3
            : state.currentSymptomLog.mood === "poor"
              ? 2
              : 1;

    const newHealthData = {
      date: todayStr,
      painLevel: state.currentSymptomLog.painLevel,
      hydration: state.currentSymptomLog.hydration || 8,
      mood: moodValue,
    };

    if (existingIndex >= 0) {
      updatedHealthData[existingIndex] = newHealthData;
    } else {
      updatedHealthData.push(newHealthData);
    }

    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive =
      state.lastLogDate &&
      state.lastLogDate.toDateString() === yesterday.toDateString();

    set({
      healthData: updatedHealthData,
      todaysLog: newLog,
      lastLogDate: new Date(),
      healthStreak: isConsecutive ? state.healthStreak + 1 : 1,
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
    });
  },

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

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  setTyping: (isTyping) => set({ isTyping }),

  clearChat: () => set({ chatMessages: [] }),

  // Streak Repair Actions
  detectMissedDay: () => {
    const state = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const hasYesterdayLog = state.healthData.some(
      (d) => d.date === yesterdayStr,
    );

    // Check if we have a last log date
    if (state.lastLogDate) {
      const lastLog = new Date(state.lastLogDate);
      lastLog.setHours(0, 0, 0, 0);

      const daysSinceLastLog = Math.floor(
        (today - lastLog) / (1000 * 60 * 60 * 24),
      );

      // If it's been more than 1 day since last log and we haven't logged today
      if (daysSinceLastLog > 1) {
        const missedDate = new Date(lastLog);
        missedDate.setDate(missedDate.getDate() + 1);

        set({
          missedDay: {
            date: missedDate,
            dateString: missedDate.toISOString().split("T")[0],
            formattedDate: missedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }),
            daysAgo: daysSinceLastLog - 1,
          },
        });
        return true;
      }
    }

    set({ missedDay: null });
    return false;
  },

  useStreakRepair: () => {
    const state = get();

    if (state.repairsAvailable <= 0) {
      return { success: false, error: "No repairs available" };
    }

    if (!state.missedDay) {
      return { success: false, error: "No missed day to repair" };
    }

    // Create a placeholder entry for the missed day
    const repairedEntry = {
      date: state.missedDay.dateString,
      painLevel: 0,
      hydration: 0,
      mood: 0,
      isRepaired: true, // Flag to indicate this was repaired
    };

    const updatedHealthData = [...state.healthData, repairedEntry].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    set({
      healthData: updatedHealthData,
      repairsAvailable: state.repairsAvailable - 1,
      repairsUsed: state.repairsUsed + 1,
      missedDay: null,
    });

    return { success: true };
  },

  dismissMissedDay: () => {
    set({ missedDay: null });
  },

  // Health data helpers
  getTodaysHealthData: () => {
    const state = get();
    const todayStr = new Date().toISOString().split("T")[0];
    return state.healthData.find((d) => d.date === todayStr);
  },

  getHealthDataForDate: (date) => {
    const state = get();
    const dateStr = date.toISOString().split("T")[0];
    return state.healthData.find((d) => d.date === dateStr);
  },

  getWeeklyAverage: (metric) => {
    const state = get();
    const lastWeek = state.healthData.slice(-7);
    if (lastWeek.length === 0) return 0;

    const sum = lastWeek.reduce((acc, day) => acc + (day[metric] || 0), 0);
    return Math.round((sum / lastWeek.length) * 10) / 10;
  },
}));

import { create } from "zustand";
import { mockUser, generateMockHealthData, mockEmergencyContacts, mockMedications, mockAppointments } from "../types";

const mockHealthData = generateMockHealthData();

export const useAppStore = create((set, get) => ({
  // User & Profile State
  currentUser: mockUser,
  isOnboardingComplete: true,

  // Onboarding Data
  onboardingComplete: true,
  onboardingData: {
    nickname: null,      // preferred name e.g. "Cuto"
    dob: null,           // ISO date string e.g. "1995-04-15"
    scdType: null,       // e.g. "HbSS", "HbSC", "unsure"
    emergencyContacts: [],
    checkInTime: null,   // e.g. "20:00"
    notificationsEnabled: false,
    biometricsEnabled: false,
    height: null,        // in cm
    weight: null,        // in kg
    locationEnabled: false,
    medications: [],
    healthDataConnected: [],
  },

  // Health Tracking State
  healthStreak: 23,
  lastLogDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday — no log today
  todaysLog: null,
  healthData: mockHealthData,
  healthLogs: [], // raw append-only archive — N entries per day possible

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

  // Medications
  medications: mockMedications,

  // Appointments
  appointments: mockAppointments,

  // Metric Goals
  metricGoals: { hydration: 8, sleep: 8, steps: 10000 },

  // Actions
  setUser: (user) => set({ currentUser: user }),

  setOnboardingField: (field, value) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, [field]: value },
    })),

  completeOnboarding: () => {
    const state = get();
    const existing = state.medications.map((m) => m.name.toLowerCase());
    const newMeds = (state.onboardingData.medications || [])
      .filter((m) => !existing.includes(m.name.toLowerCase()))
      .map((m, i) => ({
        id: `onboarding-${Date.now()}-${i}`,
        name: m.name,
        dosage: m.dosage || "",
        frequency: m.frequency || "Daily",
        prescribedBy: "",
        startDate: new Date(),
        isActive: true,
        time: "8:00 AM",
        nextDose: "08:00 AM",
        taken: false,
        takenAt: null,
        notes: "",
        category: m.category || "Supportive",
        type: m.type || "tablet",
      }));
    set({
      onboardingComplete: true,
      isOnboardingComplete: true,
      medications: [...state.medications, ...newMeds],
    });
  },

  resetOnboarding: () =>
    set({
      onboardingComplete: false,
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

  // Medication CRUD
  addMedication: (med) =>
    set((state) => ({
      medications: [
        ...state.medications,
        { ...med, id: Date.now().toString(), isActive: true, taken: false, takenAt: null, type: med.type || "tablet" },
      ],
    })),

  updateMedication: (id, updates) =>
    set((state) => ({
      medications: state.medications.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  deleteMedication: (id) =>
    set((state) => ({ medications: state.medications.filter((m) => m.id !== id) })),

  toggleMedicationTaken: (id) =>
    set((state) => ({
      medications: state.medications.map((m) => {
        if (m.id !== id) return m;
        const nowTaken = !m.taken;
        return { ...m, taken: nowTaken, takenAt: nowTaken ? new Date().toISOString() : null };
      }),
    })),

  markGroupTaken: (ids) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        ids.includes(m.id) ? { ...m, taken: true, takenAt: new Date().toISOString() } : m
      ),
    })),

  addMedicationLog: (id) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === id
          ? { ...m, logs: [...(m.logs ?? []), { time: new Date().toISOString() }] }
          : m
      ),
    })),

  getActiveMedications: () => get().medications.filter((m) => m.isActive),

  getDueCount: () => get().medications.filter((m) => m.isActive && !m.taken).length,

  // Appointment actions
  addAppointment: (appt) =>
    set((state) => ({ appointments: [...state.appointments, appt] })),

  updateAppointment: (id, changes) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...changes } : a
      ),
    })),

  deleteAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),

  setMetricGoal: (metric, value) =>
    set((state) => ({ metricGoals: { ...state.metricGoals, [metric]: value } })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setEmergencyMode: (isEmergency) => set({ isEmergencyMode: isEmergency }),

  updateSymptomLog: (updates) =>
    set((state) => ({
      currentSymptomLog: { ...state.currentSymptomLog, ...updates },
    })),

  submitSymptomLog: () => {
    const state = get();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

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

    // Append to raw log archive (never replace)
    const newLog = {
      id: now.getTime().toString(),
      userId: state.currentUser?.id,
      date: todayStr,
      timestamp: now.toISOString(),
      ...state.currentSymptomLog,
      mood: moodValue,
    };
    const updatedHealthLogs = [...state.healthLogs, newLog];

    // Re-derive daily summary from ALL logs for today
    const todaysLogs = updatedHealthLogs.filter((l) => l.date === todayStr);
    const existingEntry = state.healthData.find((d) => d.date === todayStr);

    const aggregatedEntry = {
      date: todayStr,
      // Preserve Apple Health fields from existing entry if present
      steps: existingEntry?.steps,
      sleepHours: existingEntry?.sleepHours,
      heartRate: existingEntry?.heartRate,
      // Aggregate from manual logs: max pain, max hydration, most recent mood
      painLevel: Math.max(...todaysLogs.map((l) => l.painLevel ?? 0)),
      hydration: Math.max(...todaysLogs.map((l) => l.hydration ?? 0)),
      mood: todaysLogs[todaysLogs.length - 1].mood,
    };

    const updatedHealthData = [...state.healthData];
    const existingIndex = updatedHealthData.findIndex((d) => d.date === todayStr);
    if (existingIndex >= 0) {
      updatedHealthData[existingIndex] = aggregatedEntry;
    } else {
      updatedHealthData.push(aggregatedEntry);
    }

    // Update streak — only change if not already logged today
    const alreadyLoggedToday =
      state.lastLogDate &&
      new Date(state.lastLogDate).toDateString() === now.toDateString();

    let newStreak = state.healthStreak;
    let newLastLogDate = state.lastLogDate;

    if (!alreadyLoggedToday) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive =
        state.lastLogDate &&
        new Date(state.lastLogDate).toDateString() === yesterday.toDateString();
      newStreak = isConsecutive ? state.healthStreak + 1 : 1;
      newLastLogDate = now;
    }

    set({
      healthData: updatedHealthData,
      healthLogs: updatedHealthLogs,
      todaysLog: newLog,
      lastLogDate: newLastLogDate,
      healthStreak: newStreak,
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

  // Raw log helpers
  getLogsForDate: (dateStr) => {
    const state = get();
    return state.healthLogs
      .filter((l) => l.date === dateStr)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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

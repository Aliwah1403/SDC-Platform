import SummaryView from "./_SummaryView";
import type { HealthSummaryData } from "@/components/pdfx/HealthSummaryDocument";

const DUMMY: HealthSummaryData = {
  generatedAt: "2026-05-22",
  dateRange: { start: "2026-04-22", end: "2026-05-22" },
  periodDays: 30,
  profile: {
    full_name: "Amara Johnson",
    nickname: "Amara",
    dob: "1995-08-14",
    scd_type: "HbSS",
    preferred_hospital: "King's College Hospital",
    blood_type: "O+",
  },
  streak: { current: 7, longest: 23, badgesEarned: 5 },
  stats: { totalDaysLogged: 24, avgPain: 3.4, avgHydration: 6.2, avgMood: 3.1, avgSleep: 7.2, avgSteps: 4800, avgHeartRate: 78 },
  topSymptoms: [
    { name: "Fatigue", count: 14 },
    { name: "Joint pain", count: 11 },
    { name: "Headache", count: 7 },
    { name: "Shortness of breath", count: 4 },
    { name: "Swollen hands", count: 3 },
  ],
  topTriggers: [
    { name: "Cold weather", count: 9 },
    { name: "Dehydration", count: 8 },
    { name: "Stress", count: 6 },
    { name: "Overexertion", count: 4 },
  ],
  medications: [
    { id: "1", name: "Hydroxyurea", dosage: "500mg", frequency: "Every Day", category: "Disease-modifying", prescribed_by: "Dr. Osei-Mensah", is_active: true, adherence: { taken: 22, scheduled: 30 } },
    { id: "2", name: "Folic Acid", dosage: "5mg", frequency: "Every Day", category: "Supportive", prescribed_by: "Dr. Osei-Mensah", is_active: true, adherence: { taken: 28, scheduled: 30 } },
    { id: "3", name: "Ibuprofen", dosage: "400mg", frequency: "As Needed", category: "Pain management", prescribed_by: null, is_active: true, adherence: { taken: 6, scheduled: 6 } },
  ],
  aiInsights: [
    {
      metric: "Pain",
      headline: "Your average pain has been moderate — cold weather is your most common trigger",
      detail: "Over the past 30 days you averaged 3.4/10 pain. Cold weather appeared in 9 of your logged episodes. For HbSS patients, vasoconstriction from cold is a well-known crisis trigger. Try layering up when temperatures drop and pre-warm joints before any outdoor activity.",
      tone: "warning",
    },
    {
      metric: "Hydroxyurea",
      headline: "You missed 8 Hydroxyurea doses this month — this may reduce its effectiveness",
      detail: "Hydroxyurea needs consistent daily dosing to reduce sickling events. Missing doses over consecutive days can reduce red blood cell protection. Consider setting a daily alarm or using the in-app reminder.",
      tone: "danger",
    },
    {
      metric: "Hydration",
      headline: "Hydration is below target on your high-pain days — there's a clear pattern here",
      detail: "On your 5 highest-pain days, average hydration was 4/10 versus 7.5/10 on low-pain days. Dehydration is one of the most controllable sickle cell crisis triggers. Aim for at least 8–10 cups daily.",
      tone: "warning",
    },
    {
      metric: "Sleep",
      headline: "Sleep is consistent at 7.2 hours — a positive foundation for crisis prevention",
      detail: "Good sleep supports immune function and pain tolerance. Keep this up — poor sleep is closely linked to elevated pain perception in SCD patients.",
      tone: "success",
    },
  ],
};

export default function SummaryTestPage() {
  return <SummaryView data={DUMMY} testMode />;
}

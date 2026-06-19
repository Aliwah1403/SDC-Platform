import EmergencyCardView, { type EDCardData } from "./_EmergencyCardView";

const DUMMY: EDCardData = {
  generatedAt: new Date().toISOString(),
  patient: {
    name: "Amara Johnson",
    dob: "1995-08-14",
    scd_type: "HbSS",
    blood_type: "O+",
    allergies: ["Penicillin", "NSAIDs", "Aspirin"],
    preferred_hospital: "King's College Hospital, London",
    weight_kg: 62,
  },
  painPlan: {
    baseline_pain: 3,
    effective_medications: [
      { name: "Morphine", dosage: "0.1 mg/kg IV", notes: "First-line" },
      { name: "Oxycodone", dosage: "5–10 mg oral", notes: "Mild–moderate" },
      { name: "Paracetamol", dosage: "1g IV/oral", notes: "Adjunct" },
    ],
    medications_to_avoid: ["NSAIDs", "Aspirin", "Pethidine"],
    individualized_notes:
      "Pain typically starts in lower back and legs. IV fluids (0.9% NaCl) alongside analgesia significantly reduces my crisis duration. I usually need analgesia within 30 minutes of arrival or pain escalates rapidly.",
  },
  medications: [
    {
      id: "1",
      name: "Hydroxyurea",
      dosage: "500 mg",
      frequency: "Once daily",
      category: "Disease-modifying",
      prescribed_by: "Dr. Osei-Mensah",
    },
    {
      id: "2",
      name: "Folic Acid",
      dosage: "5 mg",
      frequency: "Once daily",
      category: "Supportive",
      prescribed_by: "Dr. Osei-Mensah",
    },
    {
      id: "3",
      name: "Penicillin V",
      dosage: "250 mg",
      frequency: "Twice daily",
      category: "Preventive",
      prescribed_by: "Dr. Osei-Mensah",
    },
  ],
  contacts: [
    {
      id: "1",
      name: "Dr. Kwame Osei-Mensah",
      relationship: "Haematologist",
      phone: "+44 20 3299 1234",
    },
    {
      id: "2",
      name: "Grace Johnson",
      relationship: "Mother",
      phone: "+44 7700 900123",
    },
    {
      id: "3",
      name: "David Johnson",
      relationship: "Brother",
      phone: "+44 7700 900456",
    },
  ],
  recentCrises: [
    { date: "2026-06-02", duration_hours: 18, peak_pain: 9 },
    { date: "2026-04-15", duration_hours: 12, peak_pain: 8 },
    { date: "2026-02-28", duration_hours: 24, peak_pain: 10 },
  ],
  stats: {
    crisesLast6Months: 3,
    lastCrisisDate: "2026-06-02",
    avgPainLast30Days: 3.4,
  },
};

export default function EmergencyCardTestPage() {
  return <EmergencyCardView data={DUMMY} />;
}

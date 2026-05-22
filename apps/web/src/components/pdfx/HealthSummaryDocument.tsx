import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PdfxThemeProvider } from "../../lib/pdfx-theme-context";
import { theme } from "../../lib/pdfx-theme";
import { KeyValue } from "./key-value/pdfx-key-value";
import { PdfAlert } from "./alert/pdfx-alert";
import { PageFooter } from "./page-footer/pdfx-page-footer";

interface Medication {
  id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  category?: string | null;
  prescribed_by?: string | null;
  is_active?: boolean;
  adherence?: { taken: number; scheduled: number } | null;
}

interface Profile {
  full_name?: string;
  nickname?: string;
  dob?: string;
  scd_type?: string;
  height?: number;
  weight?: number;
  preferred_hospital?: string;
  blood_type?: string;
  allergies?: string[];
}

interface StreakInfo {
  current: number;
  longest: number;
  badgesEarned: number;
}

interface Stats {
  totalDaysLogged: number;
  avgPain?: number | null;
  avgHydration?: number | null;
  avgMood?: number | null;
  avgSleep?: number | null;
  avgSteps?: number | null;
  avgHeartRate?: number | null;
}

interface TopItem {
  name: string;
  count: number;
}

interface AiInsight {
  metric: string;
  headline: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "info";
}

export interface HealthSummaryData {
  generatedAt: string;
  dateRange: { start: string; end: string };
  periodDays: number;
  profile: Profile;
  streak: StreakInfo;
  stats: Stats;
  topSymptoms: TopItem[];
  topTriggers: TopItem[];
  medications: Medication[];
  aiInsights?: AiInsight[];
}

const BURGUNDY = "#A9334D";
const CREAM = "#F8E9E7";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const BORDER = "#F0E4E1";
const BG = "#F8F4F0";
const ORANGE = "#F0531C";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingRight: 48,
    paddingBottom: 72,
    paddingLeft: 48,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  headerBand: {
    backgroundColor: BURGUNDY,
    marginHorizontal: -48,
    marginTop: -56,
    paddingHorizontal: 48,
    paddingTop: 32,
    paddingBottom: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: CREAM,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#D09F9A",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 8,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  statCard: {
    width: "22%",
    backgroundColor: BG,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BURGUNDY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: MUTED,
    fontFamily: "Helvetica",
  },
  trendUp: { color: "#EF4444" },
  trendDown: { color: "#10B981" },
  pill: {
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
  },
  pillText: {
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica",
  },
  medRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    alignItems: "flex-start",
  },
  medDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BURGUNDY,
    marginTop: 2,
    marginRight: 8,
  },
  medName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  medDetail: {
    fontSize: 9,
    color: MUTED,
    fontFamily: "Helvetica",
    marginTop: 2,
  },
  adherenceRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 0,
  },
  adherenceBar: {
    height: 4,
    borderRadius: 2,
  },
});

function fmt(date?: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={[styles.statLabel, { marginTop: 2, color: "#A9334D" }]}>{sub}</Text> : null}
    </View>
  );
}

function adherenceColor(pct: number): string {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#F59E0B";
  return "#EF4444";
}

export function HealthSummaryDocument({ data }: { data: HealthSummaryData }) {
  const { profile, streak, stats, topSymptoms, topTriggers, medications, aiInsights, dateRange, periodDays } = data;
  const name = profile.full_name || profile.nickname || "Patient";
  const period = `Last ${periodDays} days`;

  return (
    <PdfxThemeProvider theme={theme}>
      <Document title={`Hemo Health Summary — ${name}`} author="Hemo" creator="Hemo">
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.headerBand}>
            <Text style={styles.headerTitle}>{period} Health Summary</Text>
            <Text style={styles.headerSub}>
              {name} · {fmt(dateRange.start)} – {fmt(dateRange.end)} · Generated {fmt(data.generatedAt)}
            </Text>
          </View>

          {/* Profile snapshot */}
          <KeyValue
            items={[
              { key: "Name", value: name },
              { key: "SCD Type", value: profile.scd_type ?? "—" },
              { key: "Preferred Hospital", value: profile.preferred_hospital ?? "—" },
            ]}
            divided
            labelColor="mutedForeground"
            style={{ marginBottom: 4 }}
          />

          {/* Stats */}
          <Text style={styles.sectionTitle}>Period Metrics</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Days Logged" value={String(stats.totalDaysLogged)} sub={`of ${periodDays}`} />
            <StatCard label="Avg Pain" value={stats.avgPain != null ? `${stats.avgPain}/10` : "—"} />
            <StatCard label="Avg Hydration" value={stats.avgHydration != null ? `${stats.avgHydration}/10` : "—"} />
            <StatCard label="Avg Mood" value={stats.avgMood != null ? `${stats.avgMood}/5` : "—"} />
            <StatCard label="Avg Sleep" value={stats.avgSleep != null ? `${stats.avgSleep}h` : "—"} />
            <StatCard label="Avg Steps" value={stats.avgSteps != null ? String(Math.round(stats.avgSteps)) : "—"} />
            <StatCard label="Avg Heart Rate" value={stats.avgHeartRate != null ? `${stats.avgHeartRate} bpm` : "—"} />
            <StatCard label="Current Streak" value={String(streak.current)} sub={`Best: ${streak.longest}`} />
          </View>

          {/* AI Insights */}
          {aiInsights && aiInsights.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>AI Health Insights</Text>
              {aiInsights.map((insight, i) => (
                <PdfAlert
                  key={i}
                  tone={insight.tone}
                  title={insight.headline}
                  description={insight.detail}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </>
          )}

          {/* Top Symptoms & Triggers */}
          {topSymptoms.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top Symptoms This Period</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {topSymptoms.map((s) => (
                  <View key={s.name} style={styles.pill}>
                    <Text style={styles.pillText}>{s.name} ({s.count}×)</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          {topTriggers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top Triggers This Period</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {topTriggers.map((t) => (
                  <View key={t.name} style={styles.pill}>
                    <Text style={styles.pillText}>{t.name} ({t.count}×)</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Medications */}
          {medications.filter((m) => m.is_active).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active Medications</Text>
              {medications.filter((m) => m.is_active).map((med) => {
                const adherencePct = med.adherence && med.adherence.scheduled > 0
                  ? Math.round((med.adherence.taken / med.adherence.scheduled) * 100)
                  : null;
                return (
                  <View key={med.id} style={styles.medRow} wrap={false}>
                    <View style={styles.medDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetail}>
                        {[med.dosage, med.frequency, med.category].filter(Boolean).join(" · ")}
                        {med.prescribed_by ? ` · ${med.prescribed_by}` : ""}
                      </Text>
                      {adherencePct != null && (
                        <View>
                          <Text style={[styles.medDetail, { marginTop: 3 }]}>
                            Adherence: {med.adherence!.taken}/{med.adherence!.scheduled} doses ({adherencePct}%)
                          </Text>
                          <View style={styles.adherenceRow}>
                            <View style={[styles.adherenceBar, { flex: adherencePct, backgroundColor: adherenceColor(adherencePct) }]} />
                            <View style={[styles.adherenceBar, { flex: 100 - adherencePct, backgroundColor: "#E5E7EB" }]} />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <PageFooter
            leftText="Hemo · Health Summary"
            rightText={`Generated ${fmt(data.generatedAt)}`}
                      />
        </Page>
      </Document>
    </PdfxThemeProvider>
  );
}

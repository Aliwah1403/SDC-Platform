import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PdfxThemeProvider } from "../../lib/pdfx-theme-context";
import { theme } from "../../lib/pdfx-theme";
import { KeyValue } from "./key-value/pdfx-key-value";
import { PageFooter } from "./page-footer/pdfx-page-footer";

interface HealthLog {
  date: string;
  pain_level?: number | null;
  body_locations?: string[];
  symptoms?: string[];
  mood?: number | null;
  hydration?: number | null;
  triggers?: string[];
  activities?: string[];
  notes?: string | null;
  is_repaired?: boolean;
}

interface DailySummary {
  date: string;
  pain_level?: number | null;
  hydration?: number | null;
  mood?: number | null;
  steps?: number | null;
  sleep_hours?: number | null;
  heart_rate?: number | null;
}

interface Medication {
  id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  type?: string | null;
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
  lastLogDate?: string | null;
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

export interface FullExportData {
  generatedAt: string;
  dateRange: { start: string; end: string };
  profile: Profile;
  streak: StreakInfo;
  stats: Stats;
  topSymptoms: TopItem[];
  topTriggers: TopItem[];
  medications: Medication[];
  healthLogs: HealthLog[];
  dailySummaries: DailySummary[];
}

const BURGUNDY = "#A9334D";
const CREAM = "#F8E9E7";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const BORDER = "#F0E4E1";
const BG = "#F8F4F0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingRight: 48,
    paddingBottom: 72,
    paddingLeft: 48,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  // Header band
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
  // Stat card row
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BURGUNDY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: MUTED,
    fontFamily: "Helvetica",
  },
  // Section header
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 8,
    marginTop: 16,
  },
  // Activity grid
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginBottom: 4,
  },
  gridCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  // Log row
  logRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  logDate: {
    width: 70,
    fontSize: 9,
    color: MUTED,
    fontFamily: "Helvetica",
  },
  logCell: {
    flex: 1,
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica",
  },
  logHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
  },
  // Med row
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
  adherenceBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  pill: {
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
  },
  pillText: {
    fontSize: 8,
    color: INK,
    fontFamily: "Helvetica",
  },
});

function painColor(level?: number | null): string {
  if (level == null) return "#E5E7EB";
  if (level <= 2) return "#10B981";
  if (level <= 4) return "#84CC16";
  if (level <= 6) return "#FDE047";
  if (level <= 8) return "#F59E0B";
  return "#EF4444";
}

function fmt(date?: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function FullExportDocument({ data }: { data: FullExportData }) {
  const { profile, streak, stats, topSymptoms, topTriggers, medications, healthLogs, dailySummaries, dateRange } = data;
  const name = profile.full_name || profile.nickname || "Patient";
  const period = `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;

  const logsMap: Record<string, HealthLog> = {};
  for (const l of healthLogs) logsMap[l.date] = l;

  const summaryMap: Record<string, DailySummary> = {};
  for (const s of dailySummaries) summaryMap[s.date] = s;

  // Build sorted date list spanning the range
  const allDates: string[] = [];
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    allDates.push(d.toISOString().split("T")[0]);
  }

  // Grid rows of 26 per row
  const COLS = 26;
  const gridRows: string[][] = [];
  for (let i = 0; i < allDates.length; i += COLS) {
    gridRows.push(allDates.slice(i, i + COLS));
  }

  return (
    <PdfxThemeProvider theme={theme}>
      <Document title={`Hemo Health Export — ${name}`} author="Hemo" creator="Hemo">
        {/* ─── Page 1: Overview ─── */}
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.headerBand} fixed>
            <Text style={styles.headerTitle}>Health Export — {name}</Text>
            <Text style={styles.headerSub}>Period: {period} · Generated {fmt(data.generatedAt)}</Text>
          </View>

          {/* Profile */}
          <Text style={styles.sectionTitle}>Profile</Text>
          <KeyValue
            items={[
              { key: "Name", value: name },
              { key: "Date of Birth", value: fmt(profile.dob) },
              { key: "SCD Type", value: profile.scd_type ?? "—" },
              { key: "Blood Type", value: profile.blood_type ?? "—" },
              { key: "Height / Weight", value: profile.height ? `${profile.height} cm / ${profile.weight ?? "—"} kg` : "—" },
              { key: "Preferred Hospital", value: profile.preferred_hospital ?? "—" },
            ]}
            divided
            labelColor="mutedForeground"
          />

          {/* Stats row */}
          <Text style={styles.sectionTitle}>Period Snapshot</Text>
          <View style={styles.statsRow}>
            <StatCard label="Days Logged" value={String(stats.totalDaysLogged)} />
            <StatCard label="Avg Pain" value={stats.avgPain != null ? `${stats.avgPain}/10` : "—"} />
            <StatCard label="Avg Hydration" value={stats.avgHydration != null ? `${stats.avgHydration}/10` : "—"} />
            <StatCard label="Avg Mood" value={stats.avgMood != null ? `${stats.avgMood}/5` : "—"} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Avg Sleep" value={stats.avgSleep != null ? `${stats.avgSleep}h` : "—"} />
            <StatCard label="Avg Steps" value={stats.avgSteps != null ? String(Math.round(stats.avgSteps)) : "—"} />
            <StatCard label="Avg Heart Rate" value={stats.avgHeartRate != null ? `${stats.avgHeartRate} bpm` : "—"} />
            <StatCard label="Streak (Best)" value={String(streak.longest)} />
          </View>

          {/* Activity grid */}
          <Text style={styles.sectionTitle}>Logging Activity</Text>
          {gridRows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map((date) => {
                const logged = !!logsMap[date] || !!summaryMap[date];
                const pain = logsMap[date]?.pain_level ?? summaryMap[date]?.pain_level;
                return (
                  <View
                    key={date}
                    style={[styles.gridCell, { backgroundColor: logged ? painColor(pain) : "#E5E7EB" }]}
                  />
                );
              })}
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
            {[
              { color: "#10B981", label: "No/low pain" },
              { color: "#FDE047", label: "Moderate" },
              { color: "#EF4444", label: "High pain" },
              { color: "#E5E7EB", label: "Not logged" },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.color }} />
                <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica" }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Top symptoms + triggers */}
          {topSymptoms.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Most Reported Symptoms</Text>
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
              <Text style={styles.sectionTitle}>Most Reported Triggers</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {topTriggers.map((t) => (
                  <View key={t.name} style={styles.pill}>
                    <Text style={styles.pillText}>{t.name} ({t.count}×)</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <PageFooter
            leftText="Hemo · Health Export"
            rightText={`Generated ${fmt(data.generatedAt)}`}
                      />
        </Page>

        {/* ─── Page 2: Medications ─── */}
        {medications.length > 0 && (
          <Page size="A4" style={styles.page}>
            <View style={styles.headerBand}>
              <Text style={styles.headerTitle}>Medication List</Text>
              <Text style={styles.headerSub}>{name} · {period}</Text>
            </View>

            {medications.map((med) => {
              const adherencePct = med.adherence && med.adherence.scheduled > 0
                ? Math.round((med.adherence.taken / med.adherence.scheduled) * 100)
                : null;
              return (
                <View key={med.id} style={styles.medRow} wrap={false}>
                  <View style={[styles.medDot, { backgroundColor: med.is_active ? BURGUNDY : MUTED }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}{!med.is_active ? " (inactive)" : ""}</Text>
                    <Text style={styles.medDetail}>
                      {[med.dosage, med.frequency, med.category].filter(Boolean).join(" · ")}
                      {med.prescribed_by ? ` · Prescribed by ${med.prescribed_by}` : ""}
                    </Text>
                    {adherencePct != null && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica", marginBottom: 2 }}>
                          Adherence: {med.adherence!.taken}/{med.adherence!.scheduled} doses ({adherencePct}%)
                        </Text>
                        <View style={{ flexDirection: "row", gap: 0 }}>
                          <View style={[styles.adherenceBar, { flex: adherencePct, backgroundColor: adherencePct >= 80 ? "#10B981" : adherencePct >= 50 ? "#F59E0B" : "#EF4444" }]} />
                          <View style={[styles.adherenceBar, { flex: 100 - adherencePct, backgroundColor: "#E5E7EB" }]} />
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <PageFooter
              leftText="Hemo · Health Export"
              rightText={`Generated ${fmt(data.generatedAt)}`}
                          />
          </Page>
        )}

        {/* ─── Page 3+: Daily Logs ─── */}
        {healthLogs.length > 0 && (
          <Page size="A4" style={styles.page}>
            <View style={styles.headerBand}>
              <Text style={styles.headerTitle}>Daily Health Logs</Text>
              <Text style={styles.headerSub}>{name} · {period}</Text>
            </View>

            {/* Table header */}
            <View style={[styles.logRow, { borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: "solid" }]}>
              <Text style={[styles.logDate, styles.logHeader]}>Date</Text>
              <Text style={[styles.logCell, styles.logHeader]}>Pain</Text>
              <Text style={[styles.logCell, styles.logHeader]}>Mood</Text>
              <Text style={[styles.logCell, styles.logHeader]}>Hydration</Text>
              <Text style={[{ flex: 2 }, styles.logHeader]}>Symptoms / Notes</Text>
            </View>

            {healthLogs.map((log) => (
              <View key={log.date} style={styles.logRow} wrap={false}>
                <Text style={styles.logDate}>{fmt(log.date)}{log.is_repaired ? " ✦" : ""}</Text>
                <Text style={[styles.logCell, { color: painColor(log.pain_level) }]}>
                  {log.pain_level != null ? `${log.pain_level}/10` : "—"}
                </Text>
                <Text style={styles.logCell}>{log.mood != null ? `${log.mood}/5` : "—"}</Text>
                <Text style={styles.logCell}>{log.hydration != null ? `${log.hydration}/10` : "—"}</Text>
                <Text style={[styles.logCell, { flex: 2 }]}>
                  {[...(log.symptoms ?? []), log.notes].filter(Boolean).join(", ") || "—"}
                </Text>
              </View>
            ))}

            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica" }}>✦ Repaired entry</Text>
            </View>

            <PageFooter
              leftText="Hemo · Health Export"
              rightText={`Generated ${fmt(data.generatedAt)}`}
                          />
          </Page>
        )}
      </Document>
    </PdfxThemeProvider>
  );
}

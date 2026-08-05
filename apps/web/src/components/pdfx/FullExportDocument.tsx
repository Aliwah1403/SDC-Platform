import { Document, Page, View, Text, Image, StyleSheet, Svg, Rect, Defs, LinearGradient, Stop } from "@react-pdf/renderer";
import { PdfxThemeProvider } from "../../lib/pdfx-theme-context";
import { theme } from "../../lib/pdfx-theme";
import { formatMl } from "../../lib/hydration";

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
  /** The user's own targets. `hydration` is canonical ml. Absent on tokens created before goals were captured. */
  goals?: { hydration?: number | null; sleep?: number | null; steps?: number | null };
  topSymptoms: TopItem[];
  topTriggers: TopItem[];
  medications: Medication[];
  healthLogs: HealthLog[];
  dailySummaries: DailySummary[];
}

const BURGUNDY = "#A9334D";
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
  masthead: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    marginBottom: 20,
  },
  mastheadCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    marginBottom: 20,
  },
  profileGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  profileCol: {
    flex: 1,
  },
  profileRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  profileRowDivided: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  profileKey: {
    flex: 1,
    fontSize: 9,
    color: MUTED,
    fontFamily: "Helvetica",
  },
  profileValue: {
    flex: 1,
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica",
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 3,
    borderTopColor: BURGUNDY,
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
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  gridCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  logTableHeader: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  logRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
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
  medRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
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

function GradientStrip() {
  return (
    <View style={{ height: 8, marginHorizontal: -48, marginTop: -56, marginBottom: 0 }}>
      <Svg width={595} height={8} viewBox="0 0 595 8">
        <Defs>
          <LinearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#D09F9A" />
            <Stop offset="50%" stopColor="#A9334D" />
            <Stop offset="100%" stopColor="#781D11" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={595} height={8} fill="url(#hg)" />
      </Svg>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 8 }}>
      <View style={{ width: 3, height: 14, backgroundColor: BURGUNDY, borderRadius: 2, marginRight: 8 }} />
      <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.8 }}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BrandMark() {
  const src = typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png";
  return <Image src={src} style={{ width: 36, height: 36 }} />;
}

function DocFooter({ generatedAt, label }: { generatedAt: string; label: string }) {
  return (
    <>
      <Text
        fixed
        style={{ position: "absolute", bottom: 28, left: 48, fontSize: 8, color: MUTED, fontFamily: "Helvetica" }}
        render={({ pageNumber, totalPages }) => `Hemo · ${label} · Page ${pageNumber} of ${totalPages}`}
      />
      <Text
        fixed
        style={{ position: "absolute", bottom: 28, right: 48, fontSize: 8, color: MUTED, fontFamily: "Helvetica", textAlign: "right" }}
      >
        {`Generated ${fmt(generatedAt)}`}
      </Text>
    </>
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

  const allDates: string[] = [];
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  // Cap heatmap to 365 days so the grid stays within a single page for long/all-time ranges
  const cappedStart = new Date(end);
  cappedStart.setUTCFullYear(cappedStart.getUTCFullYear() - 1);
  cappedStart.setUTCDate(cappedStart.getUTCDate() + 1);
  const heatmapStart = start > cappedStart ? start : cappedStart;
  for (let d = new Date(heatmapStart); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    allDates.push(d.toISOString().split("T")[0]);
  }

  const COLS = 26;
  const gridRows: string[][] = [];
  for (let i = 0; i < allDates.length; i += COLS) {
    gridRows.push(allDates.slice(i, i + COLS));
  }

  const profileLeft = [
    { key: "Full Name", value: name },
    { key: "Date of Birth", value: fmt(profile.dob) },
    { key: "SCD Type", value: profile.scd_type ?? "—" },
  ];
  const profileRight = [
    { key: "Blood Type", value: profile.blood_type ?? "—" },
    { key: "Height / Weight", value: profile.height ? `${profile.height} cm / ${profile.weight ?? "—"} kg` : "—" },
    { key: "Preferred Hospital", value: profile.preferred_hospital ?? "—" },
  ];

  return (
    <PdfxThemeProvider theme={theme}>
      <Document title={`Hemo Health Export — ${name}`} author="Hemo" creator="Hemo">

        {/* ── Page 1: Overview ── */}
        <Page size="A4" style={styles.page}>
          <GradientStrip />

          {/* Masthead */}
          <View style={styles.masthead}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: BURGUNDY, marginBottom: 6, letterSpacing: 1 }}>
                HEMO HEALTH EXPORT
              </Text>
              <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 4 }}>
                {name}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica", color: MUTED }}>
                {`Period: ${period} · Generated ${fmt(data.generatedAt)}`}
              </Text>
            </View>
            <BrandMark />
          </View>

          {/* Profile — 2-column */}
          <SectionHeader title="Profile" />
          <View style={styles.profileGrid}>
            <View style={styles.profileCol}>
              {profileLeft.map((item, i) => (
                <View key={item.key} style={[styles.profileRow, i < profileLeft.length - 1 ? styles.profileRowDivided : {}]}>
                  <Text style={styles.profileKey}>{item.key}</Text>
                  <Text style={styles.profileValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.profileCol}>
              {profileRight.map((item, i) => (
                <View key={item.key} style={[styles.profileRow, i < profileRight.length - 1 ? styles.profileRowDivided : {}]}>
                  <Text style={styles.profileKey}>{item.key}</Text>
                  <Text style={styles.profileValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Period Snapshot */}
          <SectionHeader title="Period Snapshot" />
          <View style={[styles.statsRow, { marginBottom: 0 }]}>
            <StatCard label="Days Logged" value={String(stats.totalDaysLogged)} />
            <StatCard label="Avg Pain" value={stats.avgPain != null ? `${stats.avgPain}/10` : "—"} />
            <StatCard label="Avg Fluid Intake" value={formatMl(stats.avgHydration)} />
            <StatCard label="Avg Mood" value={stats.avgMood != null ? `${stats.avgMood}/5` : "—"} />
            <StatCard label="Best Streak" value={String(streak.longest)} />
          </View>

          {/* Logging Activity heatmap */}
          <SectionHeader title="Logging Activity" />
          {gridRows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map((date) => {
                const logged = !!logsMap[date] || !!summaryMap[date];
                const pain = logsMap[date]?.pain_level ?? summaryMap[date]?.pain_level;
                return (
                  <View key={date} style={[styles.gridCell, { backgroundColor: logged ? painColor(pain) : "#E5E7EB" }]} />
                );
              })}
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 6, marginBottom: 4 }}>
            {[
              { color: "#10B981", label: "No/low pain" },
              { color: "#FDE047", label: "Moderate" },
              { color: "#EF4444", label: "High pain" },
              { color: "#E5E7EB", label: "Not logged" },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: item.color }} />
                <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica" }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Symptoms */}
          {topSymptoms.length > 0 && (
            <>
              <SectionHeader title="Most Reported Symptoms" />
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {topSymptoms.map((s) => (
                  <View key={s.name} style={styles.pill}>
                    <Text style={styles.pillText}>{s.name} ({s.count}×)</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Triggers */}
          {topTriggers.length > 0 && (
            <>
              <SectionHeader title="Most Reported Triggers" />
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {topTriggers.map((t) => (
                  <View key={t.name} style={styles.pill}>
                    <Text style={styles.pillText}>{t.name} ({t.count}×)</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <DocFooter generatedAt={data.generatedAt} label="Health Export" />
        </Page>

        {/* ── Page 2: Medications ── */}
        {medications.length > 0 && (
          <Page size="A4" style={styles.page}>
            <GradientStrip />

            <View style={styles.mastheadCompact}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: BURGUNDY, marginBottom: 4, letterSpacing: 1 }}>
                  HEMO HEALTH EXPORT
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2 }}>
                  Medication List
                </Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica", color: MUTED }}>
                  {`${name} · ${period}`}
                </Text>
              </View>
              <BrandMark />
            </View>

            {medications.map((med, medIndex) => {
              const adherencePct = med.adherence && med.adherence.scheduled > 0
                ? Math.min(100, Math.max(0, Math.round((med.adherence.taken / med.adherence.scheduled) * 100)))
                : null;
              return (
                <View
                  key={med.id}
                  style={[
                    styles.medRow,
                    {
                      borderLeftWidth: 3,
                      borderLeftColor: med.is_active ? BURGUNDY : MUTED,
                      borderLeftStyle: "solid",
                      backgroundColor: medIndex % 2 === 0 ? BG : "#ffffff",
                    },
                  ]}
                  wrap={false}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}{!med.is_active ? " (inactive)" : ""}</Text>
                    <Text style={styles.medDetail}>
                      {[med.dosage, med.frequency, med.category].filter(Boolean).join(" · ")}
                      {med.prescribed_by ? ` · Prescribed by ${med.prescribed_by}` : ""}
                    </Text>
                    {adherencePct != null && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica", marginBottom: 2 }}>
                          {`Adherence: ${med.adherence!.taken}/${med.adherence!.scheduled} doses (${adherencePct}%)`}
                        </Text>
                        <View style={{ flexDirection: "row" }}>
                          <View style={[styles.adherenceBar, { flex: adherencePct, backgroundColor: adherencePct >= 80 ? "#10B981" : adherencePct >= 50 ? "#F59E0B" : "#EF4444" }]} />
                          <View style={[styles.adherenceBar, { flex: 100 - adherencePct, backgroundColor: "#E5E7EB" }]} />
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <DocFooter generatedAt={data.generatedAt} label="Health Export" />
          </Page>
        )}

        {/* ── Page 3+: Daily Logs ── */}
        {healthLogs.length > 0 && (
          <Page size="A4" style={styles.page}>
            <GradientStrip />

            <View style={styles.mastheadCompact}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: BURGUNDY, marginBottom: 4, letterSpacing: 1 }}>
                  HEMO HEALTH EXPORT
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2 }}>
                  Daily Health Logs
                </Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica", color: MUTED }}>
                  {`${name} · ${period}`}
                </Text>
              </View>
              <BrandMark />
            </View>

            {/* Table header */}
            <View style={styles.logTableHeader}>
              <Text style={[{ width: 70 }, styles.logHeader]}>Date</Text>
              <Text style={[{ flex: 1 }, styles.logHeader]}>Pain</Text>
              <Text style={[{ flex: 1 }, styles.logHeader]}>Mood</Text>
              <Text style={[{ flex: 1 }, styles.logHeader]}>Hydration</Text>
              <Text style={[{ flex: 2 }, styles.logHeader]}>Symptoms / Notes</Text>
            </View>

            {healthLogs.map((log, logIndex) => (
              <View
                key={log.date}
                style={[styles.logRow, { backgroundColor: logIndex % 2 === 0 ? "#ffffff" : BG }]}
                wrap={false}
              >
                <Text style={styles.logDate}>{fmt(log.date)}{log.is_repaired ? " ✦" : ""}</Text>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: painColor(log.pain_level), marginRight: 4 }} />
                  <Text style={{ fontSize: 9, color: INK, fontFamily: "Helvetica" }}>
                    {log.pain_level != null ? `${log.pain_level}/10` : "—"}
                  </Text>
                </View>
                <Text style={styles.logCell}>{log.mood != null ? `${log.mood}/5` : "—"}</Text>
                <Text style={styles.logCell}>{formatMl(log.hydration)}</Text>
                <Text style={[styles.logCell, { flex: 2 }]}>
                  {[...(log.symptoms ?? []), log.notes].filter(Boolean).join(", ") || "—"}
                </Text>
              </View>
            ))}

            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica" }}>* Repaired entry</Text>
            </View>

            <DocFooter generatedAt={data.generatedAt} label="Health Export" />
          </Page>
        )}

      </Document>
    </PdfxThemeProvider>
  );
}

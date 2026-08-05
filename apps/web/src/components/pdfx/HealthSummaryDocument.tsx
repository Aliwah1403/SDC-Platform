import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";
import { PdfxThemeProvider } from "../../lib/pdfx-theme-context";
import { theme } from "../../lib/pdfx-theme";
import { formatMl } from "../../lib/hydration";
import { PdfAlert } from "./alert/pdfx-alert";

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
  /** Name of the window for recap shares ("June 2026"). Absent for the trailing presets. */
  periodLabel?: string;
  profile: Profile;
  streak: StreakInfo;
  stats: Stats;
  /** The user's own targets. `hydration` is canonical ml. Absent on tokens created before goals were captured. */
  goals?: { hydration?: number | null; sleep?: number | null; steps?: number | null };
  topSymptoms: TopItem[];
  topTriggers: TopItem[];
  medications: Medication[];
  patientNote?: string;
  aiInsights?: AiInsight[];
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  statCard: {
    width: "22%",
    backgroundColor: "#ffffff",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 3,
    borderTopColor: BURGUNDY,
    marginBottom: 8,
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
  statSub: {
    fontSize: 8,
    color: BURGUNDY,
    fontFamily: "Helvetica",
    marginTop: 2,
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
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica",
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
  },
});

function fmt(date?: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function adherenceColor(pct: number): string {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#F59E0B";
  return "#EF4444";
}

function GradientStrip() {
  return (
    <View
      style={{
        height: 8,
        marginHorizontal: -48,
        marginTop: -56,
        marginBottom: 0,
      }}
    >
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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 3,
          height: 14,
          backgroundColor: BURGUNDY,
          borderRadius: 2,
          marginRight: 8,
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontFamily: "Helvetica-Bold",
          color: INK,
          letterSpacing: 0.8,
        }}
      >
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function BrandMark() {
  const src =
    typeof window !== "undefined"
      ? `${window.location.origin}/logo.png`
      : "/logo.png";
  return <Image src={src} style={{ width: 36, height: 36 }} />;
}

function DocFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <>
      <Text
        fixed
        style={{
          position: "absolute",
          bottom: 28,
          left: 48,
          fontSize: 8,
          color: MUTED,
          fontFamily: "Helvetica",
        }}
        render={({ pageNumber, totalPages }) =>
          `Hemo · Health Summary · Page ${pageNumber} of ${totalPages}`
        }
      />
      <Text
        fixed
        style={{
          position: "absolute",
          bottom: 28,
          right: 48,
          fontSize: 8,
          color: MUTED,
          fontFamily: "Helvetica",
          textAlign: "right",
        }}
      >
        {`Generated ${fmt(generatedAt)}`}
      </Text>
    </>
  );
}

export function HealthSummaryDocument({ data }: { data: HealthSummaryData }) {
  const {
    profile,
    stats,
    topSymptoms,
    topTriggers,
    medications,
    aiInsights,
    dateRange,
    periodDays,
    periodLabel,
  } = data;
  const name = profile.full_name || profile.nickname || "Patient";
  const period = `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
  const activeMeds = medications.filter((m) => m.is_active);

  return (
    <PdfxThemeProvider theme={theme}>
      <Document
        title={`Hemo Health Summary — ${name}`}
        author="Hemo"
        creator="Hemo"
      >
        <Page size="A4" style={styles.page}>
          <GradientStrip />

          {/* Masthead */}
          <View style={styles.masthead}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 8,
                  fontFamily: "Helvetica-Bold",
                  color: BURGUNDY,
                  marginBottom: 6,
                  letterSpacing: 1,
                }}
              >
                HEMO HEALTH SUMMARY
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "Helvetica-Bold",
                  color: INK,
                  marginBottom: 4,
                }}
              >
                {periodLabel ?? `Last ${periodDays} Days`}
              </Text>
              <Text
                style={{ fontSize: 10, fontFamily: "Helvetica", color: MUTED }}
              >
                {`${name} · ${period} · Generated ${fmt(data.generatedAt)}`}
              </Text>
            </View>
            <BrandMark />
          </View>

          {/* Profile pills */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                borderRadius: 20,
                backgroundColor: BG,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: BORDER,
                borderStyle: "solid",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  color: INK,
                  fontFamily: "Helvetica-Bold",
                }}
              >
                {name}
              </Text>
            </View>
            {profile.scd_type && (
              <View
                style={{
                  borderRadius: 20,
                  backgroundColor: BG,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderStyle: "solid",
                }}
              >
                <Text
                  style={{ fontSize: 9, color: MUTED, fontFamily: "Helvetica" }}
                >
                  {profile.scd_type}
                </Text>
              </View>
            )}
            {profile.preferred_hospital && (
              <View
                style={{
                  borderRadius: 20,
                  backgroundColor: BG,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderStyle: "solid",
                }}
              >
                <Text
                  style={{ fontSize: 9, color: MUTED, fontFamily: "Helvetica" }}
                >
                  {profile.preferred_hospital}
                </Text>
              </View>
            )}
          </View>

          {/* Period Metrics */}
          <SectionHeader title="Period Metrics" />
          <View style={styles.statsGrid}>
            <StatCard
              label="Days Logged"
              value={String(stats.totalDaysLogged)}
              sub={`of ${periodDays}`}
            />
            <StatCard
              label="Avg Pain"
              value={stats.avgPain != null ? `${stats.avgPain}/10` : "—"}
            />
            <StatCard
              label="Avg Fluid Intake"
              value={formatMl(stats.avgHydration)}
            />
            <StatCard
              label="Avg Mood"
              value={stats.avgMood != null ? `${stats.avgMood}/10` : "—"}
            />
            {(() => {
              const activeMeds = medications.filter((m) => m.is_active && m.adherence);
              if (activeMeds.length === 0) return null;
              const taken = activeMeds.reduce((s, m) => s + (m.adherence?.taken ?? 0), 0);
              const scheduled = activeMeds.reduce((s, m) => s + (m.adherence?.scheduled ?? 0), 0);
              if (scheduled === 0) return null;
              const pct = Math.round((taken / scheduled) * 100);
              return (
                <StatCard
                  label="Med Adherence"
                  value={`${pct}%`}
                  sub={`${activeMeds.length} active med${activeMeds.length !== 1 ? "s" : ""}`}
                />
              );
            })()}
          </View>

          {/* AI Insights */}
          {aiInsights && aiInsights.length > 0 && (
            <>
              <SectionHeader title="Health Insights" />
              {aiInsights.map((insight, i) => (
                <PdfAlert
                  key={i}
                  variant={insight.tone === "danger" ? "error" : insight.tone}
                  title={insight.headline}
                  style={{ marginBottom: 8 }}
                >
                  {insight.detail}
                </PdfAlert>
              ))}
            </>
          )}

          {/* Top Symptoms */}
          {topSymptoms.length > 0 && (
            <>
              <SectionHeader title="Top Symptoms This Period" />
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {topSymptoms.map((s) => (
                  <View key={s.name} style={styles.pill}>
                    <Text style={styles.pillText}>
                      {s.name} ({s.count}×)
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Top Triggers */}
          {topTriggers.length > 0 && (
            <>
              <SectionHeader title="Top Triggers This Period" />
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {topTriggers.map((t) => (
                  <View key={t.name} style={styles.pill}>
                    <Text style={styles.pillText}>
                      {t.name} ({t.count}×)
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Active Medications */}
          {activeMeds.length > 0 && (
            <>
              <SectionHeader title="Active Medications" />
              {activeMeds.map((med, medIndex) => {
                const adherencePct =
                  med.adherence && med.adherence.scheduled > 0
                    ? Math.round(
                        (med.adherence.taken / med.adherence.scheduled) * 100,
                      )
                    : null;
                return (
                  <View
                    key={med.id}
                    style={[
                      styles.medRow,
                      {
                        borderLeftWidth: 3,
                        borderLeftColor: BURGUNDY,
                        borderLeftStyle: "solid",
                        backgroundColor: medIndex % 2 === 0 ? BG : "#ffffff",
                      },
                    ]}
                    wrap={false}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetail}>
                        {[med.dosage, med.frequency, med.category]
                          .filter(Boolean)
                          .join(" · ")}
                        {med.prescribed_by ? ` · ${med.prescribed_by}` : ""}
                      </Text>
                      {adherencePct != null && (
                        <View style={{ marginTop: 3 }}>
                          <Text
                            style={[
                              styles.medDetail,
                              { marginTop: 0, marginBottom: 2 },
                            ]}
                          >
                            {`Adherence: ${med.adherence!.taken}/${med.adherence!.scheduled} doses (${adherencePct}%)`}
                          </Text>
                          <View style={{ flexDirection: "row" }}>
                            <View
                              style={[
                                styles.adherenceBar,
                                {
                                  flex: adherencePct,
                                  backgroundColor: adherenceColor(adherencePct),
                                },
                              ]}
                            />
                            <View
                              style={[
                                styles.adherenceBar,
                                {
                                  flex: 100 - adherencePct,
                                  backgroundColor: "#E5E7EB",
                                },
                              ]}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <DocFooter generatedAt={data.generatedAt} />
        </Page>
      </Document>
    </PdfxThemeProvider>
  );
}

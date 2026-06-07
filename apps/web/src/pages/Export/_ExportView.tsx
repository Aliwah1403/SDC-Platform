import { Lock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FullExportDocument,
  type FullExportData,
} from "@/components/pdfx/FullExportDocument";
import {
  ageFromDob,
  displayName,
  formatRange,
  formatGeneratedAt,
  formatDayLong,
  painColor,
} from "./_exportUtils";
import { ChartCard21 } from "@/components/chart-card21";
import { ExportPainChart } from "./_ExportPainChart";
import { ExportHeatmap } from "./_ExportHeatmap";
import { PageNav, PageFooter } from "../_PageShells";

// ── Masthead ─────────────────────────────────────────────────────────────────

function Masthead({ data }: { data: FullExportData }) {
  const name = displayName(data.profile.full_name || "Patient", "partial");
  const age = ageFromDob(data.profile.dob);

  return (
    <header
      className="relative overflow-hidden py-16 text-white"
      style={{
        background:
          "linear-gradient(135deg, #D09F9A 0%, #A9334D 45%, #781D11 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-[400px] rounded-full opacity-20 blur-3xl"
        style={{ background: "#D09F9A" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 size-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: "#781D11" }}
      />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* Name */}
        <h1
          className="font-bold leading-tight tracking-tight text-white"
          style={{ fontSize: "clamp(36px, 6vw, 60px)" }}
        >
          {name}'s health, at a glance
        </h1>

        {/* Chips */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-[13px] font-medium backdrop-blur-sm">
            <Calendar className="size-3.5 opacity-80" />
            {formatRange(data.dateRange.start, data.dateRange.end)}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/70">
          {age != null && (
            <>
              <span className="font-semibold text-white/90">Age {age}</span>
              <span className="text-white/40">·</span>
            </>
          )}
          {data.profile.scd_type && (
            <>
              <span>
                <span className="text-white/60">SCD type:</span>{" "}
                <span className="font-semibold text-white/90">
                  {data.profile.scd_type}
                </span>
              </span>
              <span className="text-white/40">·</span>
            </>
          )}
          <span>Tracking with Hemo for {data.streak.longest}+ days</span>
        </div>
      </div>
    </header>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ data }: { data: FullExportData }) {
  const { stats, healthLogs, topTriggers } = data;
  if (!healthLogs.length) return null;

  const worstDay = healthLogs.reduce(
    (a, b) => ((b.pain_level ?? 0) > (a.pain_level ?? 0) ? b : a),
    healthLogs[0],
  );
  const recent = healthLogs.slice(-7);
  const recentAvg =
    recent.reduce((s, l) => s + (l.pain_level ?? 0), 0) / recent.length;
  const recovering = recentAvg < (worstDay.pain_level ?? 0) - 2;

  return (
    <div className="relative z-10 mx-auto -mt-9 max-w-5xl px-6">
      <div className="rounded-2xl border border-[#F0E4E1] bg-white px-7 py-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#A9334D]">
          In a sentence
        </div>
        <p className="text-[15px] leading-relaxed text-[#1A1A1A]">
          {stats.totalDaysLogged} days logged over 30, with average pain{" "}
          <em className="font-semibold not-italic text-[#A9334D]">
            {stats.avgPain != null ? stats.avgPain.toFixed(1) : "—"}/10
          </em>
          . One harder stretch around{" "}
          <em className="font-semibold not-italic text-[#A9334D]">
            {formatDayLong(worstDay.date)}
          </em>{" "}
          (pain {worstDay.pain_level}/10)
          {recovering ? (
            <>
              , but the past week has been{" "}
              <span className="font-semibold text-[#10B981]">
                calmer ({recentAvg.toFixed(1)}/10)
              </span>
            </>
          ) : null}
          .
          {topTriggers.length > 0 && (
            <>
              {" "}
              Top trigger:{" "}
              <em className="font-semibold not-italic">
                {topTriggers[0].name.toLowerCase()}
              </em>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#A9334D]">
            {eyebrow}
          </div>
          <h2 className="text-[22px] font-bold leading-tight tracking-tight text-[#1A1A1A]">
            {title}
          </h2>
        </div>
        {aside && <div className="text-[13px] text-[#1A1A1A]/50">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#F0E4E1] bg-white p-7 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

// ── At a glance ───────────────────────────────────────────────────────────────

function AtGlance({ data }: { data: FullExportData }) {
  const { stats, streak, healthLogs } = data;
  const goodDays = healthLogs.filter((l) => (l.pain_level ?? 11) <= 2).length;

  const items: { label: string; value: string; unit?: string; foot?: string; footGood?: boolean; footWarn?: boolean }[] = [
    {
      label: "Days logged",
      value: String(stats.totalDaysLogged),
      foot: `of 30 (${Math.round((stats.totalDaysLogged / 30) * 100)}%)`,
    },
    {
      label: "Avg pain",
      value: stats.avgPain != null ? stats.avgPain.toFixed(1) : "—",
      unit: "/10",
      foot: "trending lower",
      footGood: true,
    },
    {
      label: "Avg hydration",
      value: stats.avgHydration != null ? stats.avgHydration.toFixed(1) : "—",
      unit: "/10",
      foot: stats.avgHydration != null && stats.avgHydration < 8 ? "below goal of 8" : undefined,
      footWarn: stats.avgHydration != null && stats.avgHydration < 8,
    },
    {
      label: "Good days",
      value: String(goodDays),
      foot: "pain ≤ 2/10",
    },
    {
      label: "Streak",
      value: String(streak.current),
      unit: " days",
      foot: `longest: ${streak.longest}`,
    },
  ];

  return (
    <Section eyebrow="At a glance" title="The last 30 days, by the numbers">
      {/* Border-gap divider technique */}
      <div className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-2xl border border-[#F0E4E1] bg-[#F0E4E1] sm:grid-cols-5">
        {items.map((s) => (
          <div key={s.label} className="bg-[#F8F4F0] px-6 py-7">
            <div className="mb-0.5 text-[12px] font-medium text-[#1A1A1A]/55 whitespace-nowrap">
              {s.label}
            </div>
            <div className="text-[28px] font-bold leading-none tracking-tight text-[#1A1A1A]">
              {s.value}
              {s.unit && (
                <span className="text-[16px] font-medium text-[#1A1A1A]/40">
                  {s.unit}
                </span>
              )}
            </div>
            <div
              className={`mt-1.5 text-[11px] font-medium ${
                s.footGood
                  ? "text-[#10B981]"
                  : s.footWarn
                    ? "text-[#F59E0B]"
                    : "text-[#1A1A1A]/45"
              }`}
            >
              {s.foot}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Pain chart ────────────────────────────────────────────────────────────────

function PainChartSection({ data }: { data: FullExportData }) {
  return (
    <Section
      eyebrow="Pain over time"
      title="How the month went"
      aside={
        <div className="flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ background: "#A9334D" }}
            />
            Pain
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ background: "rgba(220,38,38,0.18)" }}
            />
            Crisis zone (7+)
          </span>
        </div>
      }
    >
      <Card className="px-6 pb-5 pt-7">
        <ExportPainChart
          logs={data.healthLogs}
          startISO={data.dateRange.start}
          endISO={data.dateRange.end}
        />
      </Card>
    </Section>
  );
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function HeatmapSection({ data }: { data: FullExportData }) {
  return (
    <Section
      eyebrow="Day by day"
      title="A pain calendar"
      aside="Cells colored by reported pain. Hover for details."
    >
      <Card>
        <ExportHeatmap
          logs={data.healthLogs}
          startISO={data.dateRange.start}
          endISO={data.dateRange.end}
        />
      </Card>
    </Section>
  );
}

// ── Symptoms & triggers ───────────────────────────────────────────────────────

function SymptomsTriggers({ data }: { data: FullExportData }) {
  const { topSymptoms, topTriggers } = data;

  return (
    <Section eyebrow="Patterns" title="What came up, and what set it off">
      <div className="grid gap-4 sm:grid-cols-2">
        <ChartCard21
          title="Top symptoms"
          description="Most reported this period"
          data={topSymptoms.map((s) => ({
            label: s.name,
            value: s.count,
            color: "#A9334D",
          }))}
          className="rounded-[20px] border-[#F0E4E1] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
        />
        <ChartCard21
          title="Top triggers"
          description="Most suspected this period"
          data={topTriggers.map((t) => ({
            label: t.name,
            value: t.count,
            color: "#781D11",
          }))}
          className="rounded-[20px] border-[#F0E4E1] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
        />
      </div>
    </Section>
  );
}

// ── Medications ───────────────────────────────────────────────────────────────

function Medications({ data }: { data: FullExportData }) {
  const active = data.medications.filter((m) => m.is_active !== false);
  const inactive = data.medications.filter((m) => m.is_active === false);

  return (
    <Section
      eyebrow="Medications"
      title="Current regimen & adherence"
      aside={`${active.length} active · ${inactive.length} discontinued`}
    >
      <div className="space-y-3">
        {[...active, ...inactive].map((med) => {
          const pct =
            med.adherence && med.adherence.scheduled > 0
              ? Math.round(
                  (med.adherence.taken / med.adherence.scheduled) * 100,
                )
              : null;
          const isInactive = med.is_active === false;

          return (
            <div
              key={med.id}
              className={`flex items-center gap-5 rounded-2xl border border-[#F0E4E1] bg-white px-6 py-5 ${
                isInactive ? "opacity-60" : ""
              }`}
            >
              {/* Pill icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F8F4F0]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#A9334D"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.5 20.5a7 7 0 1 1 10-10l-10 10z" />
                  <path d="M8.5 8.5l7 7" />
                </svg>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[15px] font-semibold text-[#1A1A1A] ${
                      isInactive ? "line-through" : ""
                    }`}
                  >
                    {med.name}
                  </span>
                  {med.dosage && (
                    <span className="text-[13px] text-[#1A1A1A]/50">
                      · {med.dosage}
                    </span>
                  )}
                  {med.category && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-auto border-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        med.category === "Disease-modifying"
                          ? "bg-[#A9334D]/[0.08] text-[#A9334D]"
                          : med.category === "Pain management"
                            ? "bg-[#F0531C]/10 text-[#F0531C]"
                            : "bg-[#1A1414]/[0.07] text-[#1A1414]/65",
                      )}
                    >
                      {med.category}
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] text-[#1A1A1A]/50">
                  {[
                    med.frequency,
                    med.prescribed_by
                      ? `Prescribed by ${med.prescribed_by}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>

              {/* Adherence ring */}
              {pct != null ? (
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <div
                    className="flex size-12 items-center justify-center rounded-full text-[13px] font-bold text-[#A9334D]"
                    style={{
                      background: `conic-gradient(#A9334D ${pct * 3.6}deg, #F0E4E1 0deg)`,
                    }}
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#A9334D]">
                      {pct}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[#1A1A1A]/40">
                    {med.adherence!.taken}/{med.adherence!.scheduled}
                  </span>
                </div>
              ) : (
                <span className="shrink-0 text-[12px] font-medium text-[#1A1A1A]/40">
                  {isInactive ? "Discontinued" : "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ── Notable days ──────────────────────────────────────────────────────────────

function NotableDays({ data }: { data: FullExportData }) {
  const notable = data.healthLogs.filter(
    (l) => l.notes || (l.pain_level ?? 0) >= 5,
  );

  const dotColor = (p?: number | null) => {
    if (p == null) return "#D1D5DB";
    if (p >= 7) return "#DC2626";
    if (p >= 5) return "#F59E0B";
    if (p <= 2) return "#10B981";
    return "#D1D5DB";
  };

  return (
    <Section
      eyebrow="In their own words"
      title="Notable days"
      aside={`${notable.length} of ${data.healthLogs.length} entries`}
    >
      <Card className="px-6 py-5">
        <div className="space-y-0">
          {notable.map((l, idx) => (
            <div key={l.date} className="relative flex gap-5 pb-6 last:pb-0">
              {/* Vertical line */}
              {idx < notable.length - 1 && (
                <div className="absolute left-[9px] top-5 h-full w-px bg-[#F0E4E1]" />
              )}

              {/* Dot */}
              <div
                className="relative mt-1 size-[18px] shrink-0 rounded-full border-2 border-white shadow-[0_0_0_2px_var(--dot-ring)]"
                style={
                  {
                    background: dotColor(l.pain_level),
                    "--dot-ring": dotColor(l.pain_level) + "33",
                  } as React.CSSProperties
                }
              />

              <div className="min-w-0 flex-1 pt-0.5">
                {/* Date */}
                <div className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/50">
                  {formatDayLong(l.date)}
                </div>

                {/* Note */}
                {l.notes ? (
                  <p className="mb-2.5 text-[14px] leading-relaxed text-[#1A1A1A]">
                    "{l.notes}"
                  </p>
                ) : (
                  <p className="mb-2.5 text-[14px] italic text-[#1A1A1A]/45">
                    No note — pain {l.pain_level}/10
                  </p>
                )}

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {l.pain_level != null && (
                    <Badge
                      variant="outline"
                      className="border-transparent"
                      style={{
                        background: painColor(l.pain_level) + "33",
                        color: "#781D11",
                      }}
                    >
                      Pain {l.pain_level}/10
                    </Badge>
                  )}
                  {l.hydration != null && (
                    <Badge
                      variant="outline"
                      className="border-transparent"
                      style={{ background: "#D09F9A22", color: "#781D11" }}
                    >
                      Hydration {l.hydration}/10
                    </Badge>
                  )}
                  {(l.symptoms ?? []).map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="border-transparent bg-[#F0E4E1] text-[#1A1414]"
                    >
                      {s}
                    </Badge>
                  ))}
                  {(l.triggers ?? []).map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="border-transparent"
                      style={{ background: "#F0531C1A", color: "#F0531C" }}
                    >
                      {t}
                    </Badge>
                  ))}
                  {l.is_repaired && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-[#1A1414]/[0.07] text-[#1A1414]"
                    >
                      Logged later
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

function ProfileSection({ data }: { data: FullExportData }) {
  const p = data.profile;

  const facts = [
    { label: "SCD type", value: p.scd_type },
    { label: "Blood type", value: p.blood_type, sensitive: true },
    {
      label: "Hospital",
      value: p.preferred_hospital,
      sensitive: true,
      small: true,
    },
    {
      label: "Allergies",
      value: p.allergies?.length ? p.allergies.join(", ") : "None",
      small: true,
    },
    { label: "Height", value: p.height != null ? `${p.height} cm` : null },
    { label: "Weight", value: p.weight != null ? `${p.weight} kg` : null },
  ];

  return (
    <Section eyebrow="About" title="A few facts">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[#F0E4E1] bg-[#F0E4E1] max-sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.label} className="bg-[#F8F4F0] px-5 py-5">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[1px] text-[#1A1A1A]/45">
              {f.label}
            </div>
            {f.value != null ? (
              <div
                className={`font-semibold text-[#1A1A1A] ${
                  f.small ? "text-[14px]" : "text-[18px]"
                }`}
              >
                {f.value}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[13px] text-[#1A1A1A]/35">
                <Lock className="size-3" />
                Hidden
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Privacy banner ────────────────────────────────────────────────────────────

function PrivacyBanner({ data }: { data: FullExportData }) {
  const firstName =
    data.profile.nickname || data.profile.full_name?.split(" ")[0] || "Patient";
  return (
    <div className="mx-auto max-w-5xl px-6 pb-6">
      <div className="flex gap-3 rounded-xl  bg-[#F8F4F0] px-5 py-4 text-[13px] text-[#1A1A1A]/70">
        <Lock className="mt-px size-3.5 shrink-0 text-[#A9334D]" />
        <p>
          <strong className="font-semibold text-[#1A1A1A]">
            {firstName} chose what to share.
          </strong>{" "}
          Full personal information visible as shared. This link can be revoked
          at any time from the Hemo app.
        </p>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function ExportView({
  data,
  onPdfDownload,
}: {
  data: FullExportData;
  testMode?: boolean;
  onPdfDownload?: () => void;
}) {
  const firstName =
    data.profile.nickname || data.profile.full_name?.split(" ")[0] || "Patient";
  const filename = `hemo-export-${firstName.toLowerCase()}.pdf`;

  return (
    <div className="min-h-screen bg-[#F8F4F0]">
      <PageNav
        document={<FullExportDocument data={data} />}
        fileName={filename}
        onDownload={onPdfDownload}
        meta={
          <>
            <span>
              Shared by{" "}
              <b className="font-semibold text-[#781D11]">{firstName}</b>
            </span>
            <span className="size-0.75 rounded-full bg-[#1A1414]/30" />
            <span>Snapshot · {formatGeneratedAt(data.generatedAt)}</span>
          </>
        }
      />
      <Masthead data={data} />
      <SummaryCard data={data} />

      <main className="pt-2">
        <AtGlance data={data} />
        <PainChartSection data={data} />
        <HeatmapSection data={data} />
        {(data.topSymptoms.length > 0 || data.topTriggers.length > 0) && (
          <SymptomsTriggers data={data} />
        )}
        {data.medications.length > 0 && <Medications data={data} />}
        {data.healthLogs.some((l) => l.notes || (l.pain_level ?? 0) >= 5) && (
          <NotableDays data={data} />
        )}
        <ProfileSection data={data} />
        <PrivacyBanner data={data} />
      </main>

      <PageFooter
        className="bg-white"
        containerClassName="mx-auto max-w-5xl px-6 py-10"
        disclaimer={
          <>
            This snapshot is generated automatically from daily logs in Hemo on{" "}
            {formatGeneratedAt(data.generatedAt)}. It is a self-reported record,
            not a clinical diagnosis or a substitute for medical advice. If you
            are a clinician reviewing this, please discuss findings directly
            with the patient.
          </>
        }
      />
    </div>
  );
}

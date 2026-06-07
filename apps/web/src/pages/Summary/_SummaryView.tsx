import { Calendar as CalendarIcon, Lock, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  HealthSummaryDocument,
  type HealthSummaryData,
} from "@/components/pdfx/HealthSummaryDocument";
import {
  displayName,
  formatGeneratedAt,
  formatRange,
} from "../Export/_exportUtils";
import { ChartCard21 } from "@/components/chart-card21";
import {
  SummaryInsightsSection,
  SummarySynthesisCard,
} from "./_SummaryInsights";
import { PageNav, PageFooter } from "../_PageShells";

type Medication = HealthSummaryData["medications"][number];

export type MastheadStyle = "gradient" | "cream" | "editorial";
export type Anonymization = "full" | "partial" | "initials";

interface SummaryViewProps {
  data: HealthSummaryData;
  testMode?: boolean;
  masthead?: MastheadStyle;
  anonymization?: Anonymization;
}

const HEMO_GRADIENT =
  "linear-gradient(135deg, #D09F9A 0%, #A9334D 50%, #781D11 100%)";

const PERIODS = [7, 30, 60] as const;

// ── Masthead ──────────────────────────────────────────────────────────────────

function Masthead({
  data,
  style,
  anonymization,
}: {
  data: HealthSummaryData;
  style: MastheadStyle;
  anonymization: Anonymization;
}) {
  const fullName =
    data.profile?.full_name || data.profile?.nickname || "Patient";
  const name = displayName(fullName, anonymization);
  const first =
    anonymization === "initials" ? name : fullName.split(" ")[0] || name;

  const isGradient = style === "gradient";
  const isCream = style === "cream";

  const surfaceCls = isGradient
    ? "text-[#F8E9E7]"
    : isCream
      ? "border-b border-[#F0E4E1] bg-[#F8F4F0] text-[#1A1414]"
      : "border-b border-[#F0E4E1] bg-[#FFF9F9] text-[#1A1414]";

  const nameCls = isGradient ? "text-white" : "text-[#781D11]";
  const metaCls = isGradient ? "text-[#F8E9E7]/85" : "text-[#1A1414]/65";
  const metaBoldCls = isGradient ? "text-white" : "text-[#1A1414]";
  const sepCls = isGradient ? "text-[#F8E9E7]/35" : "text-[#1A1414]/30";
  const pillCls = isGradient
    ? "border-white/20 bg-black/15 text-white"
    : isCream
      ? "border-[#F0E4E1] bg-white text-[#781D11]"
      : "border-[#1A1414]/12 bg-transparent text-[#1A1414]";

  return (
    <header
      className={cn("relative overflow-hidden", surfaceCls)}
      style={isGradient ? { background: HEMO_GRADIENT } : undefined}
    >
      {isGradient && (
        <>
          <Blob className="-right-20 -top-24 size-[360px]" />
          <Blob className="-bottom-32 -left-16 size-[320px]" />
        </>
      )}

      <div
        className={cn(
          "relative z-[1] mx-auto max-w-[960px] px-6 max-sm:px-4",
          style === "editorial"
            ? "py-12 max-sm:py-10"
            : "pb-16 pt-14 max-sm:pb-12 max-sm:pt-10",
        )}
      >
        {/* H1 */}
        <h1
          className={cn(
            "m-0 font-extrabold leading-[1.02] tracking-[-2px]",
            nameCls,
            style === "editorial"
              ? "text-[clamp(32px,4vw,44px)] tracking-[-1.2px]"
              : "text-[clamp(40px,6vw,64px)]",
          )}
        >
          What Hemo noticed in {first}'s last {data.periodDays} days.
        </h1>

        {/* Period tabs + date range */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-[13px] font-medium tracking-[-0.1px]",
              pillCls,
            )}
          >
            <CalendarIcon className="size-3.5 opacity-85" />
            {formatRange(data.dateRange.start, data.dateRange.end)}
          </span>
        </div>

        {/* Meta row */}
        <div
          className={cn(
            "mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[15px]",
            metaCls,
          )}
        >
          <span className="whitespace-nowrap">
            <b className={cn("font-semibold", metaBoldCls)}>{name}</b>
          </span>
          {data.profile?.scd_type && (
            <>
              <span className={sepCls}>·</span>
              <span className="whitespace-nowrap">
                <b className={cn("font-semibold", metaBoldCls)}>SCD type:</b>{" "}
                {data.profile.scd_type}
              </span>
            </>
          )}
          <span className={sepCls}>·</span>
          <span className="whitespace-nowrap">
            {data.stats.totalDaysLogged} of {data.periodDays} days logged
          </span>
        </div>
      </div>
    </header>
  );
}

export function PeriodTabs({
  current,
  variant,
}: {
  current: number;
  variant: MastheadStyle;
}) {
  const isGradient = variant === "gradient";
  return (
    <div
      role="tablist"
      aria-label="Summary period"
      className={cn(
        "inline-flex gap-0.5 rounded-full border p-[3px]",
        isGradient
          ? "border-white/20 bg-black/15"
          : "border-[#F0E4E1] bg-[#F8E9E7]",
      )}
    >
      {PERIODS.map((p) => {
        const active = p === current;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            disabled
            title={
              active
                ? `Showing the past ${p} days`
                : `${p}-day cut available in the Hemo app`
            }
            className={cn(
              "cursor-default rounded-full px-3.5 py-1.5 text-[13px] font-semibold tracking-[-0.1px] transition-colors",
              active
                ? isGradient
                  ? "bg-white text-[#781D11] shadow-[0_1px_4px_rgba(0,0,0,0.10)]"
                  : "bg-[#A9334D] text-white"
                : isGradient
                  ? "text-[#F8E9E7]/70"
                  : "text-[#1A1414]/65",
            )}
          >
            {p}D
          </button>
        );
      })}
    </div>
  );
}

function Blob({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-[2px]",
        className,
      )}
      style={{
        background:
          "radial-gradient(circle at center, rgba(255,255,255,0.18), rgba(255,255,255,0) 65%)",
      }}
    />
  );
}

// ── Section scaffold ──────────────────────────────────────────────────────────

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
    <section className="pt-14 max-sm:pt-10">
      <div className="mx-auto max-w-[960px] px-6 max-sm:px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#1A1414]/65">
              {eyebrow}
            </div>
            <h2 className="m-0 text-[clamp(22px,2.4vw,28px)] font-bold tracking-[-0.8px] text-[#781D11]">
              {title}
            </h2>
          </div>
          {aside && (
            <div className="text-[13px] tracking-[-0.1px] text-[#1A1414]/65">
              {aside}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// ── At a glance ───────────────────────────────────────────────────────────────

function AtGlance({ data }: { data: HealthSummaryData }) {
  const { stats, streak, periodDays, medications } = data;

  const activeMeds = medications.filter((m) => m.is_active && m.adherence);
  let adherence: number | null = null;
  if (activeMeds.length > 0) {
    const taken = activeMeds.reduce((s, m) => s + (m.adherence?.taken ?? 0), 0);
    const scheduled = activeMeds.reduce(
      (s, m) => s + (m.adherence?.scheduled ?? 0),
      0,
    );
    if (scheduled > 0) adherence = Math.round((taken / scheduled) * 100);
  }

  const items = [
    {
      label: "Days logged",
      value: String(stats.totalDaysLogged),
      foot: `of ${periodDays} (${Math.round((stats.totalDaysLogged / periodDays) * 100)}%)`,
    },
    {
      label: "Avg pain",
      value: (stats.avgPain ?? 0).toFixed(1),
      unit: "/10",
      foot: "out of 10",
    },
    {
      label: "Hydration",
      value: (stats.avgHydration ?? 0).toFixed(1),
      unit: "/10",
      foot: "below goal of 8",
      footCls: "text-[#A9334D]",
    },
    {
      label: "Sleep",
      value: String(stats.avgSleep ?? "—"),
      unit: stats.avgSleep != null ? "hrs" : undefined,
      foot: "consistent",
      footCls: "text-[#1F8A5B]",
    },
    adherence != null
      ? {
          label: "Med adherence",
          value: String(adherence),
          unit: "%",
          foot: `across ${activeMeds.length} active meds`,
        }
      : {
          label: "Streak",
          value: String(streak.current),
          unit: "days",
          foot: `longest: ${streak.longest}`,
        },
  ];

  return (
    <Section eyebrow="At a glance" title="The numbers behind it">
      <div className="grid grid-cols-5 overflow-hidden rounded-[20px] border border-[#F0E4E1] max-[880px]:grid-cols-2 max-[480px]:grid-cols-1">
        {items.map((s) => (
          <div
            key={s.label}
            className={cn(
              "flex min-h-[116px] flex-col gap-1.5 p-[18px]",
              "border-r border-[#F0E4E1] last:border-r-0",
              "max-[880px]:border-b max-[880px]:[&:nth-child(2n)]:border-r-0 max-[880px]:last:border-b-0",
              "max-[480px]:border-r-0",
            )}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#1A1414]/65">
              {s.label}
            </div>
            <div className="flex items-baseline gap-1 text-[34px] font-bold leading-none tracking-[-1.4px] text-[#1A1414]">
              {s.value}
              {s.unit && (
                <span className="text-[14px] font-medium tracking-[-0.3px] text-[#1A1414]/45">
                  {s.unit}
                </span>
              )}
            </div>
            <div
              className={cn("mt-auto text-[12px] text-[#1A1414]/65", s.footCls)}
            >
              {s.foot}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Patterns (symptoms + triggers) ───────────────────────────────────────────

function PatternsSection({ data }: { data: HealthSummaryData }) {
  const { topSymptoms, topTriggers, periodDays } = data;
  if (topSymptoms.length === 0 && topTriggers.length === 0) return null;

  return (
    <Section eyebrow="Patterns" title="What came up, and what set it off">
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {topSymptoms.length > 0 && (
          <ChartCard21
            title="Top symptoms"
            description={`Most reported over ${periodDays} days`}
            data={topSymptoms.map((s) => ({
              label: s.name,
              value: s.count,
              color: "#A9334D",
            }))}
            className="rounded-[20px] border-[#F0E4E1] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
          />
        )}
        {topTriggers.length > 0 && (
          <ChartCard21
            title="Top triggers"
            description={`Most suspected over ${periodDays} days`}
            data={topTriggers.map((t) => ({
              label: t.name,
              value: t.count,
              color: "#781D11",
            }))}
            className="rounded-[20px] border-[#F0E4E1] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
          />
        )}
      </div>
    </Section>
  );
}

// ── Active medications ────────────────────────────────────────────────────────

function AdherenceRing({ pct }: { pct: number }) {
  return (
    <div
      className="relative size-9 shrink-0 rounded-full"
      style={{ background: `conic-gradient(#A9334D ${pct}%, #F3EAE7 0)` }}
    >
      <span className="absolute inset-1 rounded-full bg-white" />
      <span className="relative z-[1] flex h-full items-center justify-center font-mono text-[10px] font-bold tracking-[-0.3px] text-[#A9334D]">
        {pct}
      </span>
    </div>
  );
}

function MedRow({ med }: { med: Medication }) {
  const pct =
    med.adherence && med.adherence.scheduled > 0
      ? Math.round((med.adherence.taken / med.adherence.scheduled) * 100)
      : null;

  const categoryColor =
    med.category === "Disease-modifying"
      ? "bg-[#A9334D]/[0.08] text-[#A9334D]"
      : med.category === "Pain management"
        ? "bg-[#F0531C]/10 text-[#F0531C]"
        : "bg-[#1A1414]/[0.07] text-[#1A1414]/65";

  return (
    <div className="grid grid-cols-[38px_1fr_auto] items-center gap-3.5 rounded-[14px] border border-[#F0E4E1] bg-white p-4">
      <div className="flex size-[38px] items-center justify-center rounded-[12px] bg-[#F8E9E7] text-[#A9334D]">
        <Pill className="size-5" />
      </div>

      <div className="min-w-0">
        <div className="text-[15px] font-semibold tracking-[-0.2px] text-[#1A1414]">
          {med.name}{" "}
          <span className="text-[13px] font-normal text-[#1A1414]/65">
            · {med.dosage}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#1A1414]/65">
          {med.category && (
            <Badge
              variant="outline"
              className={cn(
                "h-auto border-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                categoryColor,
              )}
            >
              {med.category}
            </Badge>
          )}
          <span>
            {med.frequency}
            {med.prescribed_by ? ` · ${med.prescribed_by}` : ""}
          </span>
        </div>
      </div>

      {pct != null && (
        <div className="flex items-center gap-3">
          <div className="text-right text-[13px] font-semibold text-[#781D11]">
            {pct}%
            <span className="mt-0.5 block font-mono text-[11px] font-medium tracking-[-0.3px] text-[#1A1414]/45">
              {med.adherence!.taken}/{med.adherence!.scheduled}
            </span>
          </div>
          <AdherenceRing pct={pct} />
        </div>
      )}
    </div>
  );
}

function MedicationsSection({ data }: { data: HealthSummaryData }) {
  const active = data.medications.filter((m) => m.is_active);
  if (!active.length) return null;

  return (
    <Section
      eyebrow="Medications"
      title="Active regimen & adherence"
      aside={`${active.length} active`}
    >
      <div className="flex flex-col gap-2.5">
        {active.map((m) => (
          <MedRow key={m.id} med={m} />
        ))}
      </div>
    </Section>
  );
}

// ── Profile facts ─────────────────────────────────────────────────────────────

function Unit({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] font-medium text-[#1A1414]/45">
      {children}
    </span>
  );
}

export function ProfileSection({
  data,
  anonymization,
}: {
  data: HealthSummaryData;
  anonymization: Anonymization;
}) {
  const p = data.profile;
  if (!p) return null;
  const showSensitive = anonymization === "full";

  type Fact =
    | { kind: "value"; label: string; value: React.ReactNode; small?: boolean }
    | { kind: "redacted"; label: string };

  const facts: Fact[] = [];
  if (p.scd_type)
    facts.push({ kind: "value", label: "SCD type", value: p.scd_type });
  if (p.blood_type) {
    facts.push(
      showSensitive
        ? { kind: "value", label: "Blood type", value: p.blood_type }
        : { kind: "redacted", label: "Blood type" },
    );
  }
  if (p.preferred_hospital) {
    facts.push(
      showSensitive
        ? {
            kind: "value",
            label: "Hospital",
            value: p.preferred_hospital,
            small: true,
          }
        : { kind: "redacted", label: "Hospital" },
    );
  }
  if (data.stats.avgSleep != null)
    facts.push({
      kind: "value",
      label: "Avg sleep",
      value: (
        <>
          {data.stats.avgSleep} <Unit>hrs</Unit>
        </>
      ),
    });
  if (data.stats.avgSteps != null)
    facts.push({
      kind: "value",
      label: "Avg steps",
      value: Math.round(data.stats.avgSteps).toLocaleString(),
    });
  if (data.stats.avgHeartRate != null)
    facts.push({
      kind: "value",
      label: "Avg heart rate",
      value: (
        <>
          {data.stats.avgHeartRate} <Unit>bpm</Unit>
        </>
      ),
    });

  if (facts.length === 0) return null;

  const isThreeCol = facts.length === 6;
  const gridCols = isThreeCol
    ? "grid-cols-3 max-md:grid-cols-2"
    : "grid-cols-4 max-md:grid-cols-2";
  const cellDividers = isThreeCol
    ? cn(
        "border-r border-b border-[#F0E4E1]",
        "[&:nth-child(3n)]:border-r-0",
        "[&:nth-last-child(-n+3)]:border-b-0",
        "max-md:[&:nth-child(3n)]:border-r max-md:[&:nth-child(2n)]:border-r-0",
        "max-md:[&:nth-last-child(-n+3)]:border-b max-md:[&:nth-last-child(-n+2)]:border-b-0",
      )
    : cn(
        "border-r border-b border-[#F0E4E1]",
        "[&:nth-child(4n)]:border-r-0",
        "[&:nth-last-child(-n+4)]:border-b-0",
        "max-md:[&:nth-child(4n)]:border-r max-md:[&:nth-child(2n)]:border-r-0",
        "max-md:[&:nth-last-child(-n+4)]:border-b max-md:[&:nth-last-child(-n+2)]:border-b-0",
      );

  return (
    <Section eyebrow="About" title="A few facts">
      <div
        className={cn(
          "grid overflow-hidden rounded-[20px] border border-[#F0E4E1]",
          gridCols,
        )}
      >
        {facts.map((f) => (
          <div
            key={f.label}
            className={cn("flex flex-col gap-1 p-[18px]", cellDividers)}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#1A1414]/65">
              {f.label}
            </div>
            {f.kind === "redacted" ? (
              <span className="inline-flex items-center gap-1.5 text-[16px] font-medium italic tracking-[-0.3px] text-[#1A1414]/45">
                <Lock className="size-3.5" /> Hidden
              </span>
            ) : (
              <div
                className={cn(
                  "font-semibold tracking-[-0.3px] text-[#1A1414]",
                  f.small ? "text-[14px]" : "text-[16px]",
                )}
              >
                {f.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Privacy banner ────────────────────────────────────────────────────────────

function PrivacyBanner({ data }: { data: HealthSummaryData }) {
  const first =
    data.profile?.nickname ||
    data.profile?.full_name?.split(" ")[0] ||
    "The patient";

  return (
    <div className="mx-auto mt-7 max-w-240 px-6 max-sm:px-4">
      <div className="flex gap-3 rounded-xl px-5 py-4 text-[13px] text-[#1A1414]/70">
        <Lock className="mt-px size-3.5 shrink-0 text-[#A9334D]" />
        <p>
          <strong className="font-semibold text-[#1A1414]">
            {first} chose what to share.
          </strong>{" "}
          Full personal information visible as shared. This link can be revoked
          at any time from the Hemo app.
        </p>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function SummaryView({
  data,
  masthead = "gradient",
  anonymization = "full",
}: SummaryViewProps) {
  const first =
    data.profile?.nickname ||
    data.profile?.full_name?.split(" ")[0] ||
    "Patient";
  const filename = `hemo-summary-${data.periodDays}d-${(
    data.profile?.full_name || "patient"
  )
    .replace(/\s+/g, "-")
    .toLowerCase()}.pdf`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF9F9] text-[#1A1414] antialiased">
      <PageNav
        document={<HealthSummaryDocument data={data} />}
        fileName={filename}
        meta={
          <>
            <span>
              Shared by <b className="font-semibold text-[#781D11]">{first}</b>
            </span>
            <span className="size-0.75 rounded-full bg-[#1A1414]/30" />
            <span>
              {data.periodDays}-day summary ·{" "}
              {formatGeneratedAt(data.generatedAt)}
            </span>
          </>
        }
      />
      <Masthead data={data} style={masthead} anonymization={anonymization} />
      <SummarySynthesisCard data={data} />

      <main>
        <SummaryInsightsSection data={data} />
        <AtGlance data={data} />
        <PatternsSection data={data} />
        <MedicationsSection data={data} />
        {/* <ProfileSection data={data} anonymization={anonymization} /> */}
        <PrivacyBanner data={data} />
      </main>

      <PageFooter
        className="mt-16 bg-[#F8F4F0] px-6 pb-14 pt-10 max-sm:px-4"
        containerClassName="mx-auto max-w-240"
        disclaimer={
          <>
            This summary was generated automatically from {first}'s daily logs
            in Hemo on {formatGeneratedAt(data.generatedAt)}. The patterns
            surfaced here are heuristic, not a clinical diagnosis. Always
            discuss findings with a licensed care provider before changing
            medication or treatment.
          </>
        }
      />
    </div>
  );
}

import {
  Phone,
  Clock,
  ShieldCheck,
  Pill,
  User,
  Activity,
  Zap,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageNav, PageFooter } from "../_PageShells";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EDCardData {
  generatedAt: string;
  patient: {
    name: string;
    dob: string;
    scd_type: string;
    blood_type: string | null;
    allergies: string[];
    preferred_hospital: string | null;
    weight_kg: number | null;
  };
  painPlan: {
    baseline_pain: number;
    effective_medications: { name: string; dosage: string; notes?: string }[];
    medications_to_avoid: string[];
    individualized_notes: string | null;
  };
  medications: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    category: string;
    prescribed_by: string | null;
  }[];
  contacts: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
  }[];
  recentCrises: {
    date: string;
    duration_hours: number;
    peak_pain: number;
  }[];
  stats: {
    crisesLast6Months: number;
    lastCrisisDate: string | null;
    avgPainLast30Days: number | null;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ data }: { data: EDCardData }) {
  const age = calcAge(data.patient.dob);
  const first = data.patient.name.split(" ")[0];

  return (
    <header
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #D09F9A 0%, #A9334D 50%, #781D11 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-[280px] rounded-full blur-[2px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.14), rgba(255,255,255,0) 65%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-12 size-[240px] rounded-full blur-[2px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.10), rgba(255,255,255,0) 65%)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[720px] px-6 pb-12 pt-10 max-sm:px-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[1.8px] text-white/60">
          Emergency Medical Record
        </div>
        <h1
          className="m-0 font-extrabold leading-[1.02] tracking-[-2px] text-white"
          style={{ fontSize: "clamp(38px, 6vw, 58px)" }}
        >
          {first}
        </h1>
        {/* Name */}
        <p className="m-0 text-[18px] font-medium text-white/80" style={{ fontSize: "clamp(14px, 2vw, 18px)" }}>
          {data.patient.name}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Chip label="SCD type" value={data.patient.scd_type} />
          {data.patient.blood_type && (
            <Chip label="Blood type" value={data.patient.blood_type} />
          )}
          <Chip label="Age" value={`${age} yrs`} />
          {data.patient.weight_kg && (
            <Chip label="Weight" value={`${data.patient.weight_kg} kg`} />
          )}
        </div>

        {data.patient.preferred_hospital && (
          <p className="mt-4 text-[14px] text-white/65">
            Preferred hospital:{" "}
            <strong className="font-semibold text-white">
              {data.patient.preferred_hospital}
            </strong>
          </p>
        )}
      </div>
    </header>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col rounded-[10px] border border-white/20 bg-black/15 px-3 py-2 text-white">
      <span className="text-[9px] font-semibold uppercase tracking-[1.2px] text-white/55">
        {label}
      </span>
      <span className="text-[15px] font-bold leading-tight tracking-[-0.3px]">
        {value}
      </span>
    </span>
  );
}

// ── Allergies ─────────────────────────────────────────────────────────────────

function AllergiesSection({ allergies }: { allergies: string[] }) {
  if (allergies.length === 0) return null;

  return (
    <div className="mx-auto max-w-[720px] px-5 pt-6">
      <div
        className="rounded-[16px] px-6 py-5"
        // style={{ background: "#1A1A1A" }}
      >
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[1.6px] ">
          Allergies & Contraindications
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allergies.map((a) => (
            <span
              key={a}
              className="rounded-full border border-[#F8E9E7]/50 bg-[#F8E9E7]/40 px-4 py-1.5 text-[15px] font-semibold"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[720px] px-5 pt-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#A9334D]/10 text-[#A9334D]">
          <Icon className="size-4" />
        </span>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[#1A1A1A]/50">
            {eyebrow}
          </div>
          <h2
            className="m-0 font-bold tracking-[-0.6px] text-[#781D11]"
            style={{ fontSize: "clamp(20px, 2.2vw, 24px)" }}
          >
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

// ── Pain Management Plan ──────────────────────────────────────────────────────

function PainPlanSection({ data }: { data: EDCardData }) {
  const { painPlan } = data;

  return (
    <Section icon={Zap} eyebrow="Treatment" title="Pain Management Protocol">
      <div className="flex flex-col gap-3">
        {/* Baseline */}
        <div className="flex items-center gap-4 rounded-[14px] border border-[#F0E4E1] bg-white px-5 py-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#1A1A1A]/50">
              Patient's baseline pain
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[32px] font-bold leading-none tracking-[-1.2px] text-[#1A1A1A]">
                {painPlan.baseline_pain}
              </span>
              <span className="text-[15px] font-medium text-[#1A1A1A]/40">
                /10
              </span>
              <span className="ml-2 text-[13px] text-[#1A1A1A]/50">
                their normal resting level
              </span>
            </div>
          </div>
        </div>

        {/* Effective meds */}
        {painPlan.effective_medications.length > 0 && (
          <div className="rounded-[14px] border border-[#F0E4E1] bg-white">
            <div className="border-b border-[#F0E4E1] px-5 py-3.5">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#1A1A1A]/50">
                Known effective for this patient
              </p>
            </div>
            <div className="flex flex-col divide-y divide-[#F0E4E1]">
              {painPlan.effective_medications.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Check className="size-4 shrink-0 text-[#A9334D]" />
                  <span className="text-[16px] font-semibold text-[#1A1A1A]">
                    {m.name}{" "}
                    <span className="font-normal text-[#1A1A1A]/60">
                      {m.dosage}
                    </span>
                  </span>
                  {m.notes && (
                    <span className="ml-auto shrink-0 text-[13px] text-[#1A1A1A]/50">
                      {m.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meds to avoid */}
        {painPlan.medications_to_avoid.length > 0 && (
          <div className="rounded-[14px] border border-[#F0E4E1] bg-white">
            <div className="border-b border-[#F0E4E1] px-5 py-3.5">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#1A1A1A]/50">
                Avoid — ineffective or contraindicated
              </p>
            </div>
            <div className="flex flex-col divide-y divide-[#F0E4E1]">
              {painPlan.medications_to_avoid.map((m) => (
                <div key={m} className="flex items-center gap-3 px-5 py-3.5">
                  <X className="size-4 shrink-0 text-[#1A1A1A]/40" />
                  <span className="text-[16px] font-semibold text-[#1A1A1A]/60 line-through decoration-[#1A1A1A]/30">
                    {m}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {painPlan.individualized_notes && (
          <div className="rounded-[14px] border border-[#F0E4E1] bg-[#F8F4F0] px-5 py-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#1A1A1A]/50">
              In the patient's own words
            </p>
            <p className="m-0 text-[15px] leading-[1.7] tracking-[-0.1px] text-[#1A1A1A]/75 italic">
              "{painPlan.individualized_notes}"
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}

// ── Current Medications ───────────────────────────────────────────────────────

function MedicationsSection({
  medications,
}: {
  medications: EDCardData["medications"];
}) {
  if (medications.length === 0) return null;

  const categoryColor = (cat: string) => {
    if (cat === "Disease-modifying")
      return "bg-[#A9334D]/[0.08] text-[#A9334D]";
    if (cat === "Pain management") return "bg-[#F0531C]/10 text-[#F0531C]";
    return "bg-[#1A1A1A]/[0.06] text-[#1A1A1A]/60";
  };

  return (
    <Section icon={Pill} eyebrow="Medications" title="Current Regimen">
      <div className="flex flex-col gap-2.5">
        {medications.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3.5 rounded-[14px] border border-[#F0E4E1] bg-white px-5 py-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F8E9E7] text-[#A9334D]">
              <Pill className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold tracking-[-0.2px] text-[#1A1A1A]">
                {m.name}{" "}
                <span className="font-normal text-[#1A1A1A]/55">
                  {m.dosage}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                    categoryColor(m.category),
                  )}
                >
                  {m.category}
                </span>
                <span className="text-[13px] text-[#1A1A1A]/50">
                  {m.frequency}
                  {m.prescribed_by ? ` · ${m.prescribed_by}` : ""}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Emergency Contacts ────────────────────────────────────────────────────────

function ContactsSection({ contacts }: { contacts: EDCardData["contacts"] }) {
  if (contacts.length === 0) return null;

  return (
    <Section icon={Phone} eyebrow="Contacts" title="Emergency Contacts">
      <div className="flex flex-col gap-2.5">
        {contacts.map((c) => (
          <a
            key={c.id}
            href={`tel:${c.phone}`}
            className="flex items-center gap-3.5 rounded-[14px] border border-[#F0E4E1] bg-white px-5 py-4 no-underline transition-colors hover:border-[#A9334D]/30 hover:bg-[#F8E9E7]/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#A9334D] text-white">
              <span className="text-[13px] font-bold">
                {c.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold text-[#1A1A1A]">
                {c.name}
              </div>
              <div className="text-[13px] text-[#1A1A1A]/50">
                {c.relationship}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-[#A9334D]/90">
              {/* <Phone className="size-3.5" /> */}
              {c.phone}
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── Crisis History ────────────────────────────────────────────────────────────

function CrisisHistorySection({ data }: { data: EDCardData }) {
  const { stats, recentCrises } = data;
  if (stats.crisesLast6Months === 0 && recentCrises.length === 0) return null;

  return (
    <Section icon={Activity} eyebrow="History" title="Recent Crisis Episodes">
      <div className="mb-3 grid grid-cols-3 gap-px overflow-hidden rounded-2xl max-sm:grid-cols-2">
        <StatTile
          label="Crises (6 months)"
          value={String(stats.crisesLast6Months)}
        />
        <StatTile
          label="Last crisis"
          value={
            stats.lastCrisisDate
              ? fmtDate(stats.lastCrisisDate)
              : "None recorded"
          }
          small
        />
        {stats.avgPainLast30Days != null && (
          <StatTile
            label="Avg pain (30 days)"
            value={`${stats.avgPainLast30Days.toFixed(1)}/10`}
          />
        )}
      </div>

      {recentCrises.length > 0 && (
        <div className="flex flex-col gap-2">
          {recentCrises.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 rounded-[12px] border border-[#F0E4E1] bg-white px-5 py-3.5"
            >
              <Clock className="size-4 shrink-0 text-[#A9334D]" />
              <span className="text-[15px] font-semibold text-[#1A1A1A]">
                {fmtDate(c.date)}
              </span>
              <span className="ml-auto text-[13px] text-[#1A1A1A]/50">
                {c.duration_hours}h · peak {c.peak_pain}/10
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function StatTile({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-[#F0E4E1] bg-white p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#1A1A1A]/50">
        {label}
      </span>
      <span
        className={cn(
          "font-bold leading-tight tracking-[-0.5px] text-[#1A1A1A]",
          small ? "text-[17px]" : "text-[26px]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ── Patient ID ────────────────────────────────────────────────────────────────

function PatientIDSection({ data }: { data: EDCardData }) {
  const p = data.patient;
  const age = calcAge(p.dob);

  return (
    <Section icon={User} eyebrow="Patient" title="Identification">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[#F0E4E1] bg-[#F0E4E1] max-sm:grid-cols-2">
        <InfoCell label="Full name" value={p.name} />
        <InfoCell
          label="Date of birth"
          value={`${fmtDate(p.dob)} (${age} yrs)`}
        />
        <InfoCell label="SCD type" value={p.scd_type} />
        {p.blood_type && <InfoCell label="Blood type" value={p.blood_type} />}
        {p.weight_kg && <InfoCell label="Weight" value={`${p.weight_kg} kg`} />}
        {p.preferred_hospital && (
          <InfoCell
            label="Preferred hospital"
            value={p.preferred_hospital}
            small
          />
        )}
      </div>
    </Section>
  );
}

function InfoCell({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-[#F8F4F0] px-5 py-5">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-[1px] text-[#1A1A1A]/45">
        {label}
      </div>
      <div
        className={cn(
          "font-semibold text-[#1A1A1A]",
          small ? "text-[14px]" : "text-[18px]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function EmergencyCardView({ data }: { data: EDCardData }) {
  const first = data.patient.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#F8F4F0] text-[#1A1A1A] antialiased">
      <PageNav
        meta={
          <>
            <ShieldCheck className="size-3.5 text-[#A9334D]" />
            <span>
              Emergency card · shared by{" "}
              <b className="font-semibold text-[#781D11]">{first}</b>
            </span>
            <span className="size-0.75 rounded-full bg-[#1A1414]/30" />
            <span>{fmtTime(data.generatedAt)}</span>
          </>
        }
      />
      <Header data={data} />
      <AllergiesSection allergies={data.patient.allergies} />
      <PainPlanSection data={data} />
      <MedicationsSection medications={data.medications} />
      <ContactsSection contacts={data.contacts} />
      <CrisisHistorySection data={data} />
      <PatientIDSection data={data} />
      <PageFooter
        className="mt-14 bg-white pt-10"
        containerClassName="mx-auto max-w-5xl px-6 py-10"
        disclaimer={
          <>
            This record was shared by {first} from the Hemo app on{" "}
            {fmtTime(data.generatedAt)}. Data is sourced from self-reported logs
            and may not reflect the latest clinical state. Verify critical
            information with the patient or their care team.
          </>
        }
      />
    </div>
  );
}

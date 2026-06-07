export function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

export function formatDayLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatRange(startISO: string, endISO: string): string {
  const s = new Date(startISO + "T00:00:00");
  const e = new Date(endISO + "T00:00:00");
  return `${s.toLocaleString("en-US", { month: "long", day: "numeric" })} – ${e.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  if (isNaN(b.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function displayName(fullName: string, mode: "full" | "partial" | "initials"): string {
  if (mode === "full") return fullName;
  if (mode === "initials") return initialsOf(fullName);
  const parts = fullName.split(" ");
  const first = parts[0] ?? "";
  const rest = parts
    .slice(1)
    .map((n) => (n ? n[0] + "." : ""))
    .join(" ");
  return [first, rest].filter(Boolean).join(" ");
}

export function painColor(level: number | null | undefined): string {
  if (level == null) return "#F3EAE7";
  const steps = [
    "#F3EAE7",
    "#F5DAD3",
    "#F0C2BA",
    "#E89F95",
    "#DF7C73",
    "#D45A55",
    "#C53E45",
    "#A9334D",
    "#8E2949",
    "#781D41",
    "#5E1234",
  ];
  const i = Math.max(0, Math.min(10, Math.round(level)));
  return steps[i];
}

export function painColorContrast(level: number | null | undefined): string {
  if (level == null) return "rgba(26,20,20,0.45)";
  return level >= 5 ? "rgba(255,255,255,0.92)" : "#781D11";
}

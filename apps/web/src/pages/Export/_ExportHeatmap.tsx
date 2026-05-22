import type { FullExportData } from "@/components/pdfx/FullExportDocument";
import { cn } from "@/lib/utils";
import { formatDayLong, painColor, painColorContrast, toLocalISO } from "./_exportUtils";

type HealthLog = FullExportData["healthLogs"][number];

interface HeatmapProps {
  logs: HealthLog[];
  startISO: string;
  endISO: string;
}

export function ExportHeatmap({ logs, startISO, endISO }: HeatmapProps) {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");

  const byDate: Record<string, HealthLog> = {};
  for (const l of logs) byDate[l.date] = l;

  const dowMon = (date: Date) => (date.getDay() + 6) % 7;

  type Cell =
    | { kind: "empty"; key: string }
    | { kind: "day"; key: string; iso: string; day: number; log: HealthLog | null };

  const cells: Cell[] = [];
  for (let i = 0; i < dowMon(start); i++) cells.push({ kind: "empty", key: `lead-${i}` });

  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const iso = toLocalISO(cursor);
    cells.push({
      kind: "day",
      key: iso,
      iso,
      day: cursor.getDate(),
      log: byDate[iso] ?? null,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  while (cells.length % 7 !== 0) cells.push({ kind: "empty", key: `tail-${cells.length}` });

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="pb-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#1A1414]/45"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c) => {
          if (c.kind === "empty") {
            return <div key={c.key} className="aspect-square rounded-lg" />;
          }
          if (!c.log) {
            return (
              <div
                key={c.key}
                title={`${c.iso} · No log`}
                className="relative flex aspect-square items-end justify-start rounded-lg p-1.5 text-[11px] font-semibold text-[#1A1414]/45 [background:repeating-linear-gradient(135deg,transparent_0_4px,rgba(26,20,20,0.04)_4px_5px)]"
              >
                {c.day}
              </div>
            );
          }
          const bg = painColor(c.log.pain_level);
          const color = painColorContrast(c.log.pain_level);
          return (
            <div
              key={c.key}
              title={`${formatDayLong(c.iso)} · Pain ${c.log.pain_level}/10${c.log.notes ? ` · ${c.log.notes}` : ""}`}
              style={{ background: bg, color }}
              className={cn(
                "relative flex aspect-square items-end justify-start rounded-lg p-1.5 text-[11px] font-semibold transition-transform hover:-translate-y-0.5 hover:z-10",
                c.log.is_repaired && "border border-dashed border-[#A9334D]",
              )}
            >
              {c.day}
              {c.log.notes && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#F0531C]" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#1A1414]/65">
        <span>Lower pain</span>
        <div className="flex gap-[2px]">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
            <span
              key={p}
              className="inline-block h-2.5 w-3.5 rounded-[2px]"
              style={{ background: painColor(p) }}
            />
          ))}
        </div>
        <span>Higher pain</span>

        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-[#F0531C]" />
          Notes attached
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3.5 rounded-[2px] border border-dashed border-[#A9334D]" />
          Logged after the fact
        </span>
      </div>
    </div>
  );
}

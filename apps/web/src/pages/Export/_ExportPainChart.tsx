import type { FullExportData } from "@/components/pdfx/FullExportDocument";
import { formatDay, formatDayLong } from "./_exportUtils";

type HealthLog = FullExportData["healthLogs"][number];

interface PainChartProps {
  logs: HealthLog[];
  startISO: string;
  endISO: string;
}

export function ExportPainChart({ logs, startISO, endISO }: PainChartProps) {
  const W = 880;
  const H = 240;
  const PAD = { top: 20, right: 18, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const start = new Date(startISO + "T00:00:00").getTime();
  const end = new Date(endISO + "T00:00:00").getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((end - start) / dayMs));

  const x = (iso: string) => {
    const t = new Date(iso + "T00:00:00").getTime();
    const days = (t - start) / dayMs;
    return PAD.left + (days / totalDays) * innerW;
  };
  const y = (p: number) => PAD.top + innerH - (p / 10) * innerH;

  const points = logs.map((l) => ({ ...l, cx: x(l.date), cy: y(l.pain_level ?? 0) }));

  const linePath =
    points.length > 1
      ? points.reduce((acc, p, i) => {
          if (i === 0) return `M ${p.cx} ${p.cy}`;
          const prev = points[i - 1];
          const cx1 = prev.cx + (p.cx - prev.cx) / 2;
          const cy1 = prev.cy;
          const cx2 = prev.cx + (p.cx - prev.cx) / 2;
          const cy2 = p.cy;
          return acc + ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.cx} ${p.cy}`;
        }, "")
      : "";

  const areaPath = linePath
    ? linePath +
      ` L ${points[points.length - 1].cx} ${PAD.top + innerH} L ${points[0].cx} ${PAD.top + innerH} Z`
    : "";

  const crisis = logs.length
    ? logs.reduce((a, b) => ((b.pain_level ?? 0) > (a.pain_level ?? 0) ? b : a), logs[0])
    : null;
  const crisisX = crisis ? x(crisis.date) : 0;
  const crisisY = crisis ? y(crisis.pain_level ?? 0) : 0;

  const isoAtOffset = (i: number) => {
    const t = new Date(start + i * dayMs);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  };

  const ticks: { x: number; label: string }[] = [];
  for (let i = 0; i <= totalDays; i += 7) {
    const iso = isoAtOffset(i);
    ticks.push({ x: x(iso), label: formatDay(iso) });
  }
  if (ticks.length === 0 || ticks[ticks.length - 1].label !== formatDay(endISO)) {
    ticks.push({ x: x(endISO), label: formatDay(endISO) });
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[240px] w-full overflow-visible"
        aria-label="Pain level over time"
      >
        <defs>
          <linearGradient id="hemo-pain-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A9334D" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#A9334D" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 3, 7, 10].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="#F0E4E1"
              strokeWidth={1}
              strokeDasharray={v === 0 || v === 10 ? "0" : "3 4"}
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 3}
              textAnchor="end"
              className="fill-[#1A1414]/45 font-mono text-[10px] tracking-wider"
            >
              {v}
            </text>
          </g>
        ))}

        {ticks.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={H - 8}
            textAnchor="middle"
            className="fill-[#1A1414]/45 font-mono text-[10px] tracking-wider"
          >
            {t.label}
          </text>
        ))}

        <rect
          x={PAD.left}
          y={y(10)}
          width={innerW}
          height={y(7) - y(10)}
          fill="#DC2626"
          fillOpacity={0.04}
        />

        <path d={areaPath} fill="url(#hemo-pain-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="#A9334D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={(p.pain_level ?? 0) >= 7 ? 5 : 3.2}
            fill="#FFFFFF"
            stroke={(p.pain_level ?? 0) >= 7 ? "#DC2626" : "#A9334D"}
            strokeWidth={(p.pain_level ?? 0) >= 7 ? 2.5 : 1.6}
          />
        ))}

        {crisis && (
          <line
            x1={crisisX}
            x2={crisisX}
            y1={crisisY - 8}
            y2={PAD.top - 4}
            stroke="#DC2626"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}
      </svg>

      {crisis && (
        <div
          className="pointer-events-none absolute max-w-[160px] -translate-x-1/2 -translate-y-2 rounded-[10px] border border-[#F0E4E1] bg-white px-[11px] py-2 text-[11px] leading-snug text-[#781D11] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
          style={{ left: `${(crisisX / W) * 100}%`, top: 0 }}
        >
          <div className="font-semibold text-[#DC2626]">Crisis warning</div>
          <div>
            {formatDayLong(crisis.date)} · pain {crisis.pain_level}/10
          </div>
        </div>
      )}
    </div>
  );
}

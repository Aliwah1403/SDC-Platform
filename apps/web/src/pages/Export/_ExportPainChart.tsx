import {
  EvilAreaChart,
  Area,
  XAxis,
  YAxis,
  Grid,
  ActiveDot,
} from "@/components/evilcharts/charts/area-chart";
import { type ChartConfig } from "@/components/evilcharts/ui/chart";
import { ReferenceArea, ReferenceLine, Tooltip as RechartsTooltip } from "recharts";
import type { FullExportData } from "@/components/pdfx/FullExportDocument";
import { formatDay, formatDayLong } from "./_exportUtils";

function fmtDDMMYYYY(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function PainTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { date: string; pain: number | null } }[];
}) {
  if (!active || !payload?.length) return null;
  const { date, pain } = payload[0].payload;
  if (pain == null) return null;
  return (
    <div className="rounded-[10px] border border-[#F0E4E1] bg-white px-3 py-2 text-[11px] leading-snug shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="font-semibold text-[#1A1414]">{fmtDDMMYYYY(date)}</div>
      <div className="text-[#A9334D]">Pain: {pain}/10</div>
    </div>
  );
}

type HealthLog = FullExportData["healthLogs"][number];

interface PainChartProps {
  logs: HealthLog[];
  startISO: string;
  endISO: string;
}

const MARGIN = { top: 20, right: 18, bottom: 28, left: 36 };

const chartConfig = {
  pain: {
    label: "Pain level",
    colors: {
      light: ["#A9334D"],
      dark: ["#A9334D"],
    },
  },
} satisfies ChartConfig;

export function ExportPainChart({ logs, startISO, endISO }: PainChartProps) {
  const dayMs = 24 * 60 * 60 * 1000;
  const start = new Date(startISO + "T00:00:00").getTime();
  const end = new Date(endISO + "T00:00:00").getTime();
  const totalDays = Math.max(1, Math.round((end - start) / dayMs));

  const logMap = new Map(logs.map((l) => [l.date, l]));

  const data = Array.from({ length: totalDays + 1 }, (_, i) => {
    const t = new Date(start + i * dayMs);
    const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    const log = logMap.get(iso);
    return { date: iso, pain: log?.pain_level ?? null };
  });

  const xTicks: string[] = [];
  for (let i = 0; i <= totalDays; i += 7) {
    const t = new Date(start + i * dayMs);
    xTicks.push(
      `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`,
    );
  }
  if (xTicks[xTicks.length - 1] !== endISO) xTicks.push(endISO);

  const crisis = logs.length
    ? logs.reduce(
        (a, b) => ((b.pain_level ?? 0) > (a.pain_level ?? 0) ? b : a),
        logs[0],
      )
    : null;

  const crisisDayIndex = crisis
    ? Math.round(
        (new Date(crisis.date + "T00:00:00").getTime() - start) / dayMs,
      )
    : 0;

  return (
    <div className="relative">
      <EvilAreaChart
        data={data}
        config={chartConfig}
        className="h-60 w-full"
        curveType="monotone"
        animationType="left-to-right"
        chartProps={{ margin: MARGIN }}
      >
        <Grid vertical={false} stroke="#F0E4E1" strokeDasharray="3 4" />

        <XAxis
          dataKey="date"
          ticks={xTicks}
          tickFormatter={formatDay}
          tick={{
            fontSize: 10,
            fill: "rgba(26,20,20,0.45)",
            fontFamily: "monospace",
          }}
          height={28}
        />

        <YAxis
          domain={[0, 10]}
          ticks={[0, 3, 7, 10]}
          tick={{
            fontSize: 10,
            fill: "rgba(26,20,20,0.45)",
            fontFamily: "monospace",
          }}
          width={36}
        />

        {/* Crisis zone band */}
        <ReferenceArea y1={7} y2={10} fill="#DC2626" fillOpacity={0.04} stroke="none" />

        {/* Vertical dashed line at crisis peak */}
        {crisis && (
          <ReferenceLine
            x={crisis.date}
            stroke="#DC2626"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}

        <RechartsTooltip content={<PainTooltip />} cursor={{ strokeDasharray: "3 3" }} />

        <Area
          dataKey="pain"
          variant="gradient"
          strokeVariant="solid"
          connectNulls
        >
          <ActiveDot variant="colored-border" />
        </Area>
      </EvilAreaChart>

      {/* Crisis callout card */}
      {crisis && (
        <div
          className="pointer-events-none absolute max-w-40 -translate-x-1/2 -translate-y-2 rounded-[10px] border border-[#F0E4E1] bg-white px-2.75 py-2 text-[11px] leading-snug text-[#781D11] shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
          style={{
            left: `calc(${MARGIN.left}px + (100% - ${MARGIN.left + MARGIN.right}px) * ${crisisDayIndex / totalDays})`,
            top: MARGIN.top,
          }}
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

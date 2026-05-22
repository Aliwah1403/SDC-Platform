import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Activity, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { HealthSummaryData } from "@/components/pdfx/HealthSummaryDocument";
import SummaryView from "./_SummaryView";

type TokenRow = {
  mode: string;
  expires_at: string;
  view_count: number;
  max_views: number | null;
  period_days: number | null;
  data_snapshot: HealthSummaryData;
};

export default function SummaryPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "expired" | "error" | "ready">("loading");
  const [data, setData] = useState<HealthSummaryData | null>(null);

  useEffect(() => {
    if (!token || !supabase) { setState("error"); return; }
    (async () => {
      const { data: row, error } = await supabase
        .from("export_tokens")
        .select("mode, expires_at, view_count, max_views, period_days, data_snapshot")
        .eq("token", token)
        .single<TokenRow>();

      if (error || !row || row.mode !== "health_summary") { setState("error"); return; }
      if (new Date(row.expires_at) < new Date()) { setState("expired"); return; }
      if (row.max_views != null && row.view_count >= row.max_views) { setState("expired"); return; }

      supabase.from("export_tokens").update({ view_count: row.view_count + 1 }).eq("token", token).then(() => {});

      const snapshot = row.data_snapshot;
      if (row.period_days) snapshot.periodDays = row.period_days;
      setData(snapshot);
      setState("ready");
    })();
  }, [token]);

  if (state === "loading") return <GateScreen icon={<Activity className="size-8 text-[#A9334D]" />} message="Loading health summary…" />;
  if (state === "expired") return <GateScreen icon={<Lock className="size-8 text-[#A9334D]" />} message="This summary link has expired." sub="Request a new summary from the Hemo app." />;
  if (state === "error" || !data) return <GateScreen icon={<Lock className="size-8 text-[#A9334D]" />} message="This link is invalid or no longer available." />;

  return <SummaryView data={data} />;
}

function GateScreen({ icon, message, sub }: { icon: React.ReactNode; message: string; sub?: string }) {
  return (
    <div className="min-h-screen bg-[#F8F4F0] flex flex-col items-center justify-center px-6">
      <div className="bg-white border border-[#F0E4E1] rounded-2xl p-10 max-w-sm w-full text-center shadow-sm">
        <div className="flex justify-center mb-4">{icon}</div>
        <p className="text-base font-semibold text-[#1A1A1A]">{message}</p>
        {sub && <p className="text-sm text-[#6B6B6B] mt-2">{sub}</p>}
      </div>
    </div>
  );
}

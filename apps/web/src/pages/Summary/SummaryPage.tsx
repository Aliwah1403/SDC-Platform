import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabase } from "@/lib/supabase";
import type { HealthSummaryData } from "@/components/pdfx/HealthSummaryDocument";
import SummaryView from "./_SummaryView";
import LinkGateScreen from "../_LinkGateScreen";

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

  if (state === "loading") return <LinkGateScreen variant="loading" />;
  if (state === "expired") return <LinkGateScreen variant="expired" />;
  if (state === "error" || !data) return <LinkGateScreen variant="unavailable" />;

  return <SummaryView data={data} />;
}

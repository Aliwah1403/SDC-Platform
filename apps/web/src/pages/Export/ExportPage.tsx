import { useEffect } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "@posthog/react";
import { supabase } from "@/lib/supabase";
import type { FullExportData } from "@/components/pdfx/FullExportDocument";
import ExportView from "./_ExportView";
import LinkGateScreen from "../_LinkGateScreen";

type TokenRow = {
  mode: string;
  expires_at: string;
  data_snapshot: FullExportData;
};

async function fetchExportToken(token: string): Promise<TokenRow> {
  const { data, error } = await supabase!
    .from("export_tokens")
    .select("mode, expires_at, data_snapshot")
    .eq("token", token)
    .single<TokenRow>();

  if (error || !data) throw new Error("not_found");
  if (data.mode !== "full_export") throw new Error("not_found");
  if (new Date(data.expires_at) < new Date()) throw new Error("expired");

  supabase!.rpc("record_export_view", { p_token: token }).then(() => {});
  return data;
}

export default function ExportPage() {
  const { token } = useParams<{ token: string }>();
  const posthog = usePostHog();

  const { data, error, isLoading } = useQuery({
    queryKey: ["export-token", token],
    queryFn: () => fetchExportToken(token!),
    enabled: !!token && !!supabase,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (data) posthog?.capture("export_link_viewed");
  }, [!!data]);

  if (isLoading) return <LinkGateScreen variant="loading" />;
  if (error?.message === "expired") return <LinkGateScreen variant="expired" />;
  if (error || !data) return <LinkGateScreen variant="unavailable" />;

  return (
    <ExportView
      data={data.data_snapshot}
      token={token}
      onPdfDownload={() => posthog?.capture("export_pdf_downloaded")}
    />
  );
}

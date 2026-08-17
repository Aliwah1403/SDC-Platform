import { useEffect } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicTokenSupabase } from "@/lib/supabase";
import type { EDCardData } from "./_EmergencyCardView";
import EmergencyCardView from "./_EmergencyCardView";
import LinkGateScreen from "../_LinkGateScreen";

async function fetchEdCardToken(token: string, tokenSupabase: SupabaseClient): Promise<EDCardData> {
  const { data, error } = await tokenSupabase
    .from("ed_card_tokens")
    .select("card_data, expires_at, is_active")
    .eq("token", token)
    .single<{ card_data: EDCardData; expires_at: string; is_active: boolean }>();

  if (error || !data) throw new Error("not_found");
  if (!data.is_active) throw new Error("unavailable");
  if (new Date(data.expires_at) < new Date()) throw new Error("expired");

  return data.card_data;
}

export default function EdCardPage() {
  const { token } = useParams<{ token: string }>();
  const tokenSupabase = getPublicTokenSupabase();
  const publicTokenEnv = typeof window !== "undefined" ? window.location.search : "";

  const { data, error, isLoading } = useQuery({
    queryKey: ["ed-card-token", token, publicTokenEnv],
    queryFn: () => fetchEdCardToken(token!, tokenSupabase!),
    enabled: !!token && !!tokenSupabase,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (data) document.title = `${data.patient.name.split(" ")[0]}'s Emergency Card · Hemo`;
  }, [data]);

  if (isLoading) return <LinkGateScreen variant="loading" />;
  if (error?.message === "expired")
    return (
      <LinkGateScreen
        variant="expired"
        sub="This emergency card has expired. Ask the patient to regenerate it from the Hemo app."
      />
    );
  if (error || !data) return <LinkGateScreen variant="unavailable" />;

  return <EmergencyCardView data={data} />;
}

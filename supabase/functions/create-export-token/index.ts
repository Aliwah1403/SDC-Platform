import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEB_BASE_URL = Deno.env.get("WEB_BASE_URL") ?? "https://hemo-scd.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ data: null, error: "Unauthorized" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Auth-scoped client to identify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ data: null, error: "Unauthorized" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { mode, date_range_start, date_range_end, period_days, expires_in_days, label, patient_note } = body;
    const ttlDays = (typeof expires_in_days === "number" && expires_in_days >= 1 && expires_in_days <= 90)
      ? expires_in_days
      : 7;

    if (!mode || !["full_export", "health_summary"].includes(mode)) {
      return new Response(
        JSON.stringify({ data: null, error: "mode must be full_export or health_summary" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (mode === "full_export" && (!date_range_start || !date_range_end)) {
      return new Response(
        JSON.stringify({ data: null, error: "date_range_start and date_range_end are required for full_export" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (mode === "health_summary" && (!period_days || ![7, 30, 60].includes(period_days))) {
      return new Response(
        JSON.stringify({ data: null, error: "period_days must be 7, 30, or 60 for health_summary" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Service-role client to fetch all data
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Enforce 5-active-summary quota server-side for health_summary mode
    if (mode === "health_summary") {
      const now = new Date().toISOString();
      const { count, error: countError } = await supabase
        .from("export_tokens")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mode", "health_summary")
        .eq("is_active", true)
        .gt("expires_at", now);

      if (countError) {
        console.error("quota check failed:", countError.message);
        return new Response(
          JSON.stringify({ data: null, error: "Internal server error" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }
      if ((count ?? 0) >= 5) {
        return new Response(
          JSON.stringify({ data: null, error: "Active summary limit reached. Revoke one to create a new one." }),
          { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }
    }

    // Determine date range
    const endDate: string = date_range_end ?? new Date().toISOString().split("T")[0];
    let startDate: string;
    if (mode === "full_export") {
      startDate = date_range_start;
    } else {
      const d = new Date();
      d.setDate(d.getDate() - (period_days - 1));
      startDate = d.toISOString().split("T")[0];
    }

    // Fetch all data in parallel
    const [
      profileResult,
      healthLogsResult,
      dailySummariesResult,
      medicationsResult,
      medLogsResult,
      streakResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, nickname, dob, scd_type, height, weight, preferred_hospital, blood_type, allergies")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("health_logs")
        .select("date, pain_level, body_locations, symptoms, mood, hydration, triggers, activities, notes, is_repaired")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("daily_summaries")
        .select("date, pain_level, hydration, mood, steps, sleep_hours, heart_rate, is_repaired")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("medications")
        .select("id, name, dosage, frequency, type, category, prescribed_by, start_date, is_active, notes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("medication_logs")
        .select("medication_id, date, taken_at")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("streaks")
        .select("current_streak, longest_streak, last_log_date, claimed_badges")
        .eq("user_id", user.id)
        .single(),
    ]);

    // Abort on unexpected query errors; allow PGRST116 (no rows) for single() selects
    const NO_ROWS = "PGRST116";
    for (const [name, result] of [
      ["healthLogs", healthLogsResult],
      ["dailySummaries", dailySummariesResult],
      ["medications", medicationsResult],
      ["medLogs", medLogsResult],
    ] as [string, { error: { message: string; code?: string } | null }][]) {
      if (result.error) {
        console.error(`${name} query failed:`, result.error);
        return new Response(JSON.stringify({ error: `Data fetch failed: ${name}` }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    for (const [name, result] of [
      ["profile", profileResult],
      ["streak", streakResult],
    ] as [string, { error: { message: string; code?: string } | null }][]) {
      if (result.error && result.error.code !== NO_ROWS) {
        console.error(`${name} query failed:`, result.error);
        return new Response(JSON.stringify({ error: `Data fetch failed: ${name}` }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    const profile = profileResult.data ?? {};
    const healthLogs = healthLogsResult.data ?? [];
    const dailySummaries = dailySummariesResult.data ?? [];
    const medications = medicationsResult.data ?? [];
    const medLogs = medLogsResult.data ?? [];
    const streak = streakResult.data ?? {};

    // Build medication adherence map: { medId: { taken: number, total: number } }
    const adherenceMap: Record<string, { taken: number; scheduled: number }> = {};
    for (const med of medications) {
      if (!med.is_active) continue;
      const takenCount = medLogs.filter((l) => l.medication_id === med.id).length;
      // Clamp the window to when the medication actually started
      const effectiveStart =
        med.start_date && med.start_date > startDate ? med.start_date : startDate;
      if (med.start_date && med.start_date > endDate) {
        adherenceMap[med.id] = { taken: takenCount, scheduled: 0 };
        continue;
      }
      const rangeDays = Math.ceil(
        (new Date(endDate).getTime() - new Date(effectiveStart).getTime()) / 86400000,
      ) + 1;
      let scheduledDays = rangeDays;
      if (med.frequency === "Twice daily") scheduledDays = rangeDays * 2;
      else if (med.frequency === "Three times daily") scheduledDays = rangeDays * 3;
      else if (med.frequency === "Weekly") scheduledDays = Math.ceil(rangeDays / 7);
      else if (med.frequency === "As Needed" || med.frequency === "As needed") scheduledDays = takenCount;
      adherenceMap[med.id] = { taken: takenCount, scheduled: scheduledDays };
    }

    // Compute simple averages for summary stats
    const logs = healthLogs.length > 0 ? healthLogs : dailySummaries;
    const avgOf = (arr: unknown[], key: string): number | null => {
      const vals = arr.map((r) => (r as Record<string, unknown>)[key]).filter((v) => v != null) as number[];
      return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };

    const stats = {
      totalDaysLogged: healthLogs.length,
      avgPain: avgOf(healthLogs.length > 0 ? healthLogs : dailySummaries, "pain_level"),
      avgHydration: avgOf(healthLogs.length > 0 ? healthLogs : dailySummaries, "hydration"),
      avgMood: avgOf(healthLogs.length > 0 ? healthLogs : dailySummaries, "mood"),
      avgSleep: avgOf(dailySummaries, "sleep_hours"),
      avgSteps: avgOf(dailySummaries, "steps"),
      avgHeartRate: avgOf(dailySummaries, "heart_rate"),
    };

    // Collect top symptoms and triggers
    const symptomCounts: Record<string, number> = {};
    const triggerCounts: Record<string, number> = {};
    for (const log of healthLogs) {
      for (const s of log.symptoms ?? []) symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
      for (const t of log.triggers ?? []) triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
    }
    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const dataSnapshot = {
      generatedAt: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      ...(mode === "health_summary" && patient_note && typeof patient_note === "string" && patient_note.trim()
        ? { patientNote: patient_note.trim().slice(0, 300) }
        : {}),
      profile,
      streak: {
        current: streak.current_streak ?? 0,
        longest: streak.longest_streak ?? 0,
        lastLogDate: streak.last_log_date ?? null,
        badgesEarned: Array.isArray(streak.claimed_badges) ? streak.claimed_badges.length : 0,
      },
      stats,
      topSymptoms,
      topTriggers,
      medications: medications.map((m) => ({
        ...m,
        adherence: adherenceMap[m.id] ?? null,
      })),
      healthLogs,
      dailySummaries,
      medLogs,
    };

    // Write token row
    const expiresAt = new Date(Date.now() + ttlDays * 86400 * 1000).toISOString();
    const { data: tokenRow, error: insertError } = await supabase
      .from("export_tokens")
      .insert({
        user_id: user.id,
        mode,
        date_range_start: mode === "full_export" ? startDate : null,
        date_range_end: mode === "full_export" ? endDate : null,
        period_days: mode === "health_summary" ? period_days : null,
        data_snapshot: dataSnapshot,
        expires_at: expiresAt,
        label: typeof label === "string" && label.trim() ? label.trim() : null,
      })
      .select("token")
      .single();

    if (insertError || !tokenRow) {
      console.error("insert error:", insertError?.message);
      return new Response(
        JSON.stringify({ data: null, error: "Failed to create export token" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const route = mode === "full_export" ? "export" : "summary";
    const url = `${WEB_BASE_URL}/${route}/${tokenRow.token}`;

    return new Response(
      JSON.stringify({ data: { token: tokenRow.token, url, expiresAt }, error: null }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-export-token error:", err instanceof Error ? err.message.slice(0, 200) : "unknown");
    return new Response(
      JSON.stringify({ data: null, error: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});

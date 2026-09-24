import { useEffect, useMemo } from "react";
import { usePostHog } from "posthog-react-native";
import StreakAchievementModal from "@/components/StreakAchievementModal";
import { useAppStore } from "@/store/appStore";
import {
  useStreakQuery,
  useClaimBadgeMutation,
} from "@/hooks/queries/useStreakQuery";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import { toLocalDateStr } from "@/utils/dateUtils";
import {
  getEarnedAchievements,
  normalizeAchievementId,
  toAchievementMilestone,
} from "@/utils/achievements";

/**
 * Keeps achievement detection and its full-screen celebration above the router,
 * so an earned achievement can be shown from any Hemo screen.
 */
export default function AchievementPresenter() {
  const posthog = usePostHog();
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: streak, isSuccess: streakLoaded } = useStreakQuery();
  const { data: medications = [] } = useMedicationsQuery();
  const { data: metricGoals } = useMetricGoalsQuery();
  const hydrationGoalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;

  const pendingMilestone = useAppStore((s) => s.pendingMilestone);
  const setPendingMilestone = useAppStore((s) => s.setPendingMilestone);
  const clearPendingMilestone = useAppStore((s) => s.clearPendingMilestone);
  const { mutate: saveClaimedBadges } = useClaimBadgeMutation();

  const healthStreak = streak?.currentStreak ?? 0;
  const claimedBadges = (streak?.claimedBadges ?? []).map((badge) =>
    normalizeAchievementId(badge != null && typeof badge === "object" ? badge.id : badge),
  );
  const totalEntries = healthData.length;
  const symptomsLogged = useMemo(
    () => healthData.reduce((sum, day) => sum + (day.symptoms?.length || 0), 0),
    [healthData],
  );
  const hydrationDays = useMemo(
    () => healthData.filter((day) => day.hydration >= hydrationGoalMl).length,
    [healthData, hydrationGoalMl],
  );
  const completedDays = useMemo(() => {
    const loggedDates = new Set(healthData.map((day) => day.date));
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return toLocalDateStr(date);
    }).filter((date) => loggedDates.has(date)).length;
  }, [healthData]);

  const hasLoggedToday = (() => {
    const todayStr = toLocalDateStr(new Date());
    const todayData = healthData.find((day) => day.date === todayStr);
    return !!(
      todayData &&
      (todayData.painLevel > 0 || todayData.mood > 0 || todayData.hydration > 0)
    );
  })();

  useEffect(() => {
    if (!streakLoaded) return;
    if (!hasLoggedToday) return;
    if (pendingMilestone) return;

    const earned = getEarnedAchievements({
      currentStreak: healthStreak,
      daysLogged: totalEntries,
      symptomsLogged,
      hydrationDays,
      completedDays,
      medicationsCount: medications.length,
      careTasksCompleted: 0,
      learningModulesCompleted: 0,
      repairsUsed: streak?.repairsUsed ?? 0,
    });

    const newBadge = earned.find((achievement) => !claimedBadges.includes(achievement.id));
    if (newBadge) {
      setPendingMilestone(toAchievementMilestone(newBadge));
    }
  }, [
    streakLoaded,
    hasLoggedToday,
    healthData,
    healthStreak,
    pendingMilestone,
    claimedBadges,
    totalEntries,
    symptomsLogged,
    hydrationDays,
    completedDays,
    medications.length,
    streak?.repairsUsed,
    setPendingMilestone,
  ]);

  return (
    <StreakAchievementModal
      visible={!!pendingMilestone}
      milestone={pendingMilestone}
      healthData={healthData}
      onClaim={() => {
        if (pendingMilestone) {
          posthog?.capture("milestone_claimed", {
            milestone_id: pendingMilestone.milestoneId,
            milestone_type: pendingMilestone.type,
            streak_days: pendingMilestone.streakCount ?? null,
          });
          const existing = streak?.claimedBadges ?? [];
          const alreadyIds = existing.map((badge) =>
            normalizeAchievementId(badge != null && typeof badge === "object" ? badge.id : badge),
          );
          const updated = alreadyIds.includes(pendingMilestone.milestoneId)
            ? existing
            : [
                ...existing,
                {
                  id: pendingMilestone.milestoneId,
                  unlockedAt: new Date().toISOString(),
                },
              ];
          saveClaimedBadges(updated);
        }
        clearPendingMilestone();
      }}
    />
  );
}

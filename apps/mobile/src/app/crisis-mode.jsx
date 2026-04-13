import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  ShieldAlert,
  ThumbsUp,
  Minus,
  TrendingUp,
  Phone,
  XCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { useEmergencyContactsQuery } from "@/hooks/queries/useEmergencyContactsQuery";
import {
  scheduleCrisisCheckIns,
  cancelCrisisNotifications,
  scheduleEscalationAlert,
} from "@/utils/crisisNotifications";
import { fonts } from "@/utils/fonts";

// ── Escalation step definitions ────────────────────────────────────────────────

const ESCALATION_STEPS = {
  1: {
    label: "MILD",
    painRange: "Pain 1–4",
    color: "#A9334D",
    border: "#A9334D",
    description:
      "You're in the early stages of a crisis. Follow these steps carefully before pain escalates.",
    actions: [
      "Rest in a comfortable, warm position",
      "Increase fluid intake — aim for 2–3 litres today",
      "Take your prescribed oral pain medication now",
      "Apply a heat pack to painful areas",
      "Call your primary emergency contact to let them know",
      "Avoid cold temperatures and physical exertion",
    ],
  },
  2: {
    label: "MODERATE",
    painRange: "Pain 5–7",
    color: "#781D11",
    border: "#781D11",
    description:
      "Pain is increasing. You should be heading to hospital now — do not wait.",
    actions: [
      "Proceed to your preferred hospital or A&E immediately",
      "Request IV fluids and IV pain management on arrival",
      "Bring this crisis plan and your medication list",
      "Alert your care team contacts now",
      "Do NOT drive yourself — arrange transport",
      "Tell medical staff your SCD type and blood type on arrival",
    ],
  },
  3: {
    label: "SEVERE",
    painRange: "Pain 8–10+",
    color: "#DC2626",
    border: "#DC2626",
    description:
      "This is a medical emergency. Call 999 / 911 now. Your care team is being alerted.",
    actions: [
      "Call 999 / 911 immediately — do not wait",
      "Stay still, stay warm, and breathe steadily",
      "Your care team has been alerted via SMS",
      "Tell emergency services you have sickle cell disease",
      "Mention any fever, chest pain, or stroke symptoms",
      "Do not eat or drink until evaluated by a doctor",
    ],
  },
};

// ── Timer helper ────────────────────────────────────────────────────────────────

function useElapsedTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setElapsed(seconds);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Main Screen ─────────────────────────────────────────────────────────────────

export default function CrisisModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const crisisMode = useAppStore((s) => s.crisisMode);
  const crisisPlan = useAppStore((s) => s.crisisPlan);
  const nickname = useAppStore((s) => s.onboardingData?.nickname ?? "");
  const startCrisisMode = useAppStore((s) => s.startCrisisMode);
  const endCrisisMode = useAppStore((s) => s.endCrisisMode);
  const recordCrisisCheckIn = useAppStore((s) => s.recordCrisisCheckIn);
  const addCrisisAlert = useAppStore((s) => s.addCrisisAlert);
  const setCrisisNotificationIds = useAppStore((s) => s.setCrisisNotificationIds);

  const { data: contacts = [] } = useEmergencyContactsQuery();

  const alertedRef = useRef(false);
  const elapsed = useElapsedTimer(crisisMode.startedAt);

  useEffect(() => {
    if (!crisisMode.isActive) {
      startCrisisMode(0);
    }
  }, []);

  useEffect(() => {
    if (crisisMode.isActive && crisisMode.scheduledNotificationIds.length === 0) {
      scheduleCrisisCheckIns(30).then((ids) => {
        if (ids.length > 0) setCrisisNotificationIds(ids);
      });
    }
  }, [crisisMode.isActive]);

  useEffect(() => {
    if (crisisMode.currentStep === 3 && !alertedRef.current && contacts.length > 0) {
      alertedRef.current = true;
      contacts.forEach((contact) => {
        const body = encodeURIComponent(
          `[Hemo SCD] ${nickname || "Your contact"} is experiencing a severe sickle cell crisis (Step 3). Please check in immediately or assist them to emergency services.`
        );
        Linking.openURL(`sms:${contact.phone}?body=${body}`).catch(() => {});
        addCrisisAlert(contact.id);
      });
    }
  }, [crisisMode.currentStep]);

  const handleCheckIn = useCallback(
    async (response) => {
      const prevStep = crisisMode.currentStep;
      recordCrisisCheckIn(response);
      if (response === "worse" && prevStep < 3) {
        await scheduleEscalationAlert(prevStep + 1);
      }
    },
    [crisisMode.currentStep, recordCrisisCheckIn]
  );

  const handleAlertTeam = useCallback(() => {
    contacts.forEach((contact) => {
      const body = encodeURIComponent(
        `[Hemo SCD] ${nickname || "Your contact"} is experiencing a sickle cell crisis (Step ${crisisMode.currentStep}). Please check in or assist them to get help.`
      );
      Linking.openURL(`sms:${contact.phone}?body=${body}`).catch(() => {});
      addCrisisAlert(contact.id);
    });
  }, [contacts, nickname, crisisMode.currentStep, addCrisisAlert]);

  const handleEndCrisis = useCallback(async () => {
    await cancelCrisisNotifications(crisisMode.scheduledNotificationIds);
    endCrisisMode();
    router.back();
  }, [crisisMode.scheduledNotificationIds, endCrisisMode, router]);

  const stepData = ESCALATION_STEPS[crisisMode.currentStep] ?? ESCALATION_STEPS[1];
  const lastCheckIn = crisisMode.checkInHistory[crisisMode.checkInHistory.length - 1] ?? null;
  const alreadyAlerted = crisisMode.alertsSent.length > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <MotiView
          from={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 100 }}
          style={styles.activeBadge}
        >
          <ShieldAlert size={13} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.activeBadgeText}>CRISIS MODE ACTIVE</Text>
        </MotiView>

        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{elapsed}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step card */}
        <MotiView
          key={crisisMode.currentStep}
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          style={[styles.stepCard, { borderLeftColor: stepData.border }]}
        >
          <View style={styles.stepBadgeRow}>
            <View style={[styles.stepBadge, { backgroundColor: stepData.color }]}>
              <Text style={styles.stepBadgeText}>STEP {crisisMode.currentStep}</Text>
            </View>
            <Text style={[styles.stepLabel, { color: stepData.color }]}>{stepData.label}</Text>
            <Text style={styles.stepPainRange}>{stepData.painRange}</Text>
          </View>
          <Text style={styles.stepDescription}>{stepData.description}</Text>
        </MotiView>

        {/* Step 3 auto-alert banner */}
        {crisisMode.currentStep === 3 && (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 16, stiffness: 80 }}
            style={styles.alertBanner}
          >
            <CheckCircle2 size={16} color="#DC2626" strokeWidth={2.5} />
            <Text style={styles.alertBannerText}>
              Care team alerted via SMS. Emergency services should be called now.
            </Text>
          </MotiView>
        )}

        {/* Actions list */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>What to do now</Text>
          {stepData.actions.map((action, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={[styles.actionNumber, { backgroundColor: stepData.color }]}>
                <Text style={styles.actionNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>

        {/* Check-in */}
        <View style={styles.checkInCard}>
          <Text style={styles.checkInTitle}>How are you feeling now?</Text>
          {lastCheckIn && (
            <Text style={styles.checkInLast}>
              Last update:{" "}
              <Text style={{ color: "#09332C", fontFamily: fonts.medium }}>
                {lastCheckIn.response === "better"
                  ? "Feeling better"
                  : lastCheckIn.response === "same"
                  ? "About the same"
                  : "Getting worse"}
              </Text>
            </Text>
          )}
          <View style={styles.checkInButtons}>
            <Pressable
              onPress={() => handleCheckIn("better")}
              style={({ pressed }) => [styles.checkInBtn, styles.checkInBtnBetter, pressed && { opacity: 0.8 }]}
            >
              <ThumbsUp size={16} color="#09332C" strokeWidth={2} />
              <Text style={[styles.checkInBtnText, { color: "#09332C" }]}>Better</Text>
            </Pressable>
            <Pressable
              onPress={() => handleCheckIn("same")}
              style={({ pressed }) => [styles.checkInBtn, styles.checkInBtnSame, pressed && { opacity: 0.8 }]}
            >
              <Minus size={16} color="rgba(9,51,44,0.6)" strokeWidth={2.5} />
              <Text style={[styles.checkInBtnText, { color: "rgba(9,51,44,0.6)" }]}>Same</Text>
            </Pressable>
            <Pressable
              onPress={() => handleCheckIn("worse")}
              style={({ pressed }) => [styles.checkInBtn, styles.checkInBtnWorse, pressed && { opacity: 0.8 }]}
            >
              <TrendingUp size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.checkInBtnText}>Worse</Text>
            </Pressable>
          </View>
        </View>

        {/* Alert Care Team */}
        {contacts.length > 0 && (
          <Pressable
            onPress={handleAlertTeam}
            style={({ pressed }) => [styles.alertTeamBtn, pressed && { opacity: 0.85 }]}
          >
            <Phone size={18} color="#F8E9E7" strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alertTeamTitle}>
                {alreadyAlerted ? "Alert Care Team Again" : "Alert Care Team"}
              </Text>
              <Text style={styles.alertTeamSubtitle}>
                Sends SMS to {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
                {alreadyAlerted ? " (already alerted)" : ""}
              </Text>
            </View>
          </Pressable>
        )}

        {contacts.length === 0 && (
          <View style={[styles.alertTeamBtn, { backgroundColor: "rgba(169,51,77,0.4)" }]}>
            <AlertTriangle size={18} color="#F8E9E7" strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alertTeamTitle}>No contacts added</Text>
              <Text style={styles.alertTeamSubtitle}>
                Add contacts in Care Team to enable SMS alerts
              </Text>
            </View>
          </View>
        )}

        {/* Medical info reminder */}
        {(crisisPlan.bloodType || crisisPlan.allergies.length > 0) && (
          <View style={styles.medInfoCard}>
            <Text style={styles.medInfoTitle}>Show this to medical staff</Text>
            {crisisPlan.bloodType && (
              <Text style={styles.medInfoLine}>
                Blood type:{" "}
                <Text style={styles.medInfoValue}>{crisisPlan.bloodType}</Text>
              </Text>
            )}
            {crisisPlan.allergies.length > 0 && (
              <Text style={styles.medInfoLine}>
                Allergies:{" "}
                <Text style={styles.medInfoValue}>{crisisPlan.allergies.join(", ")}</Text>
              </Text>
            )}
          </View>
        )}

        {/* End Crisis */}
        <Pressable
          onPress={handleEndCrisis}
          style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.75 }]}
        >
          <XCircle size={18} color="rgba(248,233,231,0.6)" strokeWidth={2} />
          <Text style={styles.endBtnText}>I'm feeling better — End Crisis</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#781D11",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  timerBadge: {
    backgroundColor: "rgba(248,233,231,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.15)",
  },
  timerText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "rgba(248,233,231,0.8)",
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  // ── Step card ──────────────────────────────────────────────────────
  stepCard: {
    backgroundColor: "#F8E9E7",
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    gap: 10,
  },
  stepBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  stepBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  stepLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  stepPainRange: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(9,51,44,0.5)",
  },
  stepDescription: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.75)",
    lineHeight: 20,
  },
  // ── Alert banner ───────────────────────────────────────────────────
  alertBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F8E9E7",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#DC2626",
  },
  alertBannerText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#09332C",
    flex: 1,
    lineHeight: 19,
  },
  // ── Actions card ───────────────────────────────────────────────────
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  actionsTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "rgba(9,51,44,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  actionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  actionNumberText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#FFFFFF",
  },
  actionText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#09332C",
    flex: 1,
    lineHeight: 20,
  },
  // ── Check-in card ──────────────────────────────────────────────────
  checkInCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  checkInTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#09332C",
  },
  checkInLast: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(9,51,44,0.45)",
    marginTop: -4,
  },
  checkInButtons: {
    flexDirection: "row",
    gap: 8,
  },
  checkInBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
  },
  checkInBtnBetter: {
    backgroundColor: "#F8E9E7",
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.15)",
  },
  checkInBtnSame: {
    backgroundColor: "#F8F4F0",
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.1)",
  },
  checkInBtnWorse: {
    backgroundColor: "#DC2626",
  },
  checkInBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  // ── Alert team button ──────────────────────────────────────────────
  alertTeamBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A9334D",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#A9334D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  alertTeamTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#F8E9E7",
    marginBottom: 2,
  },
  alertTeamSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(248,233,231,0.7)",
  },
  // ── Medical info card ──────────────────────────────────────────────
  medInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#A9334D",
  },
  medInfoTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "rgba(9,51,44,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  medInfoLine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.65)",
    lineHeight: 20,
  },
  medInfoValue: {
    fontFamily: fonts.semibold,
    color: "#09332C",
  },
  // ── End button ─────────────────────────────────────────────────────
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(248,233,231,0.2)",
    marginTop: 4,
  },
  endBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: "rgba(248,233,231,0.7)",
  },
});

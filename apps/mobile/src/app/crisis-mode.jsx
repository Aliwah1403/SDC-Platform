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
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import {
  ShieldAlert,
  ThumbsUp,
  Minus,
  TrendingUp,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Clock,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { useEmergencyContactsQuery } from "@/hooks/queries/useEmergencyContactsQuery";
import { useSavedFacilitiesQuery } from "@/hooks/queries/useSavedFacilitiesQuery";
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

function painLevelToStep(pain) {
  if (pain <= 4) return 1;
  if (pain <= 7) return 2;
  return 3;
}

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

// ── Location helper ─────────────────────────────────────────────────────────────

async function getLocationString() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = loc.coords;
    return `https://maps.google.com/?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  } catch {
    return null;
  }
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
  const escalateCrisis = useAppStore((s) => s.escalateCrisis);
  const deescalateCrisis = useAppStore((s) => s.deescalateCrisis);
  const addCrisisAlert = useAppStore((s) => s.addCrisisAlert);
  const setCrisisNotificationIds = useAppStore((s) => s.setCrisisNotificationIds);

  const { data: contacts = [] } = useEmergencyContactsQuery();
  const { data: savedFacilities = [] } = useSavedFacilitiesQuery();
  const preferredHospital = savedFacilities[0] ?? null;

  const alertedRef = useRef(false);
  const elapsed = useElapsedTimer(crisisMode.startedAt);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [consecutiveBetter, setConsecutiveBetter] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const [painSliderOpen, setPainSliderOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(crisisMode.initialPainLevel ?? 0);
  const [painSuggestion, setPainSuggestion] = useState(null); // { newStep, pain }

  const [historyOpen, setHistoryOpen] = useState(false);

  // ── Init ───────────────────────────────────────────────────────────────────
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

  // Step 3 auto-alert
  useEffect(() => {
    if (crisisMode.currentStep === 3 && !alertedRef.current && contacts.length > 0) {
      alertedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      sendAlertsToContacts(contacts, nickname, 3);
    }
  }, [crisisMode.currentStep]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function sendAlertsToContacts(contactList, name, step) {
    const locString = await getLocationString();
    contactList.forEach((contact) => {
      let body = `[Hemo SCD] ${name || "Your contact"} is experiencing a sickle cell crisis (Step ${step}).`;
      if (step === 3) {
        body += " Please contact emergency services or check in immediately.";
      } else {
        body += " Please check in or assist them to get help.";
      }
      if (locString) body += `\nCurrent location: ${locString}`;
      Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(body)}`).catch(() => {});
      addCrisisAlert(contact.id);
    });
  }

  const handleCheckIn = useCallback(
    async (response) => {
      if (response === "better") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newCount = consecutiveBetter + 1;
        setConsecutiveBetter(newCount);
        recordCrisisCheckIn("better");
        if (newCount >= 2 && crisisMode.currentStep > 1) {
          deescalateCrisis();
        }
        if (newCount >= 2) {
          setShowEndConfirm(true);
        }
      } else if (response === "same") {
        setConsecutiveBetter(0);
        recordCrisisCheckIn("same");
      } else {
        // worse
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setConsecutiveBetter(0);
        const prevStep = crisisMode.currentStep;
        recordCrisisCheckIn("worse");
        if (prevStep < 3) {
          await scheduleEscalationAlert(prevStep + 1);
        }
      }
    },
    [consecutiveBetter, crisisMode.currentStep, recordCrisisCheckIn, deescalateCrisis]
  );

  const handleAlertTeam = useCallback(async () => {
    await sendAlertsToContacts(contacts, nickname, crisisMode.currentStep);
  }, [contacts, nickname, crisisMode.currentStep]);

  const handleEndCrisis = useCallback(async () => {
    await cancelCrisisNotifications(crisisMode.scheduledNotificationIds);
    endCrisisMode();
    router.back();
  }, [crisisMode.scheduledNotificationIds, endCrisisMode, router]);

  const handleConfirmPainLevel = useCallback(() => {
    if (!painSuggestion) return;
    const { newStep } = painSuggestion;
    if (newStep > crisisMode.currentStep) escalateCrisis();
    else if (newStep < crisisMode.currentStep) deescalateCrisis();
    setPainSuggestion(null);
    setPainSliderOpen(false);
  }, [painSuggestion, crisisMode.currentStep, escalateCrisis, deescalateCrisis]);

  const handleSliderChange = useCallback(
    (val) => {
      const rounded = Math.round(val);
      setSliderValue(rounded);
      const suggested = painLevelToStep(rounded);
      if (suggested !== crisisMode.currentStep) {
        setPainSuggestion({ newStep: suggested, pain: rounded });
      } else {
        setPainSuggestion(null);
      }
    },
    [crisisMode.currentStep]
  );

  const handleNavigateToHospital = useCallback(() => {
    if (!preferredHospital) return;
    const q = encodeURIComponent(preferredHospital.address ?? preferredHospital.name);
    const iosUrl = `maps://?q=${q}`;
    const fallback = `https://maps.google.com/?q=${q}`;
    Linking.canOpenURL(iosUrl).then((can) => Linking.openURL(can ? iosUrl : fallback)).catch(() => {});
  }, [preferredHospital]);

  const stepData = ESCALATION_STEPS[crisisMode.currentStep] ?? ESCALATION_STEPS[1];
  const alreadyAlerted = crisisMode.alertsSent.length > 0;
  const checkInHistory = [...(crisisMode.checkInHistory ?? [])].reverse();

  // ── Response pill colour ────────────────────────────────────────────────────
  function responseColor(r) {
    if (r === "better") return "#A9334D";
    if (r === "worse") return "#DC2626";
    return "rgba(9,51,44,0.35)";
  }
  function responseLabel(r) {
    if (r === "better") return "Better";
    if (r === "worse") return "Worse";
    return "Same";
  }
  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

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
          style={[styles.stepCard, { borderLeftColor: stepData.color }]}
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
          <Text style={styles.sectionTitle}>What to do now</Text>
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
        <View style={styles.card}>
          <Text style={styles.checkInTitle}>How are you feeling now?</Text>
          {checkInHistory.length > 0 && (
            <Text style={styles.checkInLast}>
              Last:{" "}
              <Text style={{ color: responseColor(checkInHistory[0].response), fontFamily: fonts.medium }}>
                {responseLabel(checkInHistory[0].response)}
              </Text>
              {"  "}
              <Text style={{ color: "rgba(248,233,231,0.35)" }}>{formatTime(checkInHistory[0].timestamp)}</Text>
            </Text>
          )}
          <View style={styles.checkInButtons}>
            <Pressable
              onPress={() => handleCheckIn("better")}
              style={({ pressed }) => [styles.checkInBtn, styles.checkInBtnBetter, pressed && { opacity: 0.8 }]}
            >
              <ThumbsUp size={16} color="#A9334D" strokeWidth={2} />
              <Text style={[styles.checkInBtnText, { color: "#A9334D" }]}>Better</Text>
            </Pressable>
            <Pressable
              onPress={() => handleCheckIn("same")}
              style={({ pressed }) => [styles.checkInBtn, styles.checkInBtnSame, pressed && { opacity: 0.8 }]}
            >
              <Minus size={16} color="rgba(248,233,231,0.5)" strokeWidth={2.5} />
              <Text style={[styles.checkInBtnText, { color: "rgba(248,233,231,0.5)" }]}>Same</Text>
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

        {/* Feeling better confirmation card */}
        {showEndConfirm && (
          <MotiView
            from={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 100 }}
            style={styles.confirmCard}
          >
            <Text style={styles.confirmTitle}>You're feeling better</Text>
            <Text style={styles.confirmBody}>
              {crisisMode.currentStep > 1
                ? `Crisis de-escalated to Step ${crisisMode.currentStep}. Would you like to keep monitoring or end crisis mode?`
                : "Would you like to keep monitoring or end crisis mode?"}
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                onPress={() => {
                  setShowEndConfirm(false);
                  setConsecutiveBetter(0);
                }}
                style={({ pressed }) => [styles.confirmBtnOutline, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.confirmBtnOutlineText}>Keep monitoring</Text>
              </Pressable>
              <Pressable
                onPress={handleEndCrisis}
                style={({ pressed }) => [styles.confirmBtnFill, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.confirmBtnFillText}>End Crisis</Text>
              </Pressable>
            </View>
          </MotiView>
        )}

        {/* Pain re-assessment */}
        <Pressable
          onPress={() => setPainSliderOpen((v) => !v)}
          style={styles.collapseHeader}
        >
          <Text style={styles.collapseTitle}>Update pain level</Text>
          <ChevronDown
            size={16}
            color="rgba(248,233,231,0.55)"
            strokeWidth={2}
            style={{ transform: [{ rotate: painSliderOpen ? "180deg" : "0deg" }] }}
          />
        </Pressable>
        {painSliderOpen && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 200 }}
            style={styles.card}
          >
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>0</Text>
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={sliderValue}
                onValueChange={handleSliderChange}
                minimumTrackTintColor={stepData.color}
                maximumTrackTintColor="rgba(248,233,231,0.15)"
                thumbTintColor={stepData.color}
              />
              <Text style={styles.sliderLabel}>10</Text>
              <View style={[styles.sliderValueBadge, { backgroundColor: stepData.color }]}>
                <Text style={styles.sliderValueText}>{sliderValue}</Text>
              </View>
            </View>
            {painSuggestion ? (
              <View style={styles.painSuggestionRow}>
                <Text style={styles.painSuggestionText}>
                  Pain {painSuggestion.pain} suggests{" "}
                  <Text style={{ fontFamily: fonts.bold, color: ESCALATION_STEPS[painSuggestion.newStep].color }}>
                    Step {painSuggestion.newStep} — {ESCALATION_STEPS[painSuggestion.newStep].label}
                  </Text>
                </Text>
                <View style={styles.painSuggestionButtons}>
                  <Pressable
                    onPress={() => setPainSuggestion(null)}
                    style={({ pressed }) => [styles.painSuggBtnCancel, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.painSuggBtnCancelText}>Ignore</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmPainLevel}
                    style={({ pressed }) => [
                      styles.painSuggBtnConfirm,
                      { backgroundColor: ESCALATION_STEPS[painSuggestion.newStep].color },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.painSuggBtnConfirmText}>Update step</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={styles.sliderHint}>
                Current step matches your pain level. Drag to reassess.
              </Text>
            )}
          </MotiView>
        )}

        {/* Check-in history */}
        <Pressable
          onPress={() => setHistoryOpen((v) => !v)}
          style={styles.collapseHeader}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Clock size={14} color="rgba(248,233,231,0.55)" strokeWidth={2} />
            <Text style={styles.collapseTitle}>
              Check-in history{checkInHistory.length > 0 ? ` (${checkInHistory.length})` : ""}
            </Text>
          </View>
          <ChevronDown
            size={16}
            color="rgba(248,233,231,0.55)"
            strokeWidth={2}
            style={{ transform: [{ rotate: historyOpen ? "180deg" : "0deg" }] }}
          />
        </Pressable>
        {historyOpen && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 200 }}
            style={styles.card}
          >
            {checkInHistory.length === 0 ? (
              <Text style={styles.historyEmpty}>No check-ins recorded yet.</Text>
            ) : (
              checkInHistory.map((entry, i) => (
                <View key={i} style={[styles.historyRow, i < checkInHistory.length - 1 && styles.historyDivider]}>
                  <View style={[styles.historyPill, { backgroundColor: responseColor(entry.response) + "22" }]}>
                    <Text style={[styles.historyPillText, { color: responseColor(entry.response) }]}>
                      {responseLabel(entry.response)}
                    </Text>
                  </View>
                  <Text style={styles.historyStep}>Step {entry.step}</Text>
                  <Text style={styles.historyTime}>{formatTime(entry.timestamp)}</Text>
                </View>
              ))
            )}
          </MotiView>
        )}

        {/* Alert Care Team */}
        {contacts.length > 0 ? (
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
                Sends SMS + location to {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
                {alreadyAlerted ? " (already alerted)" : ""}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.alertTeamBtn, { backgroundColor: "rgba(169,51,77,0.3)" }]}>
            <AlertTriangle size={18} color="#F8E9E7" strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alertTeamTitle}>No contacts added</Text>
              <Text style={styles.alertTeamSubtitle}>
                Add contacts in Care Team to enable SMS alerts
              </Text>
            </View>
          </View>
        )}

        {/* Medical info + hospital navigation */}
        {(crisisPlan.bloodType || crisisPlan.allergies.length > 0 || preferredHospital) && (
          <View style={styles.medInfoCard}>
            {(crisisPlan.bloodType || crisisPlan.allergies.length > 0) && (
              <>
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
              </>
            )}
            {preferredHospital && (
              <>
                {(crisisPlan.bloodType || crisisPlan.allergies.length > 0) && (
                  <View style={styles.medInfoDivider} />
                )}
                <Pressable
                  onPress={handleNavigateToHospital}
                  style={({ pressed }) => [styles.navRow, pressed && { opacity: 0.75 }]}
                >
                  <MapPin size={15} color="#A9334D" strokeWidth={2.5} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.navTitle}>Navigate to {preferredHospital.name}</Text>
                    {preferredHospital.address ? (
                      <Text style={styles.navSubtitle}>{preferredHospital.address}</Text>
                    ) : null}
                  </View>
                  <ChevronDown
                    size={14}
                    color="#A9334D"
                    strokeWidth={2.5}
                    style={{ transform: [{ rotate: "-90deg" }] }}
                  />
                </Pressable>
              </>
            )}
          </View>
        )}
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
    backgroundColor: "rgba(248,233,231,0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.18)",
  },
  timerText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "rgba(248,233,231,0.8)",
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: 20,
    gap: 10,
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
  // ── Generic card ───────────────────────────────────────────────────
  card: {
    backgroundColor: "rgba(248,233,231,0.08)",
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.1)",
  },
  // ── Actions card ───────────────────────────────────────────────────
  actionsCard: {
    backgroundColor: "rgba(248,233,231,0.08)",
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.1)",
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "rgba(248,233,231,0.45)",
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
    color: "rgba(248,233,231,0.85)",
    flex: 1,
    lineHeight: 20,
  },
  // ── Check-in ───────────────────────────────────────────────────────
  checkInTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#F8E9E7",
  },
  checkInLast: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(248,233,231,0.45)",
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
  },
  checkInBtnSame: {
    backgroundColor: "rgba(248,233,231,0.1)",
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.15)",
  },
  checkInBtnWorse: {
    backgroundColor: "#DC2626",
  },
  checkInBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  // ── End confirm card ───────────────────────────────────────────────
  confirmCard: {
    backgroundColor: "#F8E9E7",
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  confirmTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: "#09332C",
  },
  confirmBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.7)",
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  confirmBtnOutline: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.25)",
    alignItems: "center",
  },
  confirmBtnOutlineText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#09332C",
  },
  confirmBtnFill: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "#A9334D",
    alignItems: "center",
  },
  confirmBtnFillText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  // ── Collapsible row ────────────────────────────────────────────────
  collapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  collapseTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "rgba(248,233,231,0.55)",
  },
  // ── Pain slider ────────────────────────────────────────────────────
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sliderLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(248,233,231,0.4)",
    width: 16,
    textAlign: "center",
  },
  sliderValueBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderValueText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  sliderHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(248,233,231,0.35)",
    marginTop: -4,
  },
  painSuggestionRow: {
    gap: 12,
  },
  painSuggestionText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(248,233,231,0.8)",
    lineHeight: 20,
  },
  painSuggestionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  painSuggBtnCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.2)",
    alignItems: "center",
  },
  painSuggBtnCancelText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "rgba(248,233,231,0.55)",
  },
  painSuggBtnConfirm: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  painSuggBtnConfirmText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  // ── Check-in history ───────────────────────────────────────────────
  historyEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(248,233,231,0.35)",
    textAlign: "center",
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  historyDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(248,233,231,0.08)",
  },
  historyPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  historyPillText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  historyStep: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(248,233,231,0.45)",
    flex: 1,
  },
  historyTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(248,233,231,0.3)",
  },
  // ── Alert team ─────────────────────────────────────────────────────
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
  // ── Med info + navigation card ──────────────────────────────────────
  medInfoCard: {
    backgroundColor: "rgba(248,233,231,0.08)",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(248,233,231,0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#A9334D",
  },
  medInfoTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "rgba(248,233,231,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  medInfoLine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(248,233,231,0.65)",
    lineHeight: 20,
  },
  medInfoValue: {
    fontFamily: fonts.semibold,
    color: "#F8E9E7",
  },
  medInfoDivider: {
    height: 1,
    backgroundColor: "rgba(248,233,231,0.1)",
    marginVertical: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#F8E9E7",
  },
  navSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(248,233,231,0.45)",
    marginTop: 1,
  },
});

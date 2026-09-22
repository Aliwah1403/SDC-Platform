import React from "react";
import { Alert } from "react-native";
import {
  Droplets,
  Footprints,
  HeartPulse,
  NotebookPen,
} from "lucide-react-native";
import { usePostHog } from "posthog-react-native";

import HealthSyncSheet from "@/components/HealthSyncSheet";
import {
  fetchHealthKitRange,
  requestHKAuthorization,
  setupBackgroundDelivery,
} from "@/services/healthKitService";
import { useAppStore } from "@/store/appStore";

const APPLE_HEALTH_ROWS = [
  {
    key: "activity",
    icon: Footprints,
    color: "#059669",
    text: "Steps, workouts and sleep can appear alongside your Hemo check-ins.",
  },
  {
    key: "vitals",
    icon: HeartPulse,
    color: "#EF4444",
    text: "Heart rate, blood oxygen, temperature and breathing rate sync when available.",
  },
  {
    key: "hydration",
    icon: Droplets,
    color: "#3B82F6",
    text: "Hydration and body measurements logged in Hemo can be saved to Apple Health.",
  },
  {
    key: "wellbeing",
    icon: NotebookPen,
    color: "#A9334D",
    text: "Supported symptoms and wellbeing entries follow the preferences you control.",
  },
];

export default function AppleHealthModal({ visible, onClose, blurTarget }) {
  const posthog = usePostHog();
  const {
    setHealthKitConnected,
    setHealthKitRange,
    mergeHealthKitDay,
    healthKitPreferences,
  } = useAppStore();

  const handleConnect = async () => {
    try {
      const granted = await requestHKAuthorization();
      if (!granted) {
        posthog?.capture("health_integration_permission_denied", {
          provider: "apple_health",
        });
        return false;
      }

      setHealthKitConnected(true);
      posthog?.setPersonProperties({ apple_health_connected: true });
      posthog?.capture("health_integration_connected", {
        provider: "apple_health",
      });

      const rangeData = await fetchHealthKitRange(30, healthKitPreferences);
      setHealthKitRange(rangeData);
      await setupBackgroundDelivery(
        (date, metrics) => mergeHealthKitDay(date, metrics),
        healthKitPreferences,
      );
      return true;
    } catch (error) {
      posthog?.capture("health_integration_connection_failed", {
        provider: "apple_health",
      });
      console.error("[AppleHealth] connect error", error);
      Alert.alert(
        "Couldn't connect",
        "We couldn't connect to Apple Health. Please try again.",
      );
      return false;
    }
  };

  return (
    <HealthSyncSheet
      visible={visible}
      onDismiss={onClose}
      onConnect={handleConnect}
      provider="apple_health"
      title="Apple Health Sync"
      caption="Connect Apple Health to bring useful health context into Hemo and keep supported Hemo entries in sync."
      providerIcon={require("../../assets/images/icon-apple-health.png")}
      providerIconSize={58}
      rows={APPLE_HEALTH_ROWS}
      connectLabel="Connect Apple Health"
      blurTarget={blurTarget}
    />
  );
}

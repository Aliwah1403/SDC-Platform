import React from "react";
import { Alert, Linking } from "react-native";
import {
  Activity,
  Droplets,
  Footprints,
  HeartPulse,
} from "lucide-react-native";
import { usePostHog } from "posthog-react-native";

import HealthSyncSheet from "@/components/HealthSyncSheet";
import {
  fetchHealthKitRange,
  getHealthConnectStatus,
  openHealthConnectSettings,
  requestHKAuthorization,
  setupBackgroundDelivery,
} from "@/services/healthConnectService";
import { useAppStore } from "@/store/appStore";

const HC_PLAY_STORE_URL =
  "market://details?id=com.google.android.apps.healthdata";

const HEALTH_CONNECT_ROWS = [
  {
    key: "activity",
    icon: Footprints,
    color: "#059669",
    text: "Steps, exercise and sleep can appear alongside your Hemo check-ins.",
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
    text: "Hydration and body measurements logged in Hemo can be saved to Health Connect.",
  },
  {
    key: "control",
    icon: Activity,
    color: "#4285F4",
    text: "You can change what Hemo reads and writes at any time.",
  },
];

export default function HealthConnectModal({ visible, onClose, blurTarget }) {
  const posthog = usePostHog();
  const {
    setHealthConnectConnected,
    setHealthConnectRange,
    mergeHealthConnectDay,
    healthConnectPreferences,
  } = useAppStore();

  const handleConnect = async () => {
    try {
      const status = await getHealthConnectStatus();
      if (status !== "available") {
        posthog?.capture("health_integration_unavailable", {
          provider: "health_connect",
          status,
        });
        Alert.alert(
          status === "update_required"
            ? "Update Health Connect"
            : "Install Health Connect",
          status === "update_required"
            ? "Your version of Health Connect is out of date. Please update it to sync your health data with Hemo."
            : "Health Connect isn't set up on this device yet. Install it from the Play Store to sync your health data with Hemo.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: status === "update_required" ? "Update" : "Install",
              onPress: () => Linking.openURL(HC_PLAY_STORE_URL).catch(() => {}),
            },
          ],
        );
        return false;
      }

      const granted = await requestHKAuthorization();
      if (!granted) {
        posthog?.capture("health_integration_permission_denied", {
          provider: "health_connect",
        });
        Alert.alert(
          "Allow access in Health Connect",
          "Health Connect didn't show the permission screen. This usually means it has stopped asking after earlier requests were dismissed. Grant Hemo access manually in Health Connect settings, then come back and tap Connect Health Connect.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Open Health Connect",
              onPress: () => openHealthConnectSettings(),
            },
          ],
        );
        return false;
      }

      setHealthConnectConnected(true);
      posthog?.setPersonProperties({ health_connect_connected: true });
      posthog?.capture("health_integration_connected", {
        provider: "health_connect",
      });

      const rangeData = await fetchHealthKitRange(30, healthConnectPreferences);
      setHealthConnectRange(rangeData);
      setupBackgroundDelivery(
        (date, metrics) => mergeHealthConnectDay(date, metrics),
        healthConnectPreferences,
      );
      return true;
    } catch (error) {
      posthog?.capture("health_integration_connection_failed", {
        provider: "health_connect",
      });
      console.error("[HC] connect error", error);
      Alert.alert(
        "Couldn't connect",
        `We couldn't connect to Health Connect. Please make sure it's installed and up to date, then try again.\n\nDetails: ${error?.message ?? String(error)}`,
      );
      return false;
    }
  };

  return (
    <HealthSyncSheet
      visible={visible}
      onDismiss={onClose}
      onConnect={handleConnect}
      provider="health_connect"
      title="Health Connect"
      caption="Connect Health Connect to bring useful health context from your phone and wearables into Hemo."
      providerIcon={require("../../assets/images/health_connect_logo.png")}
      providerIconSize={50}
      rows={HEALTH_CONNECT_ROWS}
      connectLabel="Connect Health Connect"
      footerAction={{
        label: "Don't have Health Connect? Install it from the Play Store",
        onPress: () => Linking.openURL(HC_PLAY_STORE_URL).catch(() => {}),
      }}
      blurTarget={blurTarget}
    />
  );
}

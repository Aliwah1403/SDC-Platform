import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import * as StoreReview from "expo-store-review";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart3, HeartPulse, MessageSquareText, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/PressableScale";
import { colors } from "@/utils/colors";
import { fonts } from "@/utils/fonts";

const SHOW_REVIEW_BUTTON = true;

const HEMO_ICON = require("../../assets/images/icon.png");

const RELEASE_NOTES = {
  badge: "Beta preview",
  title: "Help us test Hemo",
  body:
    "This beta brings the core Hemo experience together. Use it like your real sickle cell companion and tell us what feels clear, confusing, slow, or missing.",
  heroImage: null,
  features: [
    {
      icon: HeartPulse,
      title: "Daily health tracking",
      body: "Log pain, symptoms, hydration, mood, sleep, medication, and appointments so your patterns become easier to review.",
    },
    {
      icon: BarChart3,
      title: "Summaries and exports",
      body: "Create health summaries, export reports, and test the public sharing links from another device.",
    },
    {
      icon: ShieldCheck,
      title: "Care and emergency tools",
      body: "Check your care team, crisis plan, emergency card, facilities, medication reminders, and device calendar flow.",
    },
    {
      icon: MessageSquareText,
      title: "Feedback matters",
      body: "If anything breaks or feels off, leave feedback from Profile → Help & Feedback so we can fix it before public release.",
    },
  ],
};

const IOS_REVIEW_URL = "itms-apps://itunes.apple.com/app/id6749602324?action=write-review";
const ANDROID_REVIEW_URL = "market://details?id=com.hemoscd.hemo";
const ANDROID_WEB_REVIEW_URL = "https://play.google.com/store/apps/details?id=com.hemoscd.hemo";

function getAppVersion() {
  return (
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    "unknown"
  );
}

async function openStoreReview() {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // Fall through to store URL.
  }

  const primaryUrl = Platform.OS === "ios" ? IOS_REVIEW_URL : ANDROID_REVIEW_URL;
  const fallbackUrl = Platform.OS === "android" ? ANDROID_WEB_REVIEW_URL : primaryUrl;

  try {
    const canOpen = await Linking.canOpenURL(primaryUrl);
    await Linking.openURL(canOpen ? primaryUrl : fallbackUrl);
  } catch {
    if (fallbackUrl !== primaryUrl) {
      Linking.openURL(fallbackUrl).catch(() => {});
    }
  }
}

export default function AppUpdateModal({ ready }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [storageKey, setStorageKey] = useState(null);

  const appVersion = useMemo(() => getAppVersion(), []);

  useEffect(() => {
    if (!ready) return;

    const key = `hemo:update-modal-seen:${appVersion}`;
    let cancelled = false;

    AsyncStorage.getItem(key)
      .then((value) => {
        if (cancelled || value === "true") return;
        setStorageKey(key);
        setVisible(true);
      })
      .catch(() => {
        if (cancelled) return;
        setStorageKey(key);
        setVisible(true);
      });

    return () => {
      cancelled = true;
    };
  }, [appVersion, ready]);

  const handleContinue = async () => {
    setVisible(false);
    if (storageKey) {
      await AsyncStorage.setItem(storageKey, "true").catch(() => {});
    }
  };

  const handleReview = async () => {
    await openStoreReview();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleContinue}
    >
      <View style={styles.screen}>
        <StatusBar style="light" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 188 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <HeroSection release={RELEASE_NOTES} />

          <View style={[styles.copyBlock, !RELEASE_NOTES.heroImage && styles.copyBlockAfterFallback]}>
            <Text style={styles.badge}>{RELEASE_NOTES.badge}</Text>
            <Text style={styles.title}>{RELEASE_NOTES.title}</Text>
            <Text style={styles.body}>{RELEASE_NOTES.body}</Text>
          </View>

          <View style={styles.features}>
            {RELEASE_NOTES.features.map((feature) => (
              <FeatureRow key={feature.title} feature={feature} />
            ))}
          </View>
        </ScrollView>

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(18,18,18,0)", "#121212", "#121212"]}
          locations={[0, 0.28, 1]}
          style={styles.footerFade}
        />

        <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
          <PressableScale style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </PressableScale>

          {SHOW_REVIEW_BUTTON ? (
            <PressableScale style={styles.secondaryButton} onPress={handleReview}>
              <Text style={styles.secondaryButtonText}>Leave a review</Text>
            </PressableScale>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function HeroSection({ release }) {
  return (
    <View style={[styles.heroSection, !release.heroImage && styles.heroSectionFallback]}>
      <View style={styles.heroMedia}>
        {release.heroImage ? (
          <Image source={release.heroImage} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroFallback}>
            <View style={styles.heroGlowTop} />
            <View style={styles.heroGlowBottom} />
            <View style={styles.heroIconCard}>
              <Image source={HEMO_ICON} style={styles.heroIcon} resizeMode="contain" />
            </View>
          </View>
        )}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(18,18,18,0)", "rgba(18,18,18,0.74)", "#121212"]}
        locations={[0, 0.55, 1]}
        style={styles.heroFade}
      />
    </View>
  );
}

function FeatureRow({ feature }) {
  const Icon = feature.icon;

  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Icon size={24} color={colors.burgundy} strokeWidth={2.2} />
      </View>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureBody}>{feature.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    height: 570,
  },
  heroSectionFallback: {
    height: 330,
  },
  heroMedia: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    overflow: "hidden",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cream,
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  heroGlowTop: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -120,
    right: -110,
    backgroundColor: "rgba(169,51,77,0.16)",
  },
  heroGlowBottom: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    bottom: -200,
    left: -150,
    backgroundColor: "rgba(208,159,154,0.28)",
  },
  heroIconCard: {
    width: 168,
    height: 168,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.68)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#781D11",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  heroIcon: {
    width: 102,
    height: 102,
    borderRadius: 24,
  },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "28%",
    bottom: -112,
  },
  copyBlock: {
    marginTop: -112,
    paddingHorizontal: 12,
  },
  copyBlockAfterFallback: {
    marginTop: -76,
  },
  badge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 5,
    backgroundColor: "rgba(169,51,77,0.95)",
    color: colors.cream,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  title: {
    marginTop: 18,
    color: "#FFFFFF",
    fontFamily: fonts.extrabold,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.9,
  },
  body: {
    marginTop: 12,
    color: "rgba(255,255,255,0.86)",
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  features: {
    gap: 20,
    marginTop: 28,
    paddingHorizontal: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(248,233,231,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.25,
  },
  featureBody: {
    marginTop: 4,
    color: "rgba(255,255,255,0.52)",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  footerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 10,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: colors.burgundy,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
});

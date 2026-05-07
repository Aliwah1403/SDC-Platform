import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import {
  ChevronLeft,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  ScanLine,
  Zap,
  Focus,
  Sun,
  Type,
  Sparkles,
  Lightbulb,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "@/utils/fonts";
import { lookupByNDC, lookupByName } from "@/utils/medicationApi";
import { identifyPill } from "@/utils/pillVision";
import { Sentry } from "@/utils/sentry";
import { useTheme } from "@/hooks/useTheme";

const { height: SCREEN_H } = Dimensions.get("window");
const VIEWFINDER_RATIO = 0.58;

const C = {
  accent: "#A9334D",
  darkBurg: "#781D11",
  orange: "#F0531C",
  cream: "#F8E9E7",
};

const TIPS = [
  { Icon: Focus, text: "Ensure the label or pill is clearly in focus" },
  { Icon: Sun, text: "Use good lighting — avoid harsh shadows" },
  { Icon: Type, text: "Include the drug name or pill imprint" },
];

const STEPS = [
  {
    n: "1",
    title: "Point at label or pill",
    body: "Place the medication on a flat, well-lit surface.",
  },
  {
    n: "2",
    title: "Capture a clear photo",
    body: "Ensure text is readable and the pill is in focus.",
  },
];

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({
  result,
  confirmedName,
  onNameChange,
  confirmedStrength,
  onStrengthChange,
  enriching,
  onAdd,
  onClear,
}) {
  const t = useTheme();
  const styles = createStyles(t);
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <CheckCircle size={20} color="#059669" />
        <Text style={styles.resultFoundLabel}>Medication identified</Text>
        {enriching && (
          <ActivityIndicator
            size="small"
            color={t.textSecondary}
            style={{ marginLeft: 6 }}
          />
        )}
      </View>

      <TextInput
        value={confirmedName}
        onChangeText={onNameChange}
        style={styles.resultNameInput}
        placeholder="Medication name"
        placeholderTextColor={t.textSecondary}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <TextInput
          value={confirmedStrength}
          onChangeText={onStrengthChange}
          style={[styles.resultStrengthInput, { flex: 1 }]}
          placeholder="Strength (e.g. 500mg)"
          placeholderTextColor={t.textSecondary}
        />
        {result.form ? (
          <Text style={styles.resultForm}>{result.form}</Text>
        ) : null}
      </View>

      <Text style={styles.editHint}>Tap name or strength to edit</Text>
      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>What it's for</Text>
      <Text style={styles.indicationText}>{result.indication}</Text>

      {result.scdWarning?.flagged ? (
        <View style={styles.scdBanner}>
          <AlertTriangle size={16} color="#B91C1C" style={{ marginTop: 1 }} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.scdBannerTitle}>SCD Consideration</Text>
            <Text style={styles.scdBannerText}>
              {result.scdWarning.reason ||
                "This medication may have interactions relevant to Sickle Cell Disease. Speak with your haematologist before use."}
            </Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.addButton}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>Confirm & Add</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.clearButton}
        onPress={onClear}
        activeOpacity={0.7}
      >
        <Text style={styles.clearButtonText}>Scan another</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Barcode camera ───────────────────────────────────────────────────────────

function BarcodeCamera({ onResult, flash, onScanOverlay }) {
  const t = useTheme();
  const styles = createStyles(t);
  const posthog = usePostHog();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBarcode = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const result = await lookupByNDC(data);
      if (result) {
        posthog?.capture('medication_scan_completed', { found_in_fda: true });
        onResult({
          name: result.name,
          commonName: result.name,
          strength: null,
          form: null,
          indication: `This medication is in the ${result.category} category for Sickle Cell Disease management.`,
          scdWarning: { flagged: false, reason: null },
          _fromBarcode: true,
          _barcodeResult: result,
        });
      } else {
        posthog?.capture('medication_scan_completed', { found_in_fda: false });
        Alert.alert(
          "Not found",
          "This barcode wasn't matched to a known medication. Try the Photo AI tab to identify it by image.",
          [{ text: "OK", onPress: () => setScanned(false) }],
        );
      }
    } catch {
      posthog?.capture('medication_scan_failed', { reason: 'lookup_error' });
      Alert.alert(
        "Error",
        "Failed to look up this barcode. Please try again.",
        [{ text: "OK", onPress: () => setScanned(false) }],
      );
    } finally {
      setLoading(false);
    }
  };

  if (!permission)
    return <View style={{ flex: 1, backgroundColor: C.darkBurg }} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Camera size={36} color="rgba(248,233,231,0.5)" />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionSubtitle}>
          Allow camera access to scan medication barcodes
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a", "code128", "code39"],
        }}
        onBarcodeScanned={handleBarcode}
      />

      {/* Dark radial vignette */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={["transparent", `${C.darkBurg}CC`]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Scan brackets */}
      <View style={styles.scanOverlay} pointerEvents="none">
        <View style={styles.scanWindow}>
          <View style={[styles.scanCorner, styles.cornerTL]} />
          <View style={[styles.scanCorner, styles.cornerTR]} />
          <View style={[styles.scanCorner, styles.cornerBL]} />
          <View style={[styles.scanCorner, styles.cornerBR]} />
        </View>
      </View>

      {/* Instruction pill */}
      <View style={styles.instructionPill} pointerEvents="none">
        <ScanLine size={13} color={C.orange} />
        <Text style={styles.instructionText}>
          Point at the barcode on the medication packaging
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>Looking up medication…</Text>
        </View>
      )}

      {scanned && !loading && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.rescanButtonText}>Tap to scan again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Photo AI content ─────────────────────────────────────────────────────────

function PhotoContent({ onResult }) {
  const t = useTheme();
  const styles = createStyles(t);
  const [loading, setLoading] = useState(false);

  const pickAndIdentify = async (useCamera) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            base64: true,
            quality: 0.7,
            mediaTypes: "images",
          })
        : await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.7,
            mediaTypes: "images",
          });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setLoading(true);

      const jpeg = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );

      if (!jpeg.base64) {
        Alert.alert("Error", "Could not read image. Please try again.");
        setLoading(false);
        return;
      }

      const identified = await identifyPill(jpeg.base64, "image/jpeg");
      onResult(identified);
    } catch (err) {
      const msg = err?.message ?? "Identification failed";
      if (msg.includes("Could not identify")) {
        Alert.alert("Couldn't identify", msg);
      } else {
        Sentry.captureException(err);
        Alert.alert(
          "Error",
          "Something went wrong. Please try a clearer photo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={styles.loadingBoxTitle}>Analysing image…</Text>
        <Text style={styles.loadingBoxSubtitle}>
          This usually takes 5–10 seconds
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Scrollable steps + tips */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 180,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.howTitle}>How it works</Text>
        <Text style={styles.howSubtitle}>
          Our AI identifies your medication from a photo.
        </Text>

        {/* Steps */}
        <View style={{ marginTop: 24, gap: 20 }}>
          {STEPS.map(({ n, title, body }) => (
            <View key={n} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{n}</Text>
              </View>
              <View style={{ flex: 1, paddingTop: 2 }}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepBody}>{body}</Text>
              </View>
            </View>
          ))}
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber]}>
              <Sparkles size={18} color="#A9334D" />
            </View>
            <View style={{ flex: 1, paddingTop: 2 }}>
              <Text style={styles.stepTitle}>AI Identifies</Text>
              <Text style={styles.stepBody}>
                We'll instantly match it to our medical database.
              </Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={{ marginTop: 60 }}>
          <Text style={styles.tipsLabel}>FOR BEST RESULTS</Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {TIPS.map(({ Icon, text }) => (
              <View key={text} style={styles.tipRow}>
                <Icon size={15} color={C.accent} />
                <Text style={styles.tipText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTAs */}
      <LinearGradient
        colors={[t.background + "00", t.background, t.background]}
        style={styles.ctaGradient}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => pickAndIdentify(true)}
          activeOpacity={0.8}
        >
          <Camera size={18} color="#fff" />
          <Text style={styles.primaryCtaText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryCta}
          onPress={() => pickAndIdentify(false)}
          activeOpacity={0.7}
        >
          <ImageIcon size={18} color={t.text + "99"} />
          <Text style={styles.secondaryCtaText}>Choose from Library</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MedicationScanScreen() {
  const t = useTheme();
  const styles = createStyles(t);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const posthog = usePostHog();
  const [tab, setTab] = useState("barcode");
  const [flash, setFlash] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmedName, setConfirmedName] = useState("");
  const [confirmedStrength, setConfirmedStrength] = useState("");
  const [confirmedCategory, setConfirmedCategory] = useState("Supportive");
  const [enriching, setEnriching] = useState(false);
  const userEditedNameRef = useRef(false);

  const handlePhotoResult = async (identified) => {
    setResult(identified);
    setConfirmedName(identified.commonName || identified.name);
    setConfirmedStrength(identified.strength ?? "");
    setConfirmedCategory("Supportive");
    userEditedNameRef.current = false;
    setEnriching(true);
    try {
      const fda = await lookupByName(identified.name);
      if (fda) {
        if (!userEditedNameRef.current) setConfirmedName(fda.name);
        setConfirmedCategory(fda.category);
      }
    } catch (err) {
      console.error(
        `[medication-scan] FDA lookup failed for "${identified.name}"`,
        err
      );
      posthog?.capture("medication_fda_lookup_failed", {
        identified_name: identified.name ?? null,
        error_message: err instanceof Error ? err.message : String(err),
      });
    }
    setEnriching(false);
  };

  const handleAdd = () => {
    if (!result) return;
    if (result._barcodeResult) {
      router.replace({
        pathname: "/add-medication",
        params: {
          prefillName: result._barcodeResult.name,
          prefillCategory: result._barcodeResult.category,
        },
      });
    } else {
      router.replace({
        pathname: "/add-medication",
        params: {
          prefillName: confirmedName,
          prefillCategory: confirmedCategory,
          prefillDosage: confirmedStrength,
        },
      });
    }
  };

  const VIEWFINDER_H = SCREEN_H * VIEWFINDER_RATIO;

  // ── Tabs pill (shared between both modes) ──
  const TabPill = ({ onDark }) => (
    <View
      style={[
        styles.tabPill,
        onDark ? styles.tabPillDark : styles.tabPillLight,
      ]}
    >
      {["barcode", "photo"].map((tabId) => {
        const active = tab === tabId;
        return (
          <TouchableOpacity
            key={tabId}
            onPress={() => {
              setTab(tabId);
              setResult(null);
              setFlash(false);
            }}
            activeOpacity={0.7}
            style={[
              styles.tabBtn,
              active &&
                (onDark ? styles.tabBtnActiveDark : styles.tabBtnActiveLight),
            ]}
          >
            {tabId === "barcode" ? (
              <ScanLine
                size={14}
                color={
                  active
                    ? onDark
                      ? C.darkBurg
                      : "#fff"
                    : onDark
                      ? "rgba(248,233,231,0.55)"
                      : t.textSecondary
                }
              />
            ) : (
              <Camera
                size={14}
                color={
                  active
                    ? onDark
                      ? C.darkBurg
                      : "#fff"
                    : onDark
                      ? "rgba(248,233,231,0.55)"
                      : t.textSecondary
                }
              />
            )}
            <Text
              style={[
                styles.tabBtnText,
                active
                  ? onDark
                    ? styles.tabBtnTextActiveDark
                    : styles.tabBtnTextActiveLight
                  : onDark
                    ? styles.tabBtnTextInactiveDark
                    : styles.tabBtnTextInactiveLight,
              ]}
            >
              {tabId === "barcode" ? "Barcode" : "Photo AI"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Result view ──
  if (result) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <StatusBar barStyle={t.isDark ? "light-content" : "dark-content"} />
        <View style={[styles.plainHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setResult(null)}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={t.text} />
          </TouchableOpacity>
          <Text style={styles.plainHeaderTitle}>Scan Pill</Text>
          <View style={styles.iconBtn} />
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ResultCard
            result={result}
            confirmedName={confirmedName}
            onNameChange={(v) => {
              userEditedNameRef.current = true;
              setConfirmedName(v);
            }}
            confirmedStrength={confirmedStrength}
            onStrengthChange={setConfirmedStrength}
            enriching={enriching}
            onAdd={handleAdd}
            onClear={() => {
              setResult(null);
              setEnriching(false);
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // ── Barcode mode ──
  if (tab === "barcode") {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <StatusBar barStyle="light-content" />

        {/* Camera viewfinder */}
        <View
          style={{
            height: VIEWFINDER_H,
            overflow: "hidden",
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            backgroundColor: C.darkBurg,
          }}
        >
          <BarcodeCamera onResult={setResult} flash={flash} />
        </View>

        {/* Floating header */}
        <LinearGradient
          colors={[`${C.darkBurg}CC`, "transparent"]}
          style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.floatIconBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.floatingTitle}>Scan Pill</Text>
          <TouchableOpacity
            style={[styles.floatIconBtn, flash && styles.floatIconBtnActive]}
            onPress={() => setFlash(!flash)}
            activeOpacity={0.7}
          >
            <Lightbulb size={20} color={flash ? C.orange : "#fff"} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Tabs straddling the viewfinder edge */}
        <View style={styles.tabsOverlap}>
          <TabPill onDark />
        </View>

        {/* Tips — small top margin from viewfinder */}
        <View style={{ paddingHorizontal: 24, paddingTop: 30 }}>
          <Text style={styles.tipsLabel}>FOR BEST RESULTS</Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {TIPS.map(({ Icon, text }) => (
              <View key={text} style={styles.tipRow}>
                <Icon size={15} color={C.accent} />
                <Text style={styles.tipText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── Photo AI mode ──
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar barStyle={t.isDark ? "light-content" : "dark-content"} />

      {/* Regular header */}
      <View style={[styles.plainHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={styles.plainHeaderTitle}>Scan Pill</Text>
        <View style={styles.iconBtn} />
      </View>

      {/* Tabs inline */}
      <View style={{ alignItems: "center", paddingVertical: 6 }}>
        <TabPill onDark={false} />
      </View>

      <PhotoContent onResult={handlePhotoResult} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(t) {
  return StyleSheet.create({
    // Headers
    floatingHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 20,
      zIndex: 10,
    },
    floatingTitle: {
      fontFamily: fonts.semibold,
      fontSize: 18,
      color: "#fff",
      letterSpacing: 0.2,
    },
    floatIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.25)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    floatIconBtnActive: {
      backgroundColor: "rgba(240,83,28,0.3)",
    },
    plainHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    plainHeaderTitle: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: t.text,
      letterSpacing: 0.1,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },

    // Tabs pill
    tabsOverlap: {
      alignItems: "center",
      marginTop: -26,
      zIndex: 5,
    },
    tabPill: {
      flexDirection: "row",
      borderRadius: 100,
      padding: 4,
    },
    tabPillDark: {
      backgroundColor: "rgba(120,29,17,0.82)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    tabPillLight: {
      backgroundColor: t.isDark ? "rgba(169,51,77,0.15)" : "rgba(169,51,77,0.08)",
      borderWidth: 1,
      borderColor: t.isDark ? "rgba(169,51,77,0.2)" : "rgba(169,51,77,0.12)",
    },
    tabBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 100,
    },
    tabBtnActiveDark: {
      backgroundColor: C.cream,
    },
    tabBtnActiveLight: {
      backgroundColor: C.accent,
    },
    tabBtnText: {
      fontFamily: fonts.medium,
      fontSize: 14,
    },
    tabBtnTextActiveDark: {
      color: C.darkBurg,
      fontFamily: fonts.semibold,
    },
    tabBtnTextActiveLight: {
      color: "#fff",
      fontFamily: fonts.semibold,
    },
    tabBtnTextInactiveDark: {
      color: "rgba(248,233,231,0.55)",
    },
    tabBtnTextInactiveLight: {
      color: t.textSecondary,
    },

    // Camera / barcode
    scanOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    scanWindow: {
      width: 248,
      height: 160,
      position: "relative",
      marginBottom: 48,
    },
    scanCorner: {
      position: "absolute",
      width: 28,
      height: 28,
      borderColor: "rgba(248,233,231,0.8)",
      borderWidth: 2.5,
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopLeftRadius: 6,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopRightRadius: 6,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: 6,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomRightRadius: 6,
    },
    instructionPill: {
      position: "absolute",
      bottom: 72,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(120,29,17,0.7)",
      borderRadius: 100,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "rgba(248,233,231,0.12)",
    },
    instructionText: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      color: "rgba(248,233,231,0.9)",
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loadingText: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: "#fff",
    },
    rescanButton: {
      position: "absolute",
      bottom: 24,
      alignSelf: "center",
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    rescanButtonText: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: "#fff",
    },

    // Permission
    permissionBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 12,
      backgroundColor: C.darkBurg,
    },
    permissionTitle: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: C.cream,
      marginTop: 8,
    },
    permissionSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: "rgba(248,233,231,0.6)",
      textAlign: "center",
    },
    permissionButton: {
      marginTop: 8,
      backgroundColor: C.accent,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    permissionButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: "#fff",
    },

    // Tips
    tipsLabel: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: t.textSecondary,
      letterSpacing: 0.8,
    },
    tipRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    tipText: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: t.text,
      flex: 1,
    },

    // Photo AI steps
    howTitle: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: t.text,
      letterSpacing: -0.3,
    },
    howSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: t.textSecondary,
      marginTop: 4,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    stepNumber: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.isDark ? t.surfaceElevated : C.cream,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberText: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: C.accent,
    },
    stepTitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: t.text,
      marginBottom: 2,
    },
    stepBody: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: t.textSecondary,
      lineHeight: 19,
    },

    // Photo CTAs
    ctaGradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 24,
      paddingBottom: 32,
      paddingTop: 32,
      gap: 10,
    },
    primaryCta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: C.accent,
      borderRadius: 14,
      paddingVertical: 16,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 4,
    },
    primaryCtaText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: "#fff",
    },
    secondaryCta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
    },
    secondaryCtaText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: t.textSecondary,
    },

    // Loading box (photo)
    loadingBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loadingBoxTitle: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: t.text,
    },
    loadingBoxSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: t.textSecondary,
    },

    // Result card
    resultCard: {
      backgroundColor: t.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      padding: 20,
    },
    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
    },
    resultFoundLabel: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: "#059669",
    },
    resultNameInput: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: t.text,
      marginBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      paddingBottom: 4,
      paddingHorizontal: 0,
    },
    resultStrengthInput: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: t.textSecondary,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      paddingBottom: 2,
      paddingHorizontal: 0,
    },
    resultForm: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: t.textSecondary,
    },
    editHint: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: t.textSecondary,
      marginTop: 6,
      marginBottom: 2,
    },
    divider: {
      height: 1,
      backgroundColor: t.border,
      marginVertical: 14,
    },
    sectionLabel: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: t.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    indicationText: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: t.text,
      lineHeight: 22,
    },
    scdBanner: {
      flexDirection: "row",
      backgroundColor: t.isDark ? "rgba(220,38,38,0.12)" : "#FEF2F2",
      borderRadius: 12,
      padding: 14,
      marginTop: 14,
      borderWidth: 1,
      borderColor: t.isDark ? "rgba(220,38,38,0.3)" : "#FECACA",
    },
    scdBannerTitle: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: t.isDark ? "#EF4444" : "#B91C1C",
      marginBottom: 3,
    },
    scdBannerText: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: t.isDark ? "#FCA5A5" : "#7F1D1D",
      lineHeight: 18,
    },
    addButton: {
      backgroundColor: C.orange,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 20,
    },
    addButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: "#fff",
    },
    clearButton: {
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 4,
    },
    clearButtonText: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: t.textSecondary,
    },
  });
}

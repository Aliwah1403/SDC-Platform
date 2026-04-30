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

const { height: SCREEN_H } = Dimensions.get("window");
const VIEWFINDER_RATIO = 0.58;

const C = {
  bg: "#F2EEE8",
  card: "#ffffff",
  border: "#F0E4E1",
  textDark: "#09332C",
  muted: "#9CA3AF",
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

// ─── Result card (unchanged) ──────────────────────────────────────────────────

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
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <CheckCircle size={20} color="#059669" />
        <Text style={styles.resultFoundLabel}>Medication identified</Text>
        {enriching && (
          <ActivityIndicator
            size="small"
            color={C.muted}
            style={{ marginLeft: 6 }}
          />
        )}
      </View>

      <TextInput
        value={confirmedName}
        onChangeText={onNameChange}
        style={styles.resultNameInput}
        placeholder="Medication name"
        placeholderTextColor={C.muted}
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
          placeholderTextColor={C.muted}
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

// ─── Barcode camera (logic unchanged, UI trimmed) ─────────────────────────────

function BarcodeCamera({ onResult, flash, onScanOverlay }) {
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
        Alert.alert(
          "Not found",
          "This barcode wasn't matched to a known medication. Try the Photo AI tab to identify it by image.",
          [{ text: "OK", onPress: () => setScanned(false) }],
        );
      }
    } catch {
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
        colors={[`${C.bg}00`, C.bg, C.bg]}
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
          <ImageIcon size={18} color={`${C.textDark}99`} />
          <Text style={styles.secondaryCtaText}>Choose from Library</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MedicationScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    } catch {}
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
      {["barcode", "photo"].map((t) => {
        const active = tab === t;
        return (
          <TouchableOpacity
            key={t}
            onPress={() => {
              setTab(t);
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
            {t === "barcode" ? (
              <ScanLine
                size={14}
                color={
                  active
                    ? onDark
                      ? C.darkBurg
                      : "#fff"
                    : onDark
                      ? "rgba(248,233,231,0.55)"
                      : "rgba(9,51,44,0.45)"
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
                      : "rgba(9,51,44,0.45)"
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
              {t === "barcode" ? "Barcode" : "Photo AI"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Result view ──
  if (result) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.plainHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setResult(null)}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={C.textDark} />
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
            onNameChange={(t) => {
              userEditedNameRef.current = true;
              setConfirmedName(t);
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
      <View style={{ flex: 1, backgroundColor: C.bg }}>
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
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" />

      {/* Regular header */}
      <View style={[styles.plainHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={C.textDark} />
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

const styles = StyleSheet.create({
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
    color: C.textDark,
    letterSpacing: 0.1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(9,51,44,0.07)",
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
    backgroundColor: "rgba(169,51,77,0.08)",
    borderWidth: 1,
    borderColor: "rgba(169,51,77,0.12)",
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
    color: "rgba(9,51,44,0.45)",
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
    color: "rgba(9,51,44,0.38)",
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
    color: "rgba(9,51,44,0.65)",
    flex: 1,
  },

  // Photo AI steps
  howTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: C.textDark,
    letterSpacing: -0.3,
  },
  howSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.5)",
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
    backgroundColor: C.cream,
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
    color: C.textDark,
    marginBottom: 2,
  },
  stepBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(9,51,44,0.5)",
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
    color: "rgba(9,51,44,0.5)",
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
    color: C.textDark,
  },
  loadingBoxSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: C.muted,
  },

  // Result card
  resultCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
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
    color: C.textDark,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 4,
    paddingHorizontal: 0,
  },
  resultStrengthInput: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: C.muted,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 2,
    paddingHorizontal: 0,
  },
  resultForm: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: C.muted,
  },
  editHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: C.muted,
    marginTop: 6,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  indicationText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: C.textDark,
    lineHeight: 22,
  },
  scdBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  scdBannerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#B91C1C",
    marginBottom: 3,
  },
  scdBannerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#7F1D1D",
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
    color: C.muted,
  },
});

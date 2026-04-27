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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Camera, Image, AlertTriangle, CheckCircle, ScanLine } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { fonts } from "@/utils/fonts";
import { lookupByNDC, lookupByName } from "@/utils/medicationApi";
import { identifyPill } from "@/utils/pillVision";
import { Sentry } from "@/utils/sentry";

const C = {
  bg: "#F8F4F0",
  card: "#ffffff",
  border: "#F0E4E1",
  dark: "#09332C",
  muted: "#9CA3AF",
  accent: "#A9334D",
  orange: "#F0531C",
  cream: "#F8E9E7",
};

const TABS = ["Barcode", "Photo"];

function ResultCard({ result, confirmedName, onNameChange, confirmedStrength, onStrengthChange, enriching, onAdd, onClear }) {
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <CheckCircle size={20} color="#059669" />
        <Text style={styles.resultFoundLabel}>Medication identified</Text>
        {enriching && <ActivityIndicator size="small" color={C.muted} style={{ marginLeft: 6 }} />}
      </View>

      <TextInput
        value={confirmedName}
        onChangeText={onNameChange}
        style={styles.resultNameInput}
        placeholder="Medication name"
        placeholderTextColor={C.muted}
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <TextInput
          value={confirmedStrength}
          onChangeText={onStrengthChange}
          style={[styles.resultStrengthInput, { flex: 1 }]}
          placeholder="Strength (e.g. 500mg)"
          placeholderTextColor={C.muted}
        />
        {result.form ? <Text style={styles.resultForm}>{result.form}</Text> : null}
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

      <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
        <Text style={styles.addButtonText}>Confirm & Add</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={onClear} activeOpacity={0.7}>
        <Text style={styles.clearButtonText}>Scan another</Text>
      </TouchableOpacity>
    </View>
  );
}

function BarcodeTab({ onResult }) {
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
          "This barcode wasn't matched to a known medication. Try the Photo tab to identify it by image.",
          [{ text: "OK", onPress: () => setScanned(false) }],
        );
      }
    } catch {
      Alert.alert("Error", "Failed to look up this barcode. Please try again.", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Camera size={36} color={C.muted} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionSubtitle}>
          Allow camera access to scan medication barcodes
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "upc_a", "code128", "code39"] }}
        onBarcodeScanned={handleBarcode}
      />

      {/* Scanner overlay */}
      <View style={styles.scanOverlay}>
        <View style={styles.scanWindow}>
          <View style={[styles.scanCorner, styles.scanCornerTL]} />
          <View style={[styles.scanCorner, styles.scanCornerTR]} />
          <View style={[styles.scanCorner, styles.scanCornerBL]} />
          <View style={[styles.scanCorner, styles.scanCornerBR]} />
        </View>
        <Text style={styles.scanHint}>Point at the barcode on the medication packaging</Text>
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

function PhotoTab({ onResult }) {
  const [loading, setLoading] = useState(false);

  const pickAndIdentify = async (useCamera) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, mediaTypes: "images" })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: "images" });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      setLoading(true);

      // Convert to JPEG regardless of source format (HEIC, PNG, etc.)
      // This guarantees clean, valid base64 that the Anthropic API can process.
      const jpeg = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
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
        Alert.alert("Error", "Something went wrong. Please try a clearer photo.");
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
        <Text style={styles.loadingBoxSubtitle}>This usually takes 5–10 seconds</Text>
      </View>
    );
  }

  return (
    <View style={styles.photoTabContent}>
      <View style={styles.photoIllustration}>
        <ScanLine size={48} color={C.accent} strokeWidth={1.5} />
      </View>
      <Text style={styles.photoTitle}>Identify by photo</Text>
      <Text style={styles.photoSubtitle}>
        Take a clear photo of the medication label, packaging, or pill to identify it
      </Text>

      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => pickAndIdentify(true)}
        activeOpacity={0.8}
      >
        <Camera size={18} color="#fff" />
        <Text style={styles.photoButtonText}>Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.photoButtonOutline}
        onPress={() => pickAndIdentify(false)}
        activeOpacity={0.8}
      >
        <Image size={18} color={C.dark} />
        <Text style={styles.photoButtonOutlineText}>Choose from Library</Text>
      </TouchableOpacity>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>For best results</Text>
        {[
          "Ensure the label or pill is in focus",
          "Use good lighting — avoid shadows",
          "Include the drug name or imprint if possible",
        ].map((tip) => (
          <Text key={tip} style={styles.tipItem}>
            · {tip}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function MedicationScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
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
        params: { prefillName: result._barcodeResult.name, prefillCategory: result._barcodeResult.category },
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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: C.card,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={styles.backButton}
        >
          <ChevronLeft size={22} color={C.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Pill</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            onPress={() => { setActiveTab(i); setResult(null); }}
            activeOpacity={0.7}
            style={[styles.tab, activeTab === i && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {result ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <ResultCard
            result={result}
            confirmedName={confirmedName}
            onNameChange={(t) => { userEditedNameRef.current = true; setConfirmedName(t); }}
            confirmedStrength={confirmedStrength}
            onStrengthChange={setConfirmedStrength}
            enriching={enriching}
            onAdd={handleAdd}
            onClear={() => { setResult(null); setEnriching(false); }}
          />
        </ScrollView>
      ) : activeTab === 0 ? (
        <BarcodeTab onResult={setResult} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <PhotoTab onResult={handlePhotoResult} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: C.dark,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: C.accent,
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: C.muted,
  },
  tabTextActive: {
    color: C.accent,
    fontFamily: fonts.semibold,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  scanWindow: {
    width: 260,
    height: 140,
    position: "relative",
  },
  scanCorner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
    borderWidth: 3,
  },
  scanCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  scanCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  scanCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  scanCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
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
    bottom: 40,
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
  },
  permissionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: C.dark,
    marginTop: 8,
  },
  permissionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: C.muted,
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

  // Photo tab
  photoTabContent: {
    alignItems: "center",
    paddingTop: 16,
    gap: 12,
  },
  photoIllustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${C.accent}10`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: C.dark,
  },
  photoSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
    width: "100%",
    justifyContent: "center",
  },
  photoButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: "#fff",
  },
  photoButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    justifyContent: "center",
    backgroundColor: C.card,
  },
  photoButtonOutlineText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: C.dark,
  },
  tipsCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    width: "100%",
    marginTop: 8,
    gap: 4,
  },
  tipsTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: C.dark,
    marginBottom: 4,
  },
  tipItem: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
  },

  // Loading box
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingBoxTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: C.dark,
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
    color: C.dark,
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
    color: C.dark,
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

import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { Heart, PenLine } from "lucide-react-native";
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/hooks/queries/useProfileQuery";
import { fonts } from "@/utils/fonts";
import { colors } from "@/utils/colors";

// ─── constants ───────────────────────────────────────────────────────────────

const CM_MIN = 100;
const CM_MAX = 250;
const KG_MIN = 20;
const KG_MAX = 250;
const LB_MIN = 44;
const LB_MAX = 551;

// ─── components ──────────────────────────────────────────────────────────────

function SegmentedControl({ options, selected, onSelect }) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[
            styles.segmentBtn,
            selected === opt && styles.segmentBtnActive,
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text
            style={[
              styles.segmentText,
              selected === opt && styles.segmentTextActive,
            ]}
          >
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function EditBodyStats() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();

  const [activeTab, setActiveTab] = useState("Height");

  // Height state (always stored in cm)
  const [heightUnit, setHeightUnit] = useState("Metric");
  const [cmValue, setCmValue] = useState(170);
  const [totalInches, setTotalInches] = useState(67); // 5'7" default

  // Weight state (always stored in kg)
  const [weightUnit, setWeightUnit] = useState("Metric");
  const [kgValue, setKgValue] = useState(70);
  const [lbValue, setLbValue] = useState(154);

  const [initialized, setInitialized] = useState(false);
  const [editingHeight, setEditingHeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);

  // Apple Health toggles (UI only — integration coming soon)
  const [heightReadHealth, setHeightReadHealth] = useState(false);
  const [heightWriteHealth, setHeightWriteHealth] = useState(false);
  const [weightReadHealth, setWeightReadHealth] = useState(false);
  const [weightWriteHealth, setWeightWriteHealth] = useState(false);

  const handleHealthToggle = (setter) => (val) => {
    if (val) {
      Alert.alert("Apple Health", "Apple Health integration is coming soon.", [
        { text: "OK" },
      ]);
    } else {
      setter(false);
    }
  };

  // Pre-fill from Supabase profile once loaded
  useEffect(() => {
    if (profile && !initialized) {
      if (profile.height) {
        const cm = Math.min(
          CM_MAX,
          Math.max(CM_MIN, Math.round(profile.height)),
        );
        setCmValue(cm);
        setTotalInches(Math.round(cm / 2.54));
      }
      if (profile.weight) {
        const kg = Math.min(
          KG_MAX,
          Math.max(KG_MIN, Math.round(profile.weight)),
        );
        setKgValue(kg);
        setLbValue(Math.round(kg * 2.20462));
      }
      setInitialized(true);
    }
  }, [profile, initialized]);

  // ── derived display values ─────────────────────────────────────────────────

  const heightDisplay =
    heightUnit === "Metric"
      ? `${cmValue} cm`
      : `${Math.floor(totalInches / 12)}' ${totalInches % 12}"`;

  const weightDisplay =
    weightUnit === "Metric" ? `${kgValue} kg` : `${lbValue} lb`;

  // ── unit switch handlers ───────────────────────────────────────────────────

  const handleHeightUnitSwitch = (newUnit) => {
    if (newUnit === "Imperial") {
      setTotalInches(Math.min(102, Math.max(36, Math.round(cmValue / 2.54))));
    } else {
      setCmValue(
        Math.min(CM_MAX, Math.max(CM_MIN, Math.round(totalInches * 2.54))),
      );
    }
    setHeightUnit(newUnit);
  };

  const handleWeightUnitSwitch = (newUnit) => {
    if (newUnit === "Imperial") {
      setLbValue(
        Math.min(LB_MAX, Math.max(LB_MIN, Math.round(kgValue * 2.20462))),
      );
    } else {
      setKgValue(
        Math.min(KG_MAX, Math.max(KG_MIN, Math.round(lbValue / 2.20462))),
      );
    }
    setWeightUnit(newUnit);
  };

  // ── save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const heightInCm =
      heightUnit === "Metric" ? cmValue : Math.round(totalInches * 2.54);
    const weightInKg =
      weightUnit === "Metric"
        ? kgValue
        : Math.round((lbValue / 2.20462) * 10) / 10;

    updateProfile.mutate(
      { height: heightInCm, weight: weightInKg },
      { onSuccess: () => router.back() },
    );
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerSide}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Body Stats</Text>
        <Pressable
          onPress={handleSave}
          hitSlop={12}
          style={[styles.headerSide, styles.headerRight]}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator size="small" color="#A9334D" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Tab switcher: Height | Weight — centered */}
      <View style={styles.tabBar}>
        <View style={styles.tabGroup}>
          {["Height", "Weight"].map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab);
                setEditingHeight(false);
                setEditingWeight(false);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "Height" ? (
          <>
            <SegmentedControl
              options={["Metric", "Imperial"]}
              selected={heightUnit}
              onSelect={handleHeightUnitSwitch}
            />

            <Pressable
              style={styles.valueCard}
              onPress={() => setEditingHeight((e) => !e)}
            >
              <Text style={styles.valueText}>{heightDisplay}</Text>
              {!editingHeight && (
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to change</Text>
                  <PenLine
                    size={14}
                    color={colors.textMuted}
                    strokeWidth={1.8}
                  />
                </View>
              )}
            </Pressable>

            {editingHeight && (
              <View style={styles.pickerWrapper}>
                {heightUnit === "Metric" ? (
                  <Picker
                    selectedValue={cmValue}
                    onValueChange={setCmValue}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {Array.from({ length: CM_MAX - CM_MIN + 1 }, (_, i) => {
                      const val = i + CM_MIN;
                      return (
                        <Picker.Item
                          key={val}
                          label={`${val} cm`}
                          value={val}
                        />
                      );
                    })}
                  </Picker>
                ) : (
                  <View style={styles.imperialRow}>
                    <Picker
                      selectedValue={Math.floor(totalInches / 12)}
                      onValueChange={(ft) =>
                        setTotalInches(ft * 12 + (totalInches % 12))
                      }
                      style={styles.imperialPicker}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 6 }, (_, i) => {
                        const val = i + 3;
                        return (
                          <Picker.Item
                            key={val}
                            label={`${val}'`}
                            value={val}
                          />
                        );
                      })}
                    </Picker>
                    <Picker
                      selectedValue={totalInches % 12}
                      onValueChange={(inches) =>
                        setTotalInches(
                          Math.floor(totalInches / 12) * 12 + inches,
                        )
                      }
                      style={styles.imperialPicker}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <Picker.Item key={i} label={`${i}"`} value={i} />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>
            )}

            <View style={styles.appleHealthCard}>
              <Text style={styles.appleHealthLabel}>Apple Health</Text>
              <View style={styles.appleHealthRow}>
                <Heart size={16} color="#EF4444" fill="#EF4444" />
                <Text style={styles.appleHealthText}>
                  Read height from Health
                </Text>
                <Switch
                  value={heightReadHealth}
                  onValueChange={handleHealthToggle(setHeightReadHealth)}
                  trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
              <View style={styles.appleHealthDivider} />
              <View style={styles.appleHealthRow}>
                <Heart size={16} color="#EF4444" fill="#EF4444" />
                <Text style={styles.appleHealthText}>
                  Write height to Health
                </Text>
                <Switch
                  value={heightWriteHealth}
                  onValueChange={handleHealthToggle(setHeightWriteHealth)}
                  trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <SegmentedControl
              options={["Metric", "Imperial"]}
              selected={weightUnit}
              onSelect={handleWeightUnitSwitch}
            />

            <Pressable
              style={styles.valueCard}
              onPress={() => setEditingWeight((e) => !e)}
            >
              <Text style={styles.valueText}>{weightDisplay}</Text>
              {!editingWeight && (
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to change</Text>
                  <PenLine
                    size={14}
                    color={colors.textMuted}
                    strokeWidth={1.8}
                  />
                </View>
              )}
            </Pressable>

            {editingWeight && (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={weightUnit === "Metric" ? kgValue : lbValue}
                  onValueChange={(val) =>
                    weightUnit === "Metric" ? setKgValue(val) : setLbValue(val)
                  }
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {(weightUnit === "Metric"
                    ? Array.from({ length: KG_MAX - KG_MIN + 1 }, (_, i) => ({
                        label: `${i + KG_MIN} kg`,
                        value: i + KG_MIN,
                      }))
                    : Array.from({ length: LB_MAX - LB_MIN + 1 }, (_, i) => ({
                        label: `${i + LB_MIN} lb`,
                        value: i + LB_MIN,
                      }))
                  ).map((item) => (
                    <Picker.Item
                      key={item.value}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </Picker>
              </View>
            )}

            <View style={styles.appleHealthCard}>
              <Text style={styles.appleHealthLabel}>Apple Health</Text>
              <View style={styles.appleHealthRow}>
                <Heart size={16} color="#EF4444" fill="#EF4444" />
                <Text style={styles.appleHealthText}>
                  Read weight from Health
                </Text>
                <Switch
                  value={weightReadHealth}
                  onValueChange={handleHealthToggle(setWeightReadHealth)}
                  trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
              <View style={styles.appleHealthDivider} />
              <View style={styles.appleHealthRow}>
                <Heart size={16} color="#EF4444" fill="#EF4444" />
                <Text style={styles.appleHealthText}>
                  Write weight to Health
                </Text>
                <Switch
                  value={weightWriteHealth}
                  onValueChange={handleHealthToggle(setWeightWriteHealth)}
                  trackColor={{ false: "#E5E7EB", true: "#A9334D" }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </>
        )}

        <Text style={styles.note}>
          Measurements are stored securely and never shared without your
          permission.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0E4E1",
  },
  headerSide: {
    minWidth: 60,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  cancelText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: "#A9334D",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0E4E1",
  },
  tabGroup: {
    flexDirection: "row",
    backgroundColor: "#F0E4E1",
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  tab: {
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: "#A9334D",
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontFamily: fonts.semibold,
    color: "#ffffff",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.pinkBorder,
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    fontFamily: fonts.semibold,
    color: colors.burgundy,
  },
  valueCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.pinkBorder,
  },
  valueText: {
    fontFamily: fonts.extrabold,
    fontSize: 64,
    color: colors.textPrimary,
    letterSpacing: -2,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  tapHintText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  pickerWrapper: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.pinkBorder,
    overflow: "hidden",
  },
  picker: {
    height: 216,
  },
  pickerItem: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.textPrimary,
    height: 216,
  },
  imperialRow: {
    flexDirection: "row",
  },
  imperialPicker: {
    flex: 1,
    height: 216,
  },
  appleHealthCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.pinkBorder,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  appleHealthLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingTop: 12,
    paddingBottom: 6,
  },
  appleHealthRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 10,
  },
  appleHealthText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  appleHealthDivider: {
    height: 1,
    backgroundColor: colors.pinkBorder,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 17,
  },
});

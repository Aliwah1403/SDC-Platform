import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { CalendarDays, Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OnboardingStep from "@/components/OnboardingStep";
import { useAppStore } from "@/store/appStore";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function calcAge(day, month, year) {
  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() < month ||
    (today.getMonth() === month && today.getDate() < day)
  )
    age--;
  return age;
}

export default function Step2() {
  const { setOnboardingField } = useAppStore();
  const insets = useSafeAreaInsets();

  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(2000);
  // temp values while picker is open
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempYear, setTempYear] = useState(2000);

  const [hasSelected, setHasSelected] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const openPicker = () => {
    setTempDay(day);
    setTempMonth(month);
    setTempYear(year);
    setShowPicker(true);
  };

  const confirmDate = () => {
    setDay(tempDay);
    setMonth(tempMonth);
    setYear(tempYear);
    setHasSelected(true);
    setShowPicker(false);
  };

  const handleNext = () => {
    const dob = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setOnboardingField("dob", dob);
    router.push("/(onboarding)/step-3");
  };

  const age = calcAge(day, month, year);

  return (
    <>
      <OnboardingStep
        step={2}
        title="When were you born?"
        subtitle="We only use this to calculate your age for health metrics and goals. Your birthday data is kept private and secure."
        illustrationIcon={CalendarDays}
        illustrationColor="#A9334D"
        onBack={() => router.back()}
        onCta={handleNext}
      >
        {/* Date selector button */}
        <Pressable
          style={({ pressed }) => [
            styles.dateButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={openPicker}
        >
          <View style={{ flex: 1 }}>
            {hasSelected ? (
              <>
                <Text style={styles.dateText}>
                  {day} {MONTHS_SHORT[month]} {year}
                </Text>
                <Text style={styles.ageText}>{age} years old</Text>
              </>
            ) : (
              <Text style={styles.datePlaceholder}>Select your birthday</Text>
            )}
          </View>
          <CalendarDays size={20} color="rgba(9,51,44,0.3)" strokeWidth={1.8} />
        </Pressable>

        {/* Privacy note */}
        <View style={styles.privacyRow}>
          <Lock size={13} color="rgba(9,51,44,0.4)" strokeWidth={1.8} />
          <Text style={styles.privacyText}>
            Your data is private and secure
          </Text>
        </View>
      </OnboardingStep>

      {/* Picker bottom sheet modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Pressable onPress={() => setShowPicker(false)} hitSlop={12}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </Pressable>
            <Text style={styles.sheetTitle}>Select Birthday</Text>
            <Pressable onPress={confirmDate} hitSlop={12}>
              <Text style={styles.doneBtn}>Done</Text>
            </Pressable>
          </View>

          {/* Three-column spinner */}
          <View style={styles.spinnerRow}>
            <Picker
              selectedValue={tempDay}
              onValueChange={setTempDay}
              style={styles.spinnerCol}
              itemStyle={styles.spinnerItem}
            >
              {DAYS.map((d) => (
                <Picker.Item key={d} label={String(d)} value={d} />
              ))}
            </Picker>

            <Picker
              selectedValue={tempMonth}
              onValueChange={setTempMonth}
              style={[styles.spinnerCol, { flex: 1.6 }]}
              itemStyle={styles.spinnerItem}
            >
              {MONTHS.map((m, i) => (
                <Picker.Item key={m} label={m} value={i} />
              ))}
            </Picker>

            <Picker
              selectedValue={tempYear}
              onValueChange={setTempYear}
              style={styles.spinnerCol}
              itemStyle={styles.spinnerItem}
            >
              {YEARS.map((y) => (
                <Picker.Item key={y} label={String(y)} value={y} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.1)",
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  dateText: {
    fontFamily: "Geist_700Bold",
    fontSize: 24,
    color: "#A9334D",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  ageText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "rgba(169,51,77,0.65)",
  },
  datePlaceholder: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    color: "rgba(9,51,44,0.3)",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  privacyText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.4)",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(9,51,44,0.07)",
  },
  sheetTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    color: "#09332C",
  },
  cancelBtn: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    color: "rgba(9,51,44,0.45)",
  },
  doneBtn: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    color: "#A9334D",
  },
  spinnerRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  spinnerCol: {
    flex: 1,
    height: 200,
  },
  spinnerItem: {
    fontFamily: "Geist_400Regular",
    fontSize: 18,
    color: "#09332C",
    height: 200,
  },
});

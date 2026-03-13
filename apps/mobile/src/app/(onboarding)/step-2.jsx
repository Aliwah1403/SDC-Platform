import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function Step2() {
  const { setOnboardingField } = useAppStore();

  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(1995);

  const handleNext = () => {
    const dob = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setOnboardingField('dob', dob);
    router.push('/(onboarding)/step-3');
  };

  return (
    <OnboardingStep
      step={2}
      title="When were you born?"
      subtitle="We use this to personalise your health insights and goals."
      illustrationIcon={Calendar}
      illustrationColor="#A9334D"
      onCta={handleNext}
    >
      <View style={styles.pickerRow}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Day</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={day}
              onValueChange={setDay}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {DAYS.map((d) => (
                <Picker.Item key={d} label={String(d)} value={d} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={[styles.pickerWrapper, { flex: 2 }]}>
          <Text style={styles.pickerLabel}>Month</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={month}
              onValueChange={setMonth}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {MONTHS.map((m, i) => (
                <Picker.Item key={m} label={m} value={i} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Year</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={year}
              onValueChange={setYear}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {YEARS.map((y) => (
                <Picker.Item key={y} label={String(y)} value={y} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <Text style={styles.privacyNote}>
        Your birthday is kept private and only used for health calculations.
      </Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: 'rgba(9,51,44,0.5)',
    marginBottom: 4,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
    overflow: 'hidden',
    height: 130,
  },
  picker: {
    color: '#09332C',
    height: 130,
  },
  pickerItem: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: '#09332C',
    height: 130,
  },
  privacyNote: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.4)',
    textAlign: 'center',
    lineHeight: 17,
  },
});

import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { Phone, User, Plus, Trash2, Shield } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const RELATIONSHIPS = ['Parent', 'Sibling', 'Partner', 'Friend', 'Carer', 'Doctor', 'Other'];

const emptyContact = () => ({ name: '', phone: '', relationship: '' });

export default function Step4() {
  const { setOnboardingField } = useAppStore();
  const [contacts, setContacts] = useState([emptyContact()]);
  const [focusedField, setFocusedField] = useState(null);

  const updateContact = (index, field, value) => {
    setContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addContact = () => {
    if (contacts.length < 3) setContacts((prev) => [...prev, emptyContact()]);
  };

  const removeContact = (index) => {
    if (contacts.length === 1) return;
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid = contacts[0].name.trim() && contacts[0].phone.trim();

  const handleContinue = () => {
    const validContacts = contacts.filter((c) => c.name.trim() && c.phone.trim());
    if (!validContacts.length) {
      Alert.alert('Required', 'Please add at least one emergency contact.');
      return;
    }
    setOnboardingField('emergencyContacts', validContacts);
    router.push('/(onboarding)/step-5');
  };

  return (
    <OnboardingStep
      step={4}
      title="Emergency contact"
      subtitle="In a crisis, who should we call? At least one contact is required."
      illustrationIcon={Shield}
      illustrationColor="#781D11"
      onBack={() => router.back()}
      onCta={handleContinue}
      ctaDisabled={!isValid}
      ctaLabel="Save & Next"
    >
      {contacts.map((contact, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 80, delay: index * 80 }}
          style={styles.contactCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>
              {index === 0 ? 'Primary contact' : `Contact ${index + 1}`}
            </Text>
            {index > 0 && (
              <Pressable onPress={() => removeContact(index)} hitSlop={8}>
                <Trash2 size={16} color="#DC2626" strokeWidth={1.8} />
              </Pressable>
            )}
          </View>

          <View style={[styles.inputWrapper, focusedField === `name-${index}` && styles.inputFocused]}>
            <User size={16} color={focusedField === `name-${index}` ? '#A9334D' : 'rgba(9,51,44,0.35)'} strokeWidth={1.8} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="rgba(9,51,44,0.35)"
              value={contact.name}
              onChangeText={(v) => updateContact(index, 'name', v)}
              autoCapitalize="words"
              onFocus={() => setFocusedField(`name-${index}`)}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={[styles.inputWrapper, focusedField === `phone-${index}` && styles.inputFocused]}>
            <Phone size={16} color={focusedField === `phone-${index}` ? '#A9334D' : 'rgba(9,51,44,0.35)'} strokeWidth={1.8} />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="rgba(9,51,44,0.35)"
              value={contact.phone}
              onChangeText={(v) => updateContact(index, 'phone', v)}
              keyboardType="phone-pad"
              onFocus={() => setFocusedField(`phone-${index}`)}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Text style={styles.relLabel}>Relationship</Text>
          <View style={styles.relChips}>
            {RELATIONSHIPS.map((rel) => {
              const selected = contact.relationship === rel;
              return (
                <Pressable
                  key={rel}
                  style={({ pressed }) => [
                    styles.relChip,
                    selected && styles.relChipSelected,
                    pressed && !selected && { opacity: 0.7 },
                  ]}
                  onPress={() => updateContact(index, 'relationship', rel)}
                >
                  <Text style={[styles.relChipText, selected && styles.relChipTextSelected]}>
                    {rel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </MotiView>
      ))}

      {contacts.length < 3 && (
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          onPress={addContact}
        >
          <Plus size={16} color="#09332C" strokeWidth={2} />
          <Text style={styles.addBtnText}>Add another contact</Text>
        </Pressable>
      )}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: '#09332C',
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  inputFocused: {
    borderColor: '#A9334D',
    backgroundColor: 'rgba(169,51,77,0.04)',
  },
  input: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: '#09332C',
    padding: 0,
    margin: 0,
  },
  relLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: 'rgba(9,51,44,0.55)',
    marginBottom: -4,
  },
  relChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relChip: {
    backgroundColor: '#F8F4F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
  },
  relChipSelected: {
    backgroundColor: '#A9334D',
    borderColor: '#A9334D',
  },
  relChipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#09332C',
  },
  relChipTextSelected: {
    color: '#FFFFFF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(9,51,44,0.05)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    marginTop: 4,
  },
  addBtnText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: '#09332C',
  },
});

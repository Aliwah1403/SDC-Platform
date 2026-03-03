import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Activity,
  Save,
  RotateCcw,
  MapPin,
  MessageSquare,
} from "lucide-react-native";
import { useAppStore } from "../../store/appStore";
import { PAIN_LEVELS, MOODS, BODY_LOCATIONS } from "../../types";

export default function SymptomsScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentSymptomLog,
    updateSymptomLog,
    submitSymptomLog,
    resetSymptomLog,
  } = useAppStore();

  const painLevel = currentSymptomLog?.painLevel || 0;
  const selectedMood = currentSymptomLog?.mood || "fair";
  const selectedLocations = currentSymptomLog?.bodyLocations || [];
  const notes = currentSymptomLog?.notes || "";

  const handlePainLevelChange = (value) => {
    updateSymptomLog({ painLevel: Math.round(value) });
  };

  const handleMoodSelect = (mood) => {
    updateSymptomLog({ mood });
  };

  const handleLocationToggle = (location) => {
    const newLocations = selectedLocations.includes(location)
      ? selectedLocations.filter((loc) => loc !== location)
      : [...selectedLocations, location];
    updateSymptomLog({ bodyLocations: newLocations });
  };

  const handleNotesChange = (text) => {
    updateSymptomLog({ notes: text });
  };

  const handleSubmit = () => {
    submitSymptomLog();
    Alert.alert("Success", "Your symptom log has been saved successfully!", [
      { text: "OK" },
    ]);
  };

  const handleReset = () => {
    Alert.alert("Reset Log", "Are you sure you want to clear all entries?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetSymptomLog },
    ]);
  };

  const getCurrentPainLevel = () => {
    return (
      PAIN_LEVELS.find((level) => level.value === painLevel) || PAIN_LEVELS[0]
    );
  };

  const MoodSelector = ({ mood, selected, onSelect }) => (
    <TouchableOpacity
      onPress={() => onSelect(mood.value)}
      style={{
        backgroundColor: selected ? `${mood.color}20` : "#ffffff",
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? mood.color : "#E5E7EB",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        minWidth: 80,
        marginRight: 12,
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 8 }}>{mood.emoji}</Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: selected ? "600" : "400",
          color: selected ? mood.color : "#6B7280",
          textAlign: "center",
        }}
      >
        {mood.label}
      </Text>
    </TouchableOpacity>
  );

  const LocationChip = ({ location, selected, onToggle }) => (
    <TouchableOpacity
      onPress={() => onToggle(location)}
      style={{
        backgroundColor: selected ? "#DC2626" : "#ffffff",
        borderWidth: 1,
        borderColor: selected ? "#DC2626" : "#E5E7EB",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: selected ? "600" : "400",
          color: selected ? "#ffffff" : "#6B7280",
        }}
      >
        {location}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 24,
            backgroundColor: "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                Track Symptoms
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#6B7280",
                }}
              >
                Log how you're feeling right now
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleReset}
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 10,
                padding: 12,
                marginLeft: 12,
              }}
            >
              <RotateCcw size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pain Level Section */}
        <View
          style={{
            backgroundColor: "#ffffff",
            marginTop: 20,
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#FEF3F2",
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}
            >
              <Activity size={20} color="#DC2626" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Pain Level
            </Text>
          </View>

          <View
            style={{
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 40,
                fontWeight: "bold",
                color: getCurrentPainLevel().color,
                marginBottom: 8,
              }}
            >
              {painLevel}
            </Text>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: getCurrentPainLevel().color,
                marginBottom: 4,
              }}
            >
              {getCurrentPainLevel().label}
            </Text>

            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              0 = No Pain, 10 = Worst Possible
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => handlePainLevelChange(level)}
                style={{
                  backgroundColor:
                    painLevel === level ? PAIN_LEVELS[level].color : "#ffffff",
                  borderWidth: 2,
                  borderColor: PAIN_LEVELS[level].color,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  width: "15%",
                  alignItems: "center",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      painLevel === level
                        ? "#ffffff"
                        : PAIN_LEVELS[level].color,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mood Section */}
        <View
          style={{
            backgroundColor: "#ffffff",
            marginTop: 16,
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            How is your mood?
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 12 }}
          >
            {MOODS.map((mood) => (
              <MoodSelector
                key={mood.value}
                mood={mood}
                selected={selectedMood === mood.value}
                onSelect={handleMoodSelect}
              />
            ))}
          </ScrollView>
        </View>

        {/* Body Locations Section */}
        <View
          style={{
            backgroundColor: "#ffffff",
            marginTop: 16,
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#FEF3F2",
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}
            >
              <MapPin size={20} color="#DC2626" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Pain Locations
            </Text>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginBottom: 12,
            }}
          >
            Select all areas where you're experiencing pain
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            {BODY_LOCATIONS.map((location) => (
              <LocationChip
                key={location}
                location={location}
                selected={selectedLocations.includes(location)}
                onToggle={handleLocationToggle}
              />
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View
          style={{
            backgroundColor: "#ffffff",
            marginTop: 16,
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#FEF3F2",
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}
            >
              <MessageSquare size={20} color="#DC2626" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Additional Notes
            </Text>
          </View>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: "#111827",
              minHeight: 100,
              textAlignVertical: "top",
            }}
            placeholder="Describe any triggers, activities, or other symptoms..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={notes}
            onChangeText={handleNotesChange}
          />
        </View>

        {/* Save Button */}
        <View
          style={{
            marginTop: 24,
            marginHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: "#DC2626",
              borderRadius: 16,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#DC2626",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Save size={20} color="#ffffff" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#ffffff",
                marginLeft: 8,
              }}
            >
              Save Symptom Log
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

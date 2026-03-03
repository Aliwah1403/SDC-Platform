import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Clock,
  Pill,
  Plus,
  CheckCircle,
  ChevronLeft,
} from "lucide-react-native";
import { mockMedications } from "../../../types";

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const MedicationCard = ({ medication }) => (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 6,
            }}
          >
            {medication.name}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#666",
              marginBottom: 4,
            }}
          >
            {medication.dosage} • {medication.frequency}
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: "#999",
            }}
          >
            Prescribed by {medication.prescribedBy}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: "#D1FAE5",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <CheckCircle size={24} color="#059669" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <Clock size={16} color="#666" />
        <Text
          style={{
            fontSize: 13,
            color: "#666",
            marginLeft: 8,
          }}
        >
          Next dose: {medication.nextDose}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#F9FAFB",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#1a1a1a",
              }}
            >
              Medications
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#7C3AED",
            borderRadius: 16,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            shadowColor: "#7C3AED",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#ffffff",
              marginLeft: 8,
            }}
          >
            Add Medication
          </Text>
        </TouchableOpacity>

        {/* Today's Medications Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            Today's Medications
          </Text>

          <View
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#DC2626",
                fontWeight: "600",
              }}
            >
              2 due
            </Text>
          </View>
        </View>

        {mockMedications.map((medication) => (
          <MedicationCard key={medication.id} medication={medication} />
        ))}
      </ScrollView>
    </View>
  );
}

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Phone, Mail, MapPin } from "lucide-react-native";

export default function CareTeamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const ProviderCard = ({
    name,
    specialty,
    facility,
    phone,
    email,
    color,
    bgColor,
  }) => (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: color,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: color }}>
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 4,
            }}
          >
            Dr. {name}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              marginBottom: 2,
            }}
          >
            {specialty}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MapPin size={12} color="#999" />
            <Text
              style={{
                fontSize: 12,
                color: "#999",
                marginLeft: 4,
              }}
            >
              {facility}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${phone}`)}
          style={{
            flex: 1,
            backgroundColor: bgColor,
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Phone size={16} color={color} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: color,
              marginLeft: 6,
            }}
          >
            Call
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${email}`)}
          style={{
            flex: 1,
            backgroundColor: bgColor,
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mail size={16} color={color} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: color,
              marginLeft: 6,
            }}
          >
            Email
          </Text>
        </TouchableOpacity>
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
              My Care Team
            </Text>
          </View>
        </View>
      </View>

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
            backgroundColor: "#059669",
            borderRadius: 16,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            shadowColor: "#059669",
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
            Add Healthcare Provider
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 16,
          }}
        >
          Your Healthcare Providers
        </Text>

        <ProviderCard
          name="Sarah Johnson"
          specialty="Primary Care Physician"
          facility="City Medical Center"
          phone="(555) 123-4567"
          email="s.johnson@citymedical.com"
          color="#2563EB"
          bgColor="#DBEAFE"
        />

        <ProviderCard
          name="Michael Chen"
          specialty="Cardiologist"
          facility="Heart Health Clinic"
          phone="(555) 234-5678"
          email="m.chen@hearthealthclinic.com"
          color="#A9334D"
          bgColor="#F8E9E7"
        />

        <ProviderCard
          name="Emily Rodriguez"
          specialty="Mental Health Counselor"
          facility="Wellness Psychology Center"
          phone="(555) 345-6789"
          email="e.rodriguez@wellnesspsych.com"
          color="#059669"
          bgColor="#D1FAE5"
        />

        <ProviderCard
          name="David Park"
          specialty="Endocrinologist"
          facility="Metro Diabetes Center"
          phone="(555) 456-7890"
          email="d.park@metrodiabetes.com"
          color="#A9334D"
          bgColor="#FFEDD5"
        />
      </ScrollView>
    </View>
  );
}

import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Pill,
  Calendar,
  AlertCircle,
  Users,
  FileText,
  MapPin,
  Phone,
  Heart,
} from "lucide-react-native";

export default function CareMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const MenuCard = ({
    title,
    subtitle,
    icon: Icon,
    iconColor,
    iconBg,
    onPress,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#666",
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={32} color={iconColor} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {/* Header with Illustration */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#FFE8E8",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Heart size={64} color="#DC2626" fill="#DC2626" strokeWidth={1.5} />
          </View>

          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: "#1a1a1a",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Care & Support
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#666",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Plans, emergencies, and your care team.
          </Text>
        </View>

        {/* Emergency Help Button */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/care/emergency")}
          style={{
            backgroundColor: "#FF6B6B",
            borderRadius: 16,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            shadowColor: "#FF6B6B",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <Phone size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  marginBottom: 2,
                }}
              >
                Emergency Help
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                Quick access to emergency services
              </Text>
            </View>
          </View>

          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20, color: "#FFFFFF" }}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Menu Cards */}
        <View>
          <MenuCard
            title="Medications"
            subtitle="Track your prescriptions and doses"
            icon={Pill}
            iconColor="#7C3AED"
            iconBg="#F3E8FF"
            onPress={() => router.push("/(tabs)/care/medications")}
          />

          <MenuCard
            title="Appointments"
            subtitle="Manage your healthcare schedule"
            icon={Calendar}
            iconColor="#2563EB"
            iconBg="#DBEAFE"
            onPress={() => router.push("/(tabs)/care/appointments")}
          />

          <MenuCard
            title="My Care Team"
            subtitle="Connect with your healthcare providers"
            icon={Users}
            iconColor="#059669"
            iconBg="#D1FAE5"
            onPress={() => router.push("/(tabs)/care/care-team")}
          />

          <MenuCard
            title="Crisis Plan"
            subtitle="Your personalized emergency plan"
            icon={FileText}
            iconColor="#DC2626"
            iconBg="#FEE2E2"
            onPress={() => router.push("/(tabs)/care/crisis-plan")}
          />

          <MenuCard
            title="Clinics & Hospitals"
            subtitle="Find nearby healthcare facilities"
            icon={MapPin}
            iconColor="#EA580C"
            iconBg="#FFEDD5"
            onPress={() => router.push("/(tabs)/care/facilities")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

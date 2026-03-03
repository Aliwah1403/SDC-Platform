import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Navigation,
  Clock,
} from "lucide-react-native";

export default function FacilitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const FacilityCard = ({
    name,
    type,
    address,
    phone,
    distance,
    hours,
    color,
    bgColor,
  }) => (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
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
            {name}
          </Text>

          <View
            style={{
              backgroundColor: bgColor,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
              alignSelf: "flex-start",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: color,
                textTransform: "capitalize",
              }}
            >
              {type}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MapPin size={16} color="#666" />
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                {address}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Phone size={16} color="#666" />
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginLeft: 8,
                }}
              >
                {phone}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock size={16} color="#666" />
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginLeft: 8,
                }}
              >
                {hours}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: bgColor,
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
            marginLeft: 12,
          }}
        >
          <Navigation size={20} color={color} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: color,
              marginTop: 4,
            }}
          >
            {distance} mi
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: bgColor,
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: color,
            }}
          >
            Get Directions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: color,
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            Call Now
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
              Clinics & Hospitals
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
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 16,
          }}
        >
          Nearby Facilities
        </Text>

        <FacilityCard
          name="City Medical Center"
          type="Hospital"
          address="123 Main St, Downtown"
          phone="(555) 123-4567"
          distance="2.3"
          hours="Open 24/7"
          color="#DC2626"
          bgColor="#FEE2E2"
        />

        <FacilityCard
          name="Quick Care Urgent Care"
          type="Urgent Care"
          address="456 Oak Ave, Midtown"
          phone="(555) 987-6543"
          distance="1.7"
          hours="Mon-Sat 8am-8pm"
          color="#EA580C"
          bgColor="#FFEDD5"
        />

        <FacilityCard
          name="Community Health Center"
          type="Clinic"
          address="789 Elm St, Northside"
          phone="(555) 456-7890"
          distance="3.1"
          hours="Mon-Fri 9am-5pm"
          color="#059669"
          bgColor="#D1FAE5"
        />

        <FacilityCard
          name="Eastside Family Practice"
          type="Clinic"
          address="321 Pine Rd, Eastside"
          phone="(555) 234-5678"
          distance="4.2"
          hours="Mon-Thu 8am-6pm"
          color="#2563EB"
          bgColor="#DBEAFE"
        />

        <FacilityCard
          name="Metro Express Clinic"
          type="Urgent Care"
          address="654 Maple Dr, Westside"
          phone="(555) 345-6789"
          distance="5.0"
          hours="Daily 7am-9pm"
          color="#7C3AED"
          bgColor="#F3E8FF"
        />
      </ScrollView>
    </View>
  );
}

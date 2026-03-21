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
import {
  Phone,
  ChevronLeft,
  AlertCircle,
  MapPin,
  Users,
} from "lucide-react-native";

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const EmergencyCard = ({
    title,
    subtitle,
    phone,
    icon: Icon,
    color,
    bgColor,
  }) => (
    <TouchableOpacity
      onPress={() => phone && Linking.openURL(`tel:${phone}`)}
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
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <Icon size={24} color={color} strokeWidth={2} />
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
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {phone && (
        <View
          style={{
            backgroundColor: bgColor,
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Phone size={18} color={color} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: color,
              marginLeft: 8,
            }}
          >
            {phone}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
              Emergency Help
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
        {/* Warning Banner */}
        <View
          style={{
            backgroundColor: "#FEF3F2",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#FEE2E2",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <AlertCircle size={24} color="#DC2626" strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#DC2626",
                  marginBottom: 8,
                }}
              >
                Emergency Contacts
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#991B1B",
                  lineHeight: 20,
                }}
              >
                If you're experiencing a medical emergency, call 911
                immediately. These contacts are for quick access to emergency
                services.
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 16,
          }}
        >
          Emergency Services
        </Text>

        <EmergencyCard
          title="Emergency Services"
          subtitle="Police, Fire, Medical Emergency"
          phone="911"
          icon={Phone}
          color="#DC2626"
          bgColor="#FEE2E2"
        />

        <EmergencyCard
          title="Crisis Hotline"
          subtitle="24/7 Mental Health Support"
          phone="988"
          icon={Phone}
          color="#A9334D"
          bgColor="#F2EFEC"
        />

        <EmergencyCard
          title="Poison Control"
          subtitle="24/7 Poison Emergency Hotline"
          phone="1-800-222-1222"
          icon={Phone}
          color="#A9334D"
          bgColor="#F2EFEC"
        />

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1a1a1a",
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          My Emergency Contacts
        </Text>

        <EmergencyCard
          title="Primary Contact"
          subtitle="John Doe - Spouse"
          phone="(555) 123-4567"
          icon={Users}
          color="#059669"
          bgColor="#F2EFEC"
        />

        <EmergencyCard
          title="Secondary Contact"
          subtitle="Jane Smith - Sister"
          phone="(555) 987-6543"
          icon={Users}
          color="#2563EB"
          bgColor="#F2EFEC"
        />

        <TouchableOpacity
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 16,
            padding: 20,
            borderWidth: 2,
            borderColor: "#E5E7EB",
            borderStyle: "dashed",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#666",
            }}
          >
            + Add Emergency Contact
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1a1a1a",
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          Nearest Emergency Room
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#F3F4F6",
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
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#F2EFEC",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <MapPin size={24} color="#2563EB" strokeWidth={2} />
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
                City Medical Center ER
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                }}
              >
                2.3 miles away • Open 24/7
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: "#666",
              marginBottom: 12,
            }}
          >
            123 Main St, Downtown
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#DBEAFE",
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#2563EB",
                }}
              >
                Get Directions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL("tel:(555) 123-4567")}
              style={{
                flex: 1,
                backgroundColor: "#2563EB",
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
                Call ER
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

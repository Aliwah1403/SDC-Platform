import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  FileText,
  AlertCircle,
  Heart,
  Users,
  Pill,
  Phone,
} from "lucide-react-native";

export default function CrisisPlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const SectionCard = ({ title, icon: Icon, iconColor, iconBg, children }) => (
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
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1a1a1a",
          }}
        >
          {title}
        </Text>
      </View>
      {children}
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
              Crisis Plan
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
                Emergency Action Plan
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#991B1B",
                  lineHeight: 20,
                }}
              >
                This is your personalized crisis plan. Review and update it
                regularly with your healthcare provider.
              </Text>
            </View>
          </View>
        </View>

        <SectionCard
          title="Warning Signs"
          icon={AlertCircle}
          iconColor="#DC2626"
          iconBg="#FEE2E2"
        >
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            Recognize these early warning signs that you might be entering a
            crisis:
          </Text>
          <View style={{ gap: 8 }}>
            {[
              "Increased anxiety or panic attacks",
              "Difficulty sleeping or oversleeping",
              "Loss of appetite or overeating",
              "Withdrawing from friends and family",
              "Thoughts of self-harm",
            ].map((sign, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", alignItems: "flex-start" }}
              >
                <Text
                  style={{ fontSize: 14, color: "#DC2626", marginRight: 8 }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#666",
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  {sign}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard
          title="Coping Strategies"
          icon={Heart}
          iconColor="#7C3AED"
          iconBg="#F3E8FF"
        >
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            When you notice warning signs, try these coping strategies:
          </Text>
          <View style={{ gap: 8 }}>
            {[
              "Practice deep breathing exercises (5 minutes)",
              "Go for a short walk outside",
              "Listen to calming music",
              "Call a trusted friend or family member",
              "Use your relaxation techniques",
              "Write in your journal",
            ].map((strategy, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: "#7C3AED",
                    marginRight: 12,
                  }}
                />
                <Text style={{ fontSize: 14, color: "#1a1a1a", flex: 1 }}>
                  {strategy}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        <SectionCard
          title="Emergency Contacts"
          icon={Phone}
          iconColor="#059669"
          iconBg="#D1FAE5"
        >
          <View style={{ gap: 12 }}>
            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Crisis Hotline
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#059669",
                }}
              >
                988
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Primary Therapist - Dr. Emily Rodriguez
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#059669",
                }}
              >
                (555) 345-6789
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Trusted Contact - John (Spouse)
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#059669",
                }}
              >
                (555) 123-4567
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard
          title="Medication Information"
          icon={Pill}
          iconColor="#2563EB"
          iconBg="#DBEAFE"
        >
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            Current medications that help manage symptoms:
          </Text>
          <View style={{ gap: 12 }}>
            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Sertraline 50mg
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Take 1 tablet daily in the morning
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Lorazepam 0.5mg (as needed)
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#666",
                }}
              >
                For severe anxiety - max 2 per day
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard
          title="Safe People & Places"
          icon={Users}
          iconColor="#EA580C"
          iconBg="#FFEDD5"
        >
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            People and places that make you feel safe and supported:
          </Text>
          <View style={{ gap: 8 }}>
            {[
              "Home with family",
              "Best friend Sarah's house",
              "Local park walking trail",
              "Community center support group",
            ].map((item, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", alignItems: "flex-start" }}
              >
                <Text
                  style={{ fontSize: 14, color: "#EA580C", marginRight: 8 }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#666",
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <TouchableOpacity
          style={{
            backgroundColor: "#DC2626",
            borderRadius: 16,
            padding: 18,
            alignItems: "center",
            shadowColor: "#DC2626",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#ffffff",
            }}
          >
            Edit Crisis Plan
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

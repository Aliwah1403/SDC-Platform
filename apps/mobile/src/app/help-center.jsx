import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { fonts } from "@/utils/fonts";

const TABS = ["FAQs", "Tips & Tricks"];

const FAQ_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      {
        id: "faq-1",
        title: "What is Hemo?",
        body: "Hemo is your personal sickle cell companion. It helps you track daily symptoms, manage medications, monitor health trends, and stay connected with your care team — all in one place.",
        steps: [],
      },
      {
        id: "faq-2",
        title: "How do I log my daily health check-in?",
        body: "Hemo lets you log how you're feeling multiple times a day.",
        steps: [
          'Tap the "Log Health" button on the Home tab.',
          "Rate your pain level using the animated slider.",
          "Select any body locations where you feel pain.",
          "Add symptoms, mood, hydration, triggers, and notes.",
          'Tap "Save" to record your check-in.',
        ],
      },
      {
        id: "faq-3",
        title: "What is the health streak?",
        body: "Your health streak counts consecutive days you have logged at least one health check-in. Keeping your streak going helps you build a complete health history that your doctor can use.",
        steps: [],
      },
      {
        id: "faq-4",
        title: "Can I repair a missed streak day?",
        body: "Yes. If you miss a day, Hemo gives you streak repairs you can use to fill in the gap. Repairs are earned by completing milestones.",
        steps: [
          'Tap "Repair Streak" from the Home screen when a missed day is detected.',
          "Select the day you want to fill in.",
          "Confirm to use one repair — your streak will be restored.",
        ],
      },
    ],
  },
  {
    title: "Health Tracking",
    items: [
      {
        id: "faq-5",
        title: "What health metrics does Hemo track?",
        body: "Hemo tracks pain level, mood, hydration (glasses of water), sleep duration, step count, and heart rate. All metrics are visualised with charts you can view over 7 days or a full month.",
        steps: [],
      },
      {
        id: "faq-6",
        title: "How do I set a goal for a metric?",
        body: "You can set personal targets for hydration, sleep, and steps.",
        steps: [
          "Go to the Track tab and tap any metric card.",
          'Tap the goal icon in the top-right corner of the detail screen.',
          "Enter your target and save.",
        ],
      },
      {
        id: "faq-7",
        title: "How does Apple Health integration work?",
        body: "When connected, Hemo reads step count, heart rate, and sleep data from Apple Health automatically so you don't have to enter them manually.",
        steps: [
          "Go to Profile → Data & Reports → Apple Health.",
          'Tap "Connect" and grant the requested permissions.',
          "Your Apple Health data will start appearing in your check-in history.",
        ],
      },
    ],
  },
  {
    title: "Medications & Care",
    items: [
      {
        id: "faq-8",
        title: "How do I add a medication?",
        body: "Keep your medication list up to date so Hemo can remind you and include it in your health summary.",
        steps: [
          "Go to the Care tab and tap Medications.",
          'Tap the "+" button in the top-right.',
          "Enter the medication name, dosage, and frequency.",
          'Tap "Save".',
        ],
      },
      {
        id: "faq-9",
        title: "How do I add an emergency contact?",
        body: "Emergency contacts are called or messaged when you trigger the SOS button.",
        steps: [
          "Go to Profile → Medical → Emergency Contacts.",
          'Tap "Add Contact" and choose from your contacts or enter details manually.',
          "You can add up to 3 emergency contacts.",
        ],
      },
      {
        id: "faq-10",
        title: "What is the Crisis Plan?",
        body: "The Crisis Plan is a personalised record of what to do during a sickle cell crisis — your preferred hospital, medications, and instructions for emergency responders. You can fill it in under the Care tab.",
        steps: [],
      },
    ],
  },
  {
    title: "Account & Privacy",
    items: [
      {
        id: "faq-11",
        title: "How do I change my nickname?",
        body: "Your nickname is what Hemo uses to greet you throughout the app.",
        steps: [
          "Go to Profile → Profile → Nickname.",
          "Type your new nickname (up to 20 characters).",
          'Tap "Save".',
        ],
      },
      {
        id: "faq-12",
        title: "Is my health data private?",
        body: "Yes. Your health data is stored securely and is never sold or shared with third parties. Only you and the care team members you explicitly share with can access your information.",
        steps: [],
      },
      {
        id: "faq-13",
        title: "How do I enable App Lock?",
        body: "App Lock requires Face ID or Touch ID each time you open Hemo, keeping your health data private.",
        steps: [
          "Go to Profile → Account → App Lock.",
          "Toggle App Lock on.",
          "Choose how long before the app locks (immediately, 1 min, 5 min, etc.).",
        ],
      },
    ],
  },
];

const TIPS_SECTIONS = [
  {
    title: "Daily Check-ins",
    items: [
      {
        id: "tip-1",
        title: "Log at the Same Time Each Day",
        body: "Building a consistent logging habit gives you the most accurate health picture. Set a daily check-in reminder in Profile → Reminders so Hemo nudges you at the right time.",
        steps: [],
      },
      {
        id: "tip-2",
        title: "Use the Pain Orb to Be Precise",
        body: "When logging pain, drag the slider slowly — the orb changes colour and pulses to reflect intensity. A precise pain score helps your doctor spot trends early.",
        steps: [],
      },
      {
        id: "tip-3",
        title: "Add Notes for Your Doctor",
        body: "The Notes field in your check-in is the perfect place to describe unusual symptoms, what triggered them, or questions you want to raise at your next appointment.",
        steps: [],
      },
    ],
  },
  {
    title: "Health Insights",
    items: [
      {
        id: "tip-4",
        title: "Check Weekly Trends, Not Just Today",
        body: "A single bad day can look alarming in isolation. Switch to the 7-day or monthly view on any metric chart to see whether things are improving overall.",
        steps: [
          "Go to the Track tab and tap a metric card.",
          'Use the "7D" / "Month" toggle at the top of the chart.',
        ],
      },
      {
        id: "tip-5",
        title: "Share Your Health Summary with Your Doctor",
        body: "Before an appointment, generate a Health Summary to give your doctor a quick snapshot of your recent data.",
        steps: [
          "Go to Profile → Data & Reports → Share Health Summary.",
          "Choose how to share (message, email, etc.).",
        ],
      },
      {
        id: "tip-6",
        title: "Connect Apple Health for Automatic Data",
        body: "Linking Apple Health means steps, heart rate, and sleep fill in automatically — so your check-ins take less time and miss fewer data points.",
        steps: [
          "Go to Profile → Data & Reports → Apple Health.",
          'Tap "Connect" and grant permissions.',
        ],
      },
    ],
  },
  {
    title: "Medications",
    items: [
      {
        id: "tip-7",
        title: "Keep Your Medication List Current",
        body: "Your active medications appear in your health summary. An up-to-date list helps emergency responders and your care team make safe decisions quickly.",
        steps: [],
      },
      {
        id: "tip-8",
        title: "Use the Care Hub During a Crisis",
        body: "The Care tab has your Crisis Plan, preferred hospital, and emergency contacts all in one place — exactly what you need when things escalate fast.",
        steps: [
          "Tap the Care tab.",
          "Open Crisis Plan to review your instructions.",
          "Use the SOS button (bottom-right of any main tab) to call for help instantly.",
        ],
      },
    ],
  },
  {
    title: "Streaks & Rewards",
    items: [
      {
        id: "tip-9",
        title: "Earn Streak Repairs by Hitting Milestones",
        body: "Completing health milestones (like a 7-day streak) earns you repairs. Save them for emergencies so a missed day doesn't reset all your progress.",
        steps: [],
      },
      {
        id: "tip-10",
        title: "Check Your Streak Before Bed",
        body: "If you haven't logged today, a quick 30-second check-in before bed keeps your streak alive and gives tomorrow-you better trend data to work with.",
        steps: [],
      },
    ],
  },
];

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const sections = activeTab === 0 ? FAQ_SECTIONS : TIPS_SECTIONS;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#ffffff",
          paddingTop: insets.top + 10,
          paddingBottom: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#F0E4E1",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.7}
              style={[styles.tab, activeTab === i && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === i && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={{ marginBottom: 28 }}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() =>
                      router.push({
                        pathname: "/help-center-article",
                        params: {
                          items: JSON.stringify(section.items),
                          initialIndex: i,
                        },
                      })
                    }
                    style={styles.row}
                  >
                    <Text style={styles.rowText} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <ChevronRight size={18} color="#C4A8A4" />
                  </TouchableOpacity>
                  {i < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8F4F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 17,
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: "#A9334D",
  },
  tabText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "#9CA3AF",
  },
  tabTextActive: {
    fontFamily: "Geist_600SemiBold",
    color: "#A9334D",
  },
  sectionHeader: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 11,
    color: "#9CA3AF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0E4E1",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  rowText: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
    color: "#1A1A1A",
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#F8E9E7",
    marginLeft: 16,
  },
});

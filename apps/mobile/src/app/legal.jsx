import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

const CONTACT_EMAIL = "info@hemo-scd.com";

/**
 * Legal content for the Privacy Policy and Terms of Use screens.
 * Kept in sync with the web app (apps/web/src/pages/Privacy & Terms).
 */
const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    effectiveDate: "Current as of May 21, 2026",
    intro:
      "Your privacy matters to us at Hemo. We respect your privacy regarding any information we may collect from you across our website and app.",
    sections: [
      {
        paragraphs: [
          "This Privacy Notice for Hemo SCD ('we', 'us', or 'our') describes how and why we may collect, store, use, and share your personal information when you interact with our services, including when you:",
        ],
        bullets: [
          "Visit our website at hemo-scd.com",
          "Join our waitlist to receive early access and launch updates",
          "Download and use the Hemo mobile app once it is available",
          "Contact us or engage with us in other related ways",
        ],
      },
      {
        callout: true,
        heading: "Questions or concerns?",
        paragraphs: [
          `Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our services. If you have any questions or concerns, please contact us at ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "What information do we collect?",
        paragraphs: [
          "At this stage, Hemo is pre-launch. The only personal information we collect is your email address when you join our waitlist. We do not collect health data, location, payment details, or any other personal information through this website.",
          "Once the app is live, we will collect information you voluntarily provide — such as account details, health log entries, and care preferences — to deliver app functionality. This notice will be updated with full detail before that time.",
        ],
      },
      {
        heading: "How do we use your information?",
        paragraphs: ["Your email address is used solely to:"],
        bullets: [
          "Notify you when Hemo launches",
          "Share relevant pre-launch updates and early access information",
        ],
        paragraphsAfter: [
          "We do not use your email for advertising, profiling, or any purpose beyond the above.",
        ],
      },
      {
        heading: "Do we share your information?",
        paragraphs: [
          "We do not sell, trade, or share your personal information with third parties. Your email address is stored securely and is only accessible to the Hemo team.",
        ],
      },
      {
        heading: "How long do we keep your information?",
        paragraphs: [
          "We keep your email address on the waitlist until you request removal or until the waitlist is closed at launch. You can ask us to delete your information at any time.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `Depending on your location, you may have the right to access, correct, or delete your personal data. To exercise any of these rights — including removing yourself from the waitlist — contact us at ${CONTACT_EMAIL} and we will respond promptly.`,
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We may update this Privacy Notice from time to time. The updated version will be indicated by an updated 'Current as of' date at the top of this page. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification to the email address you provided. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    effectiveDate: "Current as of May 21, 2026",
    intro:
      "Please read these terms carefully before using Hemo or joining our waitlist. By accessing our website or services, you agree to be bound by these terms.",
    sections: [
      {
        paragraphs: [
          "These Terms of Use govern your access to and use of the Hemo website and, once available, the Hemo mobile application ('Services'), operated by Hemo SCD ('we', 'us', or 'our'). By using our Services, you confirm that you accept these terms.",
        ],
      },
      {
        callout: true,
        heading: "Questions or concerns?",
        paragraphs: [
          `If you have any questions about these terms or how they apply to you, please contact us at ${CONTACT_EMAIL} and we will be happy to help.`,
        ],
      },
      {
        heading: "Not a medical service",
        paragraphs: [
          "Hemo is a health tracking and management tool. It is not a medical device, a diagnostic tool, or a substitute for professional medical advice, diagnosis, or treatment. Nothing within Hemo should be interpreted as clinical guidance.",
          "Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition. In an emergency, contact your local emergency services immediately. The in-app SOS feature is a convenience tool for alerting personal contacts — it is not a replacement for calling emergency services.",
        ],
      },
      {
        heading: "Use of service",
        paragraphs: [
          "You may use Hemo for personal, non-commercial health tracking purposes only. You agree not to misuse the Services, attempt to gain unauthorised access, or use the Services in any way that could harm others or disrupt the platform.",
          "You must be at least 13 years of age to use Hemo. If you are under 18, you should review these terms with a parent or guardian.",
        ],
      },
      {
        heading: "Waitlist",
        paragraphs: [
          `By joining the Hemo waitlist, you agree to receive email communications about the app's launch and pre-launch updates. You can unsubscribe at any time by contacting us at ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "Account responsibilities",
        paragraphs: [
          "Once the app is live, you are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorised access or breach of security.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "All content, branding, and materials on the Hemo website and app — including the name, logo, and design — are owned by Hemo SCD. You may not reproduce, distribute, or create derivative works from any part of our Services without our written permission.",
        ],
      },
      {
        heading: "Availability and changes",
        paragraphs: [
          "Hemo is currently pre-launch. Features, pricing, and availability may change before and after release. We reserve the right to modify or discontinue any part of the Services at any time. We will make reasonable efforts to communicate significant changes to waitlist members.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "To the fullest extent permitted by law, Hemo SCD shall not be liable for any indirect, incidental, or consequential damages arising from your use of our Services. Our Services are provided 'as is' without warranties of any kind.",
        ],
      },
      {
        heading: "Changes to these terms",
        paragraphs: [
          "We may update these terms from time to time. The 'Current as of' date at the top of this page will reflect when changes were last made. Continued use of the Services after any update constitutes your acceptance of the revised terms.",
        ],
      },
    ],
  },
};

/**
 * Renders a paragraph string, turning the contact email into a tappable link.
 */
function Paragraph({ text, styles }) {
  const parts = text.split(CONTACT_EMAIL);
  if (parts.length === 1) {
    return <Text style={styles.body}>{text}</Text>;
  }
  return (
    <Text style={styles.body}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              {CONTACT_EMAIL}
            </Text>
          )}
        </React.Fragment>
      ))}
    </Text>
  );
}

export default function LegalScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const styles = createStyles(t);

  const doc = LEGAL_CONTENT[type] ?? LEGAL_CONTENT.privacy;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          backgroundColor: t.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {doc.title}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: insets.bottom + 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.effectiveDate}>{doc.effectiveDate}</Text>
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.intro}>{doc.intro}</Text>

        {doc.sections.map((section, i) => {
          if (section.callout) {
            return (
              <View key={i} style={styles.callout}>
                {section.heading && (
                  <Text style={styles.calloutHeading}>{section.heading}</Text>
                )}
                {section.paragraphs?.map((p, j) => (
                  <Paragraph key={j} text={p} styles={styles} />
                ))}
              </View>
            );
          }
          return (
            <View key={i} style={styles.section}>
              {section.heading && (
                <Text style={styles.heading}>{section.heading}</Text>
              )}
              {section.paragraphs?.map((p, j) => (
                <Paragraph key={j} text={p} styles={styles} />
              ))}
              {section.bullets?.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  {section.bullets.map((b, j) => (
                    <View key={j} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              )}
              {section.paragraphsAfter?.map((p, j) => (
                <Paragraph key={`after-${j}`} text={p} styles={styles} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(t) {
  return StyleSheet.create({
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: "Geist_600SemiBold",
      fontSize: 16,
      color: t.text,
    },
    effectiveDate: {
      fontFamily: "Geist_500Medium",
      fontSize: 13,
      color: t.accent,
      marginBottom: 8,
    },
    title: {
      fontFamily: "Geist_700Bold",
      fontSize: 30,
      color: t.text,
      lineHeight: 38,
      marginBottom: 14,
    },
    intro: {
      fontFamily: "Geist_400Regular",
      fontSize: 16,
      color: t.textSecondary,
      lineHeight: 26,
      marginBottom: 8,
    },
    section: {
      marginTop: 26,
    },
    heading: {
      fontFamily: "Geist_600SemiBold",
      fontSize: 19,
      color: t.text,
      lineHeight: 26,
      marginBottom: 10,
    },
    body: {
      fontFamily: "Geist_400Regular",
      fontSize: 16,
      color: t.textSecondary,
      lineHeight: 26,
      marginBottom: 12,
    },
    link: {
      fontFamily: "Geist_500Medium",
      color: t.accent,
    },
    callout: {
      marginTop: 26,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 4,
    },
    calloutHeading: {
      fontFamily: "Geist_600SemiBold",
      fontSize: 16,
      color: t.text,
      marginBottom: 8,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 10,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: t.accent,
      marginTop: 10,
      flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      fontFamily: "Geist_400Regular",
      fontSize: 16,
      color: t.textSecondary,
      lineHeight: 26,
    },
  });
}

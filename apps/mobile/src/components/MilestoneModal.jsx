import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  BookOpen,
  Clock,
  Droplet,
  Heart,
  Target,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react-native";
import { BadgeHeroGradient } from "./BadgeHeroGradient";
import { StreakFireIcon } from "@/utils/streakFire";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

const MILESTONE_ICONS = {
  days: Trophy,
  streak: StreakFireIcon,
  symptoms: Target,
  hydration: Droplet,
  care: Heart,
  learning: BookOpen,
  repair: Wrench,
  restart: Zap,
  medications: Clock,
};

const MILESTONE_BADGE_IMAGES = {
  days: require("../../assets/images/badges/getting-started.svg"),
  streak: require("../../assets/images/badges/first-streak.svg"),
  symptoms: require("../../assets/images/badges/pattern-seeker.svg"),
  hydration: require("../../assets/images/badges/hydration-junkie.png"),
  care: require("../../assets/images/badges/self-care.svg"),
  learning: require("../../assets/images/badges/knowledge-seeker.svg"),
  repair: require("../../assets/images/badges/back-on-track.svg"),
  restart: require("../../assets/images/badges/resilient-restart.svg"),
  medications: require("../../assets/images/badges/on-time.svg"),
};

const MILESTONE_COLORS = {
  days: { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  streak: { primary: "#781D11", secondary: "#9B3628", bg: "#FFF9F9" },
  symptoms: { primary: "#D09F9A", secondary: "#B8827C", bg: "#F8E9E7" },
  hydration: { primary: "#2563EB", secondary: "#3B82F6", bg: "#EFF6FF" },
  care: { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  learning: { primary: "#059669", secondary: "#34D399", bg: "#ECFDF5" },
  repair: { primary: "#781D11", secondary: "#9B3628", bg: "#FFF9F9" },
  restart: { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  medications: { primary: "#059669", secondary: "#34D399", bg: "#ECFDF5" },
};

const RARITY_CONFIG = {
  Common: { color: "#9CA3AF" },
  Uncommon: { color: "#059669" },
  Rare: { color: "#2563EB" },
  Epic: { color: "#A9334D" },
  Legendary: { color: "#781D11" },
  Mythic: { color: "#D09F9A" },
};

const RARITY_SEGMENTS = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
  Mythic: 5,
};

export default function MilestoneModal({ visible, milestone, onClose }) {
  const t = useTheme();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const CONTENT_H = SCREEN_H * 0.9;
  const HERO_H = CONTENT_H * 0.44;

  const insets = useSafeAreaInsets();

  if (!milestone) return null;

  const Icon = MILESTONE_ICONS[milestone.type];
  const colors = MILESTONE_COLORS[milestone.type];
  const segments = RARITY_SEGMENTS[milestone.rarity];
  const badgeImage = milestone.image ?? MILESTONE_BADGE_IMAGES[milestone.type];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        {/* Tap-to-dismiss backdrop */}
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Main content card */}
        <View style={[s.card, { height: CONTENT_H, backgroundColor: t.surface }]}>
          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <View style={[s.hero, { height: HERO_H }]}>
            {/* SVG background — true radial blobs + 160° linear gradient */}
            <BadgeHeroGradient width={SCREEN_W} height={HERO_H} />

            {/* Close button */}
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeBtnX}>✕</Text>
            </TouchableOpacity>

            {/* Badge */}
            <View style={[s.badgeWrapper, { opacity: milestone.unlocked ? 1 : 0.4 }]}>
              <Image
                source={badgeImage}
                style={s.badgeImage}
                contentFit="contain"
              />
            </View>
          </View>

          {/* ── SHEET ─────────────────────────────────────────────────────── */}
          <View style={[s.sheet, { paddingBottom: insets.bottom + 32, backgroundColor: t.surface }]}>
            {/* Handle */}
            <View style={[s.handle, { backgroundColor: t.border }]} />

            {/* Inner content */}
            <View style={s.sheetContent}>
              {/* Title */}
              <Text style={[s.title, { color: t.text }]}>{milestone.name}</Text>

              {/* Description */}
              <Text style={[s.description, { color: t.textSecondary }]}>{milestone.description}</Text>

              {/* Rarity bar */}
              <View style={s.raritySection}>
                <View style={s.rarityRow}>
                  <Text style={[s.rarityLabel, { color: t.textSecondary }]}>Rarity</Text>
                  <Text style={s.rarityValue}>{milestone.rarity}</Text>
                </View>
                <View style={s.rarityBar}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <View
                      key={n}
                      style={[
                        s.raritySegment,
                        {
                          backgroundColor:
                            n <= segments ? "#F0531C" : t.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Requirement */}
              <View style={[s.requirementCard, { backgroundColor: t.isDark ? t.surfaceElevated : "#F8F4F0", borderColor: t.border }]}>
                <View
                  style={[
                    s.requirementIconBox,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Icon size={20} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={s.requirementText}>
                  <Text style={[s.requirementLabel, { color: t.textSecondary }]}>Requirement met</Text>
                  <Text style={[s.requirementValue, { color: t.text }]}>
                    {milestone.requirement}
                  </Text>
                </View>
              </View>

              {/* Spacer */}
              <View style={{ flex: 1 }} />

              {/* Bottom: unlock date or progress */}
              {milestone.unlocked && milestone.unlockedDate ? (
                <View style={[s.unlockRow, { borderTopColor: t.border }]}>
                  <View style={s.unlockDot} />
                  <Text style={[s.unlockLabel, { color: t.textSecondary }]}>Unlocked</Text>
                  <Text style={[s.unlockDate, { color: t.text }]}>{milestone.unlockedDate}</Text>
                </View>
              ) : milestone.progress !== undefined ? (
                <View style={[s.progressSection, { borderTopColor: t.border }]}>
                  <View style={s.progressHeader}>
                    <Text style={[s.requirementLabel, { color: t.textSecondary }]}>Progress</Text>
                    <Text style={s.rarityValue}>{milestone.progress}%</Text>
                  </View>
                  <View style={[s.progressTrack, { backgroundColor: t.border }]}>
                    <View
                      style={[
                        s.progressFill,
                        {
                          width: `${milestone.progress}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "100%",
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
  },

  // Hero
  hero: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0E4E1",
    zIndex: 10,
  },
  closeBtnX: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  // Note: dynamic colors (card bg, sheet bg, handle, text) applied via inline overrides using useTheme()
  badgeWrapper: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeImage: {
    width: 260,
    height: 260,
  },
  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F0E4E1",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 21,
    marginBottom: 24,
  },

  // Rarity
  raritySection: {
    marginBottom: 24,
  },
  rarityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rarityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  rarityValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F0531C",
  },
  rarityBar: {
    flexDirection: "row",
    gap: 6,
  },
  raritySegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },

  // Requirement
  requirementCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F8F4F0",
    borderWidth: 1,
    borderColor: "#F0E4E1",
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
  },
  requirementIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  requirementText: {
    flex: 1,
  },
  requirementLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  requirementValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Unlock date
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0E4E1",
  },
  unlockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F0531C",
  },
  unlockLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  unlockDate: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Progress
  progressSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0E4E1",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#F0E4E1",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});

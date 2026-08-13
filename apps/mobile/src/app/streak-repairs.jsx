import { View, Text, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { X, Wrench, Shield, Sparkles, Gift } from "lucide-react-native";
import { StreakFireIcon } from "@/utils/streakFire";
import { useStreakQuery } from "@/hooks/queries/useStreakQuery";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/utils/fonts";
import { PressableScale } from "@/components/PressableScale";
import { enterTiming, STAGGER_MS } from "@/utils/motion";

const HEMO = {
  dark: "#781D11",
  wine: "#A9334D",
  rose: "#D09F9A",
  blush: "#F8E9E7",
};

const WINE_TINT = "rgba(169,51,77,0.08)";

function StatBlock({ value, label, valueColor, t }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontFamily: fonts.extrabold, fontSize: 32, color: valueColor, lineHeight: 36 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t.textSecondary, marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}

function StatDivider({ t }) {
  return <View style={{ width: 1, backgroundColor: t.divider, marginHorizontal: 8 }} />;
}

function HowItWorksRow({ icon: Icon, text, t, isLast }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: isLast ? 0 : 20 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: WINE_TINT,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        {Icon ? <Icon size={22} color={HEMO.wine} strokeWidth={1.8} /> : <StreakFireIcon size={28} />}
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.regular,
          fontSize: 15,
          color: t.text,
          lineHeight: 22,
          paddingTop: 4,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function StreakRepairsScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: streak } = useStreakQuery();

  const daysTarget = streak?.daysUntilNextRepair ?? 30;
  const repairProgress = streak?.repairProgress ?? 0;
  const repairsAvailable = streak?.repairsAvailable ?? 0;
  const repairsUsed = streak?.repairsUsed ?? 0;
  const repairsEarned = streak?.repairsEarned ?? 0;

  const progressPercentage = Math.min((repairProgress / daysTarget) * 100, 100);
  const daysLeft = Math.max(daysTarget - repairProgress, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={["bottom", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Gradient hero — extends to the very top; close button floats on top of it */}
        <LinearGradient
          colors={
            t.isDark
              ? ["#1A0F0F", "#2A1419", "#1F1F1F"]
              : ["#FFF9F8", "#F8E9E7", "#ECDAD4"]
          }
          style={{ paddingTop: insets.top + 12, paddingBottom: 40, paddingHorizontal: 24, alignItems: "center" }}
        >
          <PressableScale
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: insets.top + 12,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(26,26,26,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color={t.text} />
          </PressableScale>

          <View style={{ marginBottom: 20 }}>
            <LinearGradient
              colors={[HEMO.rose, HEMO.wine, HEMO.dark]}
              style={{
                width: 108,
                height: 108,
                borderRadius: 54,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wrench size={46} color={HEMO.blush} strokeWidth={1.6} />
            </LinearGradient>
            <View
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "#F0531C",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: t.isDark ? "#1F1F1F" : "#ECDAD4",
              }}
            >
              <Shield size={16} color="#fff" strokeWidth={2.2} />
            </View>
          </View>

          <Text
            style={{
              fontFamily: fonts.extrabold,
              fontSize: 30,
              color: t.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Streak Repairs
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 15,
              color: t.textSecondary,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            Use repairs to bridge gaps and keep your streak alive
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
          {/* Stats row */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enterTiming}
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <StatBlock value={repairsAvailable} label="Available" valueColor={HEMO.wine} t={t} />
            <StatDivider t={t} />
            <StatBlock value={repairsUsed} label="Total used" valueColor={t.text} t={t} />
            <StatDivider t={t} />
            <StatBlock value={repairsEarned} label="Total earned" valueColor={t.text} t={t} />
          </MotiView>

          <View style={{ height: 1, backgroundColor: t.divider, marginVertical: 28 }} />

          {/* Next repair progress */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ ...enterTiming, delay: STAGGER_MS }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Sparkles size={13} color={t.textSecondary} strokeWidth={2} />
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 11,
                  color: t.textSecondary,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Next Repair
              </Text>
            </View>

            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.text, marginBottom: 10 }}>
              {repairProgress}/{daysTarget} consecutive days logged
            </Text>

            <View
              style={{
                height: 8,
                backgroundColor: t.isDark ? t.surfaceElevated : "#F3ECE9",
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <LinearGradient
                colors={[HEMO.rose, HEMO.wine]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${progressPercentage}%`, height: "100%" }}
              />
            </View>

            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary }}>
              {daysLeft} consecutive day{daysLeft !== 1 ? "s" : ""} left to earn your next repair
            </Text>
          </MotiView>

          <View style={{ height: 1, backgroundColor: t.divider, marginVertical: 28 }} />

          {/* How repairs work */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ ...enterTiming, delay: STAGGER_MS * 2 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 }}>
              <Gift size={13} color={t.textSecondary} strokeWidth={2} />
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 11,
                  color: t.textSecondary,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                How Repairs Work
              </Text>
            </View>

            <HowItWorksRow
              icon={Gift}
              t={t}
              text="You start with 3 available repairs"
            />
            <HowItWorksRow
              icon={Sparkles}
              t={t}
              text={`Earn 1 repair for every ${daysTarget} consecutive days logged`}
            />
            <HowItWorksRow
              icon={Wrench}
              t={t}
              text="Use repairs to bridge gaps and preserve streak continuity"
            />
            <HowItWorksRow
              icon={null}
              t={t}
              text="Repairs don't add to your streak count, but keep it alive"
              isLast
            />
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

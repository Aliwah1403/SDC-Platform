import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

// Draws a circular arc as an SVG path
// cx, cy = center; r = radius; startAngle/endAngle in degrees
function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function getScoreLabel(score) {
  if (score >= 7) return { label: "Good", color: "#34D399" };
  if (score >= 4) return { label: "Fair", color: "#FBBF24" };
  return { label: "Needs Attention", color: "#F87171" };
}

export function TodayHealthCard() {
  const router = useRouter();
  const { healthData, healthStreak } = useAppStore();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayData = healthData.find((d) => d.date === todayStr);

  const hasLogged = todayData != null;

  // Calculate health score (0–10)
  const score = hasLogged
    ? (() => {
        const painScore = (10 - (todayData.painLevel || 0)) * 0.4;
        const moodScore = ((todayData.mood || 0) / 5) * 10 * 0.3;
        const hydrationScore =
          Math.min((todayData.hydration || 0) / 8, 1) * 10 * 0.3;
        return Math.round((painScore + moodScore + hydrationScore) * 10) / 10;
      })()
    : null;

  const scoreInfo = score != null ? getScoreLabel(score) : null;

  // Arc geometry
  const arcCx = CARD_WIDTH / 2;
  const arcCy = 110;
  const arcR = 70;
  const arcStart = 135; // degrees — bottom-left start
  const arcEnd = 405; // = 45 degrees (bottom-right end), giving 270° sweep
  const progressEnd = hasLogged
    ? arcStart + (score / 10) * 270
    : arcStart;

  return (
    <View
      style={{
        backgroundColor: "#09332C",
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: "hidden",
        paddingBottom: 24,
      }}
    >
      {/* Decorative background circles */}
      <View
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "rgba(78, 205, 196, 0.07)",
          top: -60,
          right: -40,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(240, 83, 28, 0.06)",
          bottom: 20,
          left: -20,
        }}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 4,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 18,
            color: "#FFFFFF",
          }}
        >
          Today's Health
        </Text>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.12)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      {hasLogged ? (
        <>
          {/* SVG Arc */}
          <Svg width={CARD_WIDTH} height={160}>
            {/* Track arc (background) */}
            <Path
              d={describeArc(arcCx, arcCy, arcR, arcStart, arcEnd)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            {score > 0 && (
              <Path
                d={describeArc(arcCx, arcCy, arcR, arcStart, progressEnd)}
                stroke={scoreInfo.color}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
              />
            )}
            {/* End dot */}
            {score > 0 && (
              <Circle
                cx={
                  arcCx +
                  arcR *
                    Math.cos(((progressEnd * Math.PI) / 180))
                }
                cy={
                  arcCy +
                  arcR *
                    Math.sin(((progressEnd * Math.PI) / 180))
                }
                r={6}
                fill={scoreInfo.color}
              />
            )}
          </Svg>

          {/* Score label centred in the arc */}
          <View
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.extrabold,
                fontSize: 42,
                color: "#FFFFFF",
                lineHeight: 48,
              }}
            >
              {score}
            </Text>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 15,
                color: scoreInfo.color,
                marginTop: 2,
              }}
            >
              {scoreInfo.label}
            </Text>
          </View>

          {/* Stat chips */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              paddingHorizontal: 20,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.10)",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: "#FFFFFF",
                }}
              >
                {todayData.painLevel || 0}
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {" "}
                  / 10
                </Text>
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 2,
                }}
              >
                Pain level
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.10)",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: "#FFFFFF",
                }}
              >
                {todayData.hydration || 0}
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {" "}
                  / 8
                </Text>
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 2,
                }}
              >
                Hydration
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.10)",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: "#FFFFFF",
                }}
              >
                {healthStreak}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 2,
                }}
              >
                Day streak
              </Text>
            </View>
          </View>
        </>
      ) : (
        /* Empty state */
        <View
          style={{
            alignItems: "center",
            paddingVertical: 32,
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 17,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            No health data yet today
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Log your symptoms to see your personalised health score
          </Text>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/symptoms")}
        style={{
          marginHorizontal: 20,
          backgroundColor: hasLogged
            ? "rgba(255,255,255,0.12)"
            : "#F0531C",
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 15,
            color: "#FFFFFF",
          }}
        >
          {hasLogged ? "View full health log →" : "Log today's health →"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

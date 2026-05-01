import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_WIDTH = (SCREEN_WIDTH - 48) / 2; // 16 margin each side + 16 gap

// ─── Mini arc ring for hydration ────────────────────────────────────────────

function ArcRing({ progress, size = 44 }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * Math.min(progress, 1);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={cx} cy={cy} r={r}
        stroke="#F0E4E1"
        strokeWidth={5}
        fill="none"
      />
      <Circle
        cx={cx} cy={cy} r={r}
        stroke="#A9334D"
        strokeWidth={5}
        fill="none"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${cx},${cy}`}
      />
    </Svg>
  );
}

// ─── Individual tile ─────────────────────────────────────────────────────────

function MetricTile({ title, value, unit, statusLabel, visual, metric, hasData }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={hasData ? 0.85 : 1}
      onPress={() =>
        hasData &&
        router.push({ pathname: "/metric-detail", params: { metric } })
      }
      style={{
        width: TILE_WIDTH,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Title + arrow */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
            color: "#6B7280",
          }}
        >
          {title}
        </Text>
        {hasData && (
          <Text style={{ fontSize: 14, color: "#D09F9A" }}>›</Text>
        )}
      </View>

      {/* Visual + value */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: fonts.extrabold,
              fontSize: 28,
              color: hasData ? "#1F2937" : "#D1D5DB",
              lineHeight: 32,
            }}
          >
            {value}
            {unit ? (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: "#9CA3AF",
                }}
              >
                {" "}{unit}
              </Text>
            ) : null}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 11,
              color: hasData ? "#A9334D" : "#D1D5DB",
              marginTop: 2,
            }}
          >
            {statusLabel}
          </Text>
        </View>
        {visual}
      </View>
    </TouchableOpacity>
  );
}

// ─── Mood emoji helper ────────────────────────────────────────────────────────

function getMoodEmoji(mood) {
  if (mood >= 5) return "😄";
  if (mood >= 4) return "🙂";
  if (mood >= 3) return "😐";
  if (mood >= 2) return "😔";
  if (mood >= 1) return "😞";
  return "";
}

function getMoodStatus(mood) {
  if (mood >= 4) return "Good";
  if (mood === 3) return "Fair";
  if (mood > 0)  return "Low";
  return "No data";
}

// ─── Steps progress bar ───────────────────────────────────────────────────────

function StepsBar({ steps }) {
  const progress = Math.min(steps / 10000, 1);
  return (
    <View style={{ width: 40 }}>
      <View
        style={{
          height: 4,
          backgroundColor: "#F0E4E1",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: "#A9334D",
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────

export function MetricGrid({ selectedDateData }) {
  const hydration = selectedDateData?.hydration ?? 0;
  const mood = selectedDateData?.mood ?? 0;
  const steps = selectedDateData?.steps ?? 0;
  const sleep = selectedDateData?.sleepHours ?? 0;

  const hydrationStatus =
    hydration === 0 ? "No data" :
    hydration >= 8  ? "At goal" : "Below goal";

  const stepsStatus =
    steps === 0      ? "No data" :
    steps >= 10000   ? "Goal reached" :
    steps >= 5000    ? "In progress" : "Below typical";

  const sleepStatus =
    sleep === 0 ? "No data" :
    sleep >= 8  ? "Well rested" :
    sleep >= 6  ? "Adequate" : "Short night";

  return (
    <View
      style={{
        paddingHorizontal: 16,
        marginBottom: 16,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <MetricTile
        title="Hydration"
        value={hydration > 0 ? String(hydration) : "—"}
        unit={hydration > 0 ? "/ 8" : ""}
        statusLabel={hydrationStatus}
        metric="hydration"
        hasData={hydration > 0}
        visual={
          <ArcRing progress={hydration / 8} />
        }
      />

      <MetricTile
        title="Mood"
        value={mood > 0 ? getMoodEmoji(mood) : "—"}
        unit=""
        statusLabel={getMoodStatus(mood)}
        metric="mood"
        hasData={mood > 0}
        visual={null}
      />

      <MetricTile
        title="Steps"
        value={steps > 0 ? steps.toLocaleString() : "—"}
        unit=""
        statusLabel={stepsStatus}
        metric="steps"
        hasData={steps > 0}
        visual={steps > 0 ? <StepsBar steps={steps} /> : null}
      />

      <MetricTile
        title="Sleep"
        value={sleep > 0 ? String(sleep) : "—"}
        unit={sleep > 0 ? "hrs" : ""}
        statusLabel={sleepStatus}
        metric="sleep"
        hasData={sleep > 0}
        visual={null}
      />
    </View>
  );
}

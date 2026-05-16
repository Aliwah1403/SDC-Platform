import { MotiView } from "moti";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

const BURGUNDY = "#A9334D";
const STROKE = 1.8;

function Doodle({ style, delay = 0, rotation = 0, opacity = 0.14, children }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity, scale: 1 }}
      transition={{ type: "spring", damping: 16, stiffness: 70, delay }}
      style={[
        { position: "absolute", transform: [{ rotate: `${rotation}deg` }] },
        style,
      ]}
    >
      {children}
    </MotiView>
  );
}

function HeartSvg({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DropletSvg({ size = 36 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EcgSvg({ width = 72 }) {
  const h = 28;
  const w = width;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Path
        d={`M0 ${h / 2} L${w * 0.15} ${h / 2} L${w * 0.28} ${h * 0.14} L${w * 0.43} ${h * 0.86} L${w * 0.56} ${h / 2} L${w * 0.72} ${h / 2} L${w * 0.82} ${h * 0.25} L${w * 0.91} ${h * 0.75} L${w} ${h / 2}`}
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CrossSvg({ size = 30 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2v20M2 12h20"
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PillSvg({ width = 52, height = 24 }) {
  const r = height / 2 - 1;
  const mid = width / 2;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path
        d={`M${r + 1} 1 H${width - r - 1} A${r} ${r} 0 0 1 ${width - r - 1} ${height - 1} H${r + 1} A${r} ${r} 0 0 1 ${r + 1} 1 Z`}
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        fill="none"
      />
      <Line
        x1={mid}
        y1="1"
        x2={mid}
        y2={height - 1}
        stroke={BURGUNDY}
        strokeWidth={STROKE}
      />
    </Svg>
  );
}

// Crescent shape — thematic for sickle cell disease
function CrescentSvg({ size = 38 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StethoscopeDotsSvg({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        fill="none"
      />
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={BURGUNDY}
        strokeWidth={STROKE}
        fill="none"
      />
    </Svg>
  );
}

export default function SplashAnimation({ exiting = false, onExitComplete }) {
  return (
    <MotiView
      style={[StyleSheet.absoluteFill, styles.root]}
      animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.04 : 1 }}
      transition={{ type: "timing", duration: 450 }}
      onDidAnimate={(key, finished) => {
        if (key === "opacity" && finished && exiting) onExitComplete?.();
      }}
    >
      {/* Health doodles scattered around the edges */}
      <Doodle style={{ top: "8%", left: "7%" }} delay={300} rotation={-15}>
        <HeartSvg size={44} />
      </Doodle>

      <Doodle style={{ top: "9%", right: "9%" }} delay={150} rotation={10}>
        <DropletSvg size={36} />
      </Doodle>

      <Doodle style={{ top: "21%", left: "4%" }} delay={400} rotation={-8}>
        <EcgSvg width={70} />
      </Doodle>

      <Doodle style={{ top: "42%", left: "4%" }} delay={200} rotation={0}>
        <CrossSvg size={32} />
      </Doodle>

      <Doodle style={{ top: "40%", right: "5%" }} delay={350} rotation={45}>
        <CrescentSvg size={38} />
      </Doodle>

      <Doodle style={{ bottom: "22%", right: "7%" }} delay={250} rotation={-20}>
        <PillSvg width={50} height={22} />
      </Doodle>

      <Doodle
        style={{ bottom: "14%", left: "9%" }}
        delay={450}
        rotation={12}
        opacity={0.11}
      >
        <HeartSvg size={28} />
      </Doodle>

      <Doodle
        style={{ bottom: "28%", left: "28%" }}
        delay={500}
        rotation={5}
        opacity={0.11}
      >
        <EcgSvg width={55} />
      </Doodle>

      <Doodle
        style={{ bottom: "10%", right: "12%" }}
        delay={380}
        rotation={0}
        opacity={0.12}
      >
        <StethoscopeDotsSvg size={30} />
      </Doodle>

      {/* Center content */}
      <View style={styles.center}>
        <MotiView
          from={{ scale: 0.82, opacity: 0, translateY: 10 }}
          animate={{ scale: 1, opacity: 1, translateY: 0 }}
          transition={{
            type: "spring",
            damping: 18,
            stiffness: 90,
            delay: 100,
          }}
          style={styles.logoWrapper}
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.logo}>Hemo</Text>
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: 550 }}
          >
            <Text style={styles.tagline}>Your sickle cell companion</Text>
          </MotiView>
        </MotiView>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#FFFFFF",
    zIndex: 100,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    alignItems: "center",
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 18,
  },
  logo: {
    fontFamily: "Geist_800ExtraBold",
    fontSize: 62,
    color: "#A9334D",
    letterSpacing: -3,
    textAlign: "center",
  },
  tagline: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "rgba(169, 51, 77, 0.45)",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 0.3,
  },
});

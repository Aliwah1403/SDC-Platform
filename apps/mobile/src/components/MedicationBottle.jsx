import React from "react";
import Svg, {
  Path, Circle, Ellipse, Rect, Line, G,
  Text as SvgText, Defs, LinearGradient, Stop, ClipPath,
} from "react-native-svg";

function lighten(hex, amount = 0.5) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ── Pill Bottle (tablet / capsule / softgel) ─────────────────────────────────
function PillBottle({ color, drugName, subIcon, width = 120, height = 160 }) {
  const light = lighten(color, 0.72);
  const mid = lighten(color, 0.45);
  const label = truncate(drugName, 11);
  return (
    <Svg width={width} height={height} viewBox="0 0 120 160">
      <Defs>
        <LinearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={mid} stopOpacity="1" />
          <Stop offset="0.45" stopColor={light} stopOpacity="1" />
          <Stop offset="1" stopColor={mid} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="1" />
          <Stop offset="1" stopColor={mid} stopOpacity="1" />
        </LinearGradient>
        <ClipPath id="bodyClip">
          <Rect x="26" y="50" width="68" height="100" rx="16" />
        </ClipPath>
      </Defs>

      {/* Body shadow */}
      <Rect x="28" y="54" width="68" height="100" rx="16" fill={color} opacity="0.10" />

      {/* Bottle body */}
      <Rect x="26" y="50" width="68" height="100" rx="16" fill="url(#bottleGrad)" />

      {/* Shine strip on body */}
      <Rect x="30" y="55" width="12" height="88" rx="6" fill="#fff" opacity="0.22" />

      {/* Neck */}
      <Rect x="38" y="34" width="44" height="20" rx="6" fill={mid} />
      <Rect x="40" y="36" width="10" height="16" rx="5" fill="#fff" opacity="0.18" />

      {/* Cap */}
      <Rect x="30" y="14" width="60" height="24" rx="10" fill="url(#capGrad)" />
      {/* Cap grip lines */}
      <Line x1="38" y1="18" x2="38" y2="34" stroke="#fff" strokeWidth="2" strokeOpacity="0.25" />
      <Line x1="47" y1="18" x2="47" y2="34" stroke="#fff" strokeWidth="2" strokeOpacity="0.25" />
      <Line x1="56" y1="18" x2="56" y2="34" stroke="#fff" strokeWidth="2" strokeOpacity="0.25" />
      <Line x1="65" y1="18" x2="65" y2="34" stroke="#fff" strokeWidth="2" strokeOpacity="0.25" />
      <Line x1="74" y1="18" x2="74" y2="34" stroke="#fff" strokeWidth="2" strokeOpacity="0.25" />
      {/* Cap top shine */}
      <Rect x="34" y="17" width="24" height="6" rx="3" fill="#fff" opacity="0.3" />

      {/* Label background */}
      <Rect x="30" y="70" width="60" height="54" rx="8" fill="#fff" opacity="0.92" />
      {/* Label border accent */}
      <Rect x="30" y="70" width="60" height="4" rx="3" fill={color} opacity="0.5" />

      {/* Sub-icon area */}
      {subIcon}

      {/* Drug name on label */}
      <SvgText
        x="60"
        y="114"
        textAnchor="middle"
        fontSize={label.length > 8 ? "7.5" : "9"}
        fontWeight="600"
        fill="#09332C"
        letterSpacing="0.3"
      >
        {label}
      </SvgText>
    </Svg>
  );
}

function TabletBottle({ color, drugName, width, height }) {
  const c = color;
  const lc = lighten(color, 0.5);
  const subIcon = (
    <G>
      <Circle cx="60" cy="93" r="10" fill={lc} />
      <Path d="M60 83 A10 10 0 0 0 60 103 Z" fill={c} clipPath="url(#bodyClip)" />
      <Circle cx="60" cy="93" r="10" fill="none" stroke={c} strokeWidth="1" />
    </G>
  );
  return <PillBottle color={color} drugName={drugName} subIcon={subIcon} width={width} height={height} />;
}

function CapsuleBottle({ color, drugName, width, height }) {
  const lc = lighten(color, 0.5);
  const subIcon = (
    <G>
      <Rect x="48" y="87" width="24" height="12" rx="6" fill={lc} />
      <Path d="M60 87 H52 A6 6 0 0 0 46 93 A6 6 0 0 0 52 99 H60 Z" fill={color} />
      <Rect x="46" y="87" width="28" height="12" rx="6" fill="none" stroke={color} strokeWidth="1" />
    </G>
  );
  return <PillBottle color={color} drugName={drugName} subIcon={subIcon} width={width} height={height} />;
}

function SoftgelBottle({ color, drugName, width, height }) {
  const subIcon = (
    <G>
      <Ellipse cx="60" cy="93" rx="12" ry="8" fill={color} opacity="0.85" />
      <Path d="M52 89 Q56 86 62 88" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
    </G>
  );
  return <PillBottle color={color} drugName={drugName} subIcon={subIcon} width={width} height={height} />;
}

// ── Liquid Bottle ─────────────────────────────────────────────────────────────
function LiquidBottle({ color, drugName, width = 120, height = 160 }) {
  const light = lighten(color, 0.72);
  const mid = lighten(color, 0.4);
  const label = truncate(drugName, 11);
  return (
    <Svg width={width} height={height} viewBox="0 0 120 160">
      <Defs>
        <LinearGradient id="liqBodyGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={mid} stopOpacity="1" />
          <Stop offset="0.4" stopColor={light} stopOpacity="1" />
          <Stop offset="1" stopColor={mid} stopOpacity="1" />
        </LinearGradient>
        <ClipPath id="liqBodyClip">
          <Rect x="16" y="52" width="88" height="98" rx="22" />
        </ClipPath>
      </Defs>

      {/* Body shadow */}
      <Rect x="18" y="56" width="88" height="98" rx="22" fill={color} opacity="0.08" />

      {/* Body */}
      <Rect x="16" y="52" width="88" height="98" rx="22" fill="url(#liqBodyGrad)" />

      {/* Liquid fill */}
      <Rect x="16" y="108" width="88" height="42" rx="22" fill={color} opacity="0.45" clipPath="url(#liqBodyClip)" />
      {/* Liquid surface wave */}
      <Path d="M16 108 Q32 103 52 108 Q72 113 88 108 L104 108" stroke={lighten(color, 0.3)} strokeWidth="1.5" fill="none" />

      {/* Measurement marks */}
      <Line x1="92" y1="78" x2="98" y2="78" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
      <Line x1="94" y1="88" x2="98" y2="88" stroke={color} strokeWidth="1.2" strokeOpacity="0.4" />
      <Line x1="92" y1="98" x2="98" y2="98" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
      <Line x1="94" y1="108" x2="98" y2="108" stroke={color} strokeWidth="1.2" strokeOpacity="0.4" />
      <Line x1="92" y1="118" x2="98" y2="118" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />

      {/* Body shine */}
      <Rect x="20" y="58" width="12" height="84" rx="6" fill="#fff" opacity="0.2" />

      {/* Neck */}
      <Rect x="38" y="34" width="44" height="22" rx="6" fill={mid} />

      {/* Cap */}
      <Rect x="32" y="14" width="56" height="24" rx="10" fill={color} />
      <Rect x="36" y="17" width="22" height="7" rx="3.5" fill="#fff" opacity="0.28" />

      {/* Label */}
      <Rect x="22" y="62" width="66" height="44" rx="8" fill="#fff" opacity="0.88" />
      <Rect x="22" y="62" width="66" height="4" rx="3" fill={color} opacity="0.5" />

      <SvgText
        x="55"
        y="93"
        textAnchor="middle"
        fontSize={label.length > 8 ? "7.5" : "9"}
        fontWeight="600"
        fill="#09332C"
        letterSpacing="0.3"
      >
        {label}
      </SvgText>
    </Svg>
  );
}

// ── Ointment Tube ─────────────────────────────────────────────────────────────
function OintmentTube({ color, drugName, width = 120, height = 160 }) {
  const light = lighten(color, 0.65);
  const mid = lighten(color, 0.35);
  const label = truncate(drugName, 10);
  return (
    <Svg width={width} height={height} viewBox="0 0 120 160">
      <Defs>
        <LinearGradient id="tubeGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={mid} />
          <Stop offset="0.5" stopColor={light} />
          <Stop offset="1" stopColor={mid} />
        </LinearGradient>
      </Defs>

      {/* Tube body (vertical) */}
      <Rect x="36" y="40" width="48" height="88" rx="10" fill="url(#tubeGrad)" />
      {/* Body shine */}
      <Rect x="40" y="46" width="10" height="74" rx="5" fill="#fff" opacity="0.22" />

      {/* Label area */}
      <Rect x="38" y="58" width="44" height="48" rx="7" fill="#fff" opacity="0.88" />
      <Rect x="38" y="58" width="44" height="4" rx="3" fill={color} opacity="0.5" />
      <SvgText
        x="60"
        y="90"
        textAnchor="middle"
        fontSize={label.length > 8 ? "7" : "8.5"}
        fontWeight="600"
        fill="#09332C"
        letterSpacing="0.3"
      >
        {label}
      </SvgText>

      {/* Nozzle / cap at top */}
      <Rect x="46" y="22" width="28" height="22" rx="8" fill={color} />
      <Path d="M52 22 L60 10 L68 22 Z" fill={color} />
      <Circle cx="60" cy="13" r="4" fill={lighten(color, 0.3)} />
      <Rect x="50" y="24" width="14" height="6" rx="3" fill="#fff" opacity="0.3" />

      {/* Crimped bottom end */}
      <Rect x="32" y="126" width="56" height="16" rx="3" fill={mid} />
      <Line x1="36" y1="128" x2="84" y2="128" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.4" />
      <Line x1="36" y1="132" x2="84" y2="132" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.4" />
      <Line x1="36" y1="136" x2="84" y2="136" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.4" />
      {/* Crimp fold marks */}
      <Path d="M36 142 Q60 138 84 142" stroke={color} strokeWidth="2" fill="none" strokeOpacity="0.5" />
    </Svg>
  );
}

// ── Inhaler ───────────────────────────────────────────────────────────────────
function Inhaler({ color, drugName, width = 120, height = 160 }) {
  const light = lighten(color, 0.65);
  const mid = lighten(color, 0.35);
  const label = truncate(drugName, 9);
  return (
    <Svg width={width} height={height} viewBox="0 0 120 160">
      <Defs>
        <LinearGradient id="canGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={mid} />
          <Stop offset="0.5" stopColor={light} />
          <Stop offset="1" stopColor={mid} />
        </LinearGradient>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={lighten(color, 0.2)} />
          <Stop offset="0.5" stopColor={mid} />
          <Stop offset="1" stopColor={lighten(color, 0.2)} />
        </LinearGradient>
      </Defs>

      {/* Actuator body (main housing) */}
      <Rect x="28" y="72" width="64" height="76" rx="14" fill="url(#bodyGrad)" />
      {/* Body shine */}
      <Rect x="32" y="78" width="10" height="62" rx="5" fill="#fff" opacity="0.18" />

      {/* Canister slot opening at top of body */}
      <Rect x="44" y="72" width="32" height="14" rx="4" fill={lighten(color, 0.15)} />

      {/* Metal canister */}
      <Rect x="40" y="18" width="40" height="60" rx="12" fill="url(#canGrad)" />
      <Ellipse cx="60" cy="18" rx="20" ry="8" fill={lighten(color, 0.55)} />
      <Rect x="44" y="20" width="12" height="50" rx="6" fill="#fff" opacity="0.18" />
      {/* Canister base ring */}
      <Rect x="38" y="68" width="44" height="8" rx="4" fill={mid} />

      {/* Label on canister */}
      <Rect x="44" y="30" width="32" height="32" rx="5" fill="#fff" opacity="0.82" />
      <Rect x="44" y="30" width="32" height="3.5" rx="2.5" fill={color} opacity="0.5" />
      <SvgText
        x="60"
        y="52"
        textAnchor="middle"
        fontSize={label.length > 7 ? "6.5" : "7.5"}
        fontWeight="600"
        fill="#09332C"
        letterSpacing="0.2"
      >
        {label}
      </SvgText>

      {/* Mouthpiece at bottom */}
      <Rect x="36" y="138" width="48" height="16" rx="8" fill={color} />
      <Rect x="72" y="140" width="16" height="12" rx="4" fill={light} />
      {/* Mouthpiece opening ring */}
      <Rect x="74" y="141" width="12" height="10" rx="3" fill={lighten(color, 0.2)} />

      {/* Vent hole */}
      <Circle cx="60" cy="118" r="6" fill={lighten(color, 0.15)} />
      <Circle cx="60" cy="118" r="4" fill={lighten(color, 0.55)} />
    </Svg>
  );
}

// ── Injection Vial ────────────────────────────────────────────────────────────
function InjectionVial({ color, drugName, width = 120, height = 160 }) {
  const light = lighten(color, 0.75);
  const mid = lighten(color, 0.4);
  const label = truncate(drugName, 10);
  return (
    <Svg width={width} height={height} viewBox="0 0 120 160">
      <Defs>
        <LinearGradient id="vialGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={mid} stopOpacity="0.25" />
          <Stop offset="0.35" stopColor={light} stopOpacity="0.6" />
          <Stop offset="1" stopColor={mid} stopOpacity="0.25" />
        </LinearGradient>
        <ClipPath id="vialClip">
          <Rect x="34" y="50" width="52" height="100" rx="10" />
        </ClipPath>
      </Defs>

      {/* Vial glass body */}
      <Rect x="34" y="50" width="52" height="100" rx="10" fill="#E8F4F1" />
      <Rect x="34" y="50" width="52" height="100" rx="10" fill="url(#vialGrad)" />
      <Rect x="34" y="50" width="52" height="100" rx="10" fill="none" stroke={mid} strokeWidth="1.5" />

      {/* Liquid inside vial */}
      <Rect x="36" y="100" width="48" height="48" rx="9" fill={color} opacity="0.25" clipPath="url(#vialClip)" />
      {/* Liquid surface */}
      <Path d="M36 100 Q60 96 84 100" stroke={mid} strokeWidth="1.2" fill="none" />

      {/* Glass shine */}
      <Rect x="38" y="55" width="10" height="88" rx="5" fill="#fff" opacity="0.3" />

      {/* Measurement marks */}
      <Line x1="76" y1="65" x2="82" y2="65" stroke={mid} strokeWidth="1.2" strokeOpacity="0.6" />
      <Line x1="78" y1="75" x2="82" y2="75" stroke={mid} strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="76" y1="85" x2="82" y2="85" stroke={mid} strokeWidth="1.2" strokeOpacity="0.6" />
      <Line x1="78" y1="95" x2="82" y2="95" stroke={mid} strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="76" y1="105" x2="82" y2="105" stroke={mid} strokeWidth="1.2" strokeOpacity="0.6" />

      {/* Aluminum crimp ring */}
      <Rect x="32" y="56" width="56" height="12" rx="4" fill={mid} opacity="0.7" />
      <Line x1="34" y1="62" x2="86" y2="62" stroke="#fff" strokeWidth="1" strokeOpacity="0.4" />

      {/* Rubber stopper */}
      <Rect x="34" y="40" width="52" height="20" rx="6" fill={color} opacity="0.75" />
      <Rect x="36" y="42" width="18" height="8" rx="4" fill="#fff" opacity="0.25" />

      {/* Label */}
      <Rect x="36" y="68" width="48" height="28" rx="6" fill="#fff" opacity="0.9" />
      <Rect x="36" y="68" width="48" height="3.5" rx="2.5" fill={color} opacity="0.5" />
      <SvgText
        x="60"
        y="86"
        textAnchor="middle"
        fontSize={label.length > 8 ? "6.5" : "7.5"}
        fontWeight="600"
        fill="#09332C"
        letterSpacing="0.2"
      >
        {label}
      </SvgText>

      {/* Bottom of vial — rounded */}
      <Ellipse cx="60" cy="150" rx="26" ry="5" fill={mid} opacity="0.2" />
    </Svg>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

const BOTTLES = {
  tablet:    TabletBottle,
  capsule:   CapsuleBottle,
  softgel:   SoftgelBottle,
  liquid:    LiquidBottle,
  ointment:  OintmentTube,
  inhaler:   Inhaler,
  injection: InjectionVial,
};

/**
 * Hero-sized medication illustration with drug name as label.
 *
 * Props:
 *   type     — one of: tablet | capsule | softgel | liquid | ointment | inhaler | injection
 *   color    — hex color from category
 *   drugName — displayed on the label
 *   size     — rendered size in points (default 200); maintains 120:160 aspect ratio
 */
export default function MedicationBottle({ type = "tablet", color = "#A9334D", drugName = "", size = 200 }) {
  const Bottle = BOTTLES[type] ?? BOTTLES.tablet;
  // All bottles use a 120x160 viewBox; scale to requested size
  const width = size * (120 / 160);
  const height = size;
  // Clone with overridden width/height by passing props
  return <Bottle color={color} drugName={drugName} width={width} height={height} />;
}

import React from "react";
import Svg, { Path, Circle, Ellipse, Rect, Line, G, Defs, ClipPath } from "react-native-svg";

/**
 * Maps API dose form strings (RxNorm / OpenFDA) to internal type keys.
 * Call this when setting the `type` field from an API response.
 */
export function normalizeDoseForm(apiDoseForm = "") {
  const f = apiDoseForm.toUpperCase();
  if (f.includes("SOFTGEL"))                                    return "softgel";
  if (f.includes("CAPSULE"))                                    return "capsule";
  if (f.includes("TABLET"))                                     return "tablet";
  if (f.includes("CREAM") || f.includes("OINTMENT") || f.includes("TOPICAL")) return "ointment";
  if (f.includes("INHALER") || f.includes("INHALATION"))       return "inhaler";
  if (f.includes("INJECT") || f.includes("SYRINGE"))           return "injection";
  if (f.includes("SOLUTION") || f.includes("LIQUID") || f.includes("SYRUP")) return "liquid";
  return "tablet";
}

// Lighten a hex color by mixing with white
function lighten(hex, amount = 0.45) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function TabletIcon({ color, size }) {
  const light = lighten(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="tabletClip">
          <Circle cx="24" cy="24" r="18" />
        </ClipPath>
      </Defs>
      {/* Left half */}
      <Path d="M24 6 A18 18 0 0 0 24 42 Z" fill={color} clipPath="url(#tabletClip)" />
      {/* Right half */}
      <Path d="M24 6 A18 18 0 0 1 24 42 Z" fill={light} clipPath="url(#tabletClip)" />
      {/* Outer ring */}
      <Circle cx="24" cy="24" r="18" fill="none" stroke={color} strokeWidth="1.5" />
      {/* Score line */}
      <Line x1="24" y1="7" x2="24" y2="41" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
    </Svg>
  );
}

function CapsuleIcon({ color, size }) {
  const light = lighten(color, 0.5);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="capsuleClip">
          <Rect x="8" y="16" width="32" height="16" rx="8" />
        </ClipPath>
      </Defs>
      {/* Left dome — solid color */}
      <Path d="M24 16 H16 A8 8 0 0 0 8 24 A8 8 0 0 0 16 32 H24 Z" fill={color} />
      {/* Right dome — light */}
      <Path d="M24 16 H32 A8 8 0 0 1 40 24 A8 8 0 0 1 32 32 H24 Z" fill={light} />
      {/* Divider */}
      <Line x1="24" y1="16" x2="24" y2="32" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
      {/* Outline */}
      <Rect x="8" y="16" width="32" height="16" rx="8" fill="none" stroke={color} strokeWidth="1.5" />
      {/* Sheen */}
      <Path d="M13 19 Q16 17 19 18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
    </Svg>
  );
}

function SoftgelIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Oval body */}
      <Ellipse cx="24" cy="24" rx="14" ry="10" fill={color} />
      {/* Outline */}
      <Ellipse cx="24" cy="24" rx="14" ry="10" fill="none" stroke={lighten(color, 0.2)} strokeWidth="1.5" />
      {/* Sheen arc */}
      <Path d="M16 19 Q20 16 26 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.55" fill="none" />
    </Svg>
  );
}

function LiquidIcon({ color, size }) {
  const light = lighten(color, 0.6);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Bottle body */}
      <Path
        d="M18 14 L18 10 Q18 8 20 8 L28 8 Q30 8 30 10 L30 14 Q34 16 34 20 L34 38 Q34 40 32 40 L16 40 Q14 40 14 38 L14 20 Q14 16 18 14 Z"
        fill="#F3F4F6"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Liquid fill */}
      <Path
        d="M14 28 L14 38 Q14 40 16 40 L32 40 Q34 40 34 38 L34 28 Z"
        fill={color}
        opacity="0.85"
      />
      {/* Liquid surface wave */}
      <Path d="M14 28 Q20 25 27 28 Q31 30 34 28" stroke={lighten(color, 0.3)} strokeWidth="1" fill="none" />
      {/* Cap */}
      <Rect x="17" y="6" width="14" height="6" rx="2" fill={color} />
    </Svg>
  );
}

function OintmentIcon({ color, size }) {
  const light = lighten(color, 0.5);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Tube body */}
      <Rect x="10" y="18" width="24" height="14" rx="4" fill={light} stroke={color} strokeWidth="1.5" />
      {/* Crimped end */}
      <Rect x="8" y="20" width="5" height="10" rx="1" fill={color} />
      <Line x1="9" y1="22" x2="12" y2="22" stroke="#fff" strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="9" y1="25" x2="12" y2="25" stroke="#fff" strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="9" y1="28" x2="12" y2="28" stroke="#fff" strokeWidth="1" strokeOpacity="0.5" />
      {/* Nozzle */}
      <Path d="M34 22 L40 24 L34 26 Z" fill={color} />
      {/* Label stripe */}
      <Rect x="14" y="22" width="16" height="8" rx="2" fill={color} opacity="0.18" />
    </Svg>
  );
}

function InhalerIcon({ color, size }) {
  const light = lighten(color, 0.5);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Canister (vertical) */}
      <Rect x="18" y="8" width="12" height="22" rx="5" fill={light} stroke={color} strokeWidth="1.5" />
      {/* Body (horizontal mouthpiece) */}
      <Rect x="10" y="26" width="28" height="12" rx="5" fill={color} />
      {/* Mouthpiece opening */}
      <Rect x="34" y="29" width="6" height="6" rx="2" fill={light} />
      {/* Sheen on canister */}
      <Path d="M21 11 Q24 9 26 11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" fill="none" />
    </Svg>
  );
}

function InjectionIcon({ color, size }) {
  const light = lighten(color, 0.55);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Barrel */}
      <Rect x="10" y="20" width="24" height="8" rx="3" fill={light} stroke={color} strokeWidth="1.5" />
      {/* Plunger handle */}
      <Rect x="6" y="22" width="6" height="4" rx="1" fill={color} />
      {/* Plunger rod */}
      <Rect x="8" y="23" width="4" height="2" rx="0.5" fill={color} />
      {/* Needle */}
      <Path d="M34 23.5 L44 24 L34 24.5 Z" fill={color} />
      {/* Tick marks on barrel */}
      <Line x1="18" y1="20" x2="18" y2="28" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      <Line x1="22" y1="20" x2="22" y2="28" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      <Line x1="26" y1="20" x2="26" y2="28" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Fluid fill indicator */}
      <Rect x="10" y="20" width="14" height="8" rx="3" fill={color} opacity="0.18" />
    </Svg>
  );
}

const ICONS = {
  tablet:    TabletIcon,
  capsule:   CapsuleIcon,
  softgel:   SoftgelIcon,
  liquid:    LiquidIcon,
  ointment:  OintmentIcon,
  inhaler:   InhalerIcon,
  injection: InjectionIcon,
};

export default function MedicationIcon({ type = "tablet", color = "#A9334D", size = 48 }) {
  const Icon = ICONS[type] ?? ICONS.tablet;
  return <Icon color={color} size={size} />;
}

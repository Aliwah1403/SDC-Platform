import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { GlassWater, Coffee, CupSoda, Wine, Milk } from "lucide-react-native";
import { DEFAULT_ICON_KEY } from "@/constants/hydrationContainers";

// Drink-container icons for the hydration feature. Mirrors the registry pattern
// in MedicationIcon.jsx: a key -> renderer map, one <ContainerIcon> entry point.
// lucide covers most vessels; bottle + boba have no lucide equivalent, so they
// are hand-drawn to match lucide's 24px / stroke-2 / round-cap line style.

// Shared stroke props so custom icons sit visually with the lucide ones.
const STROKE = { fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

function BottleIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* cap */}
      <Path d="M9 2h6v2H9z" stroke={color} {...STROKE} />
      {/* shoulders + body */}
      <Path
        d="M9 4v2.2c0 .8-1 1.3-1 2.8V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9c0-1.5-1-2-1-2.8V4"
        stroke={color}
        {...STROKE}
      />
      {/* grip stripe */}
      <Path d="M8 13.5h8" stroke={color} {...STROKE} />
    </Svg>
  );
}

function BobaIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* straw */}
      <Path d="M13.5 3 15 8" stroke={color} {...STROKE} />
      {/* lid */}
      <Path d="M6 7h12" stroke={color} {...STROKE} />
      {/* cup body (tapered) */}
      <Path d="M6.5 7 8 20.3A1.5 1.5 0 0 0 9.5 21.5h5a1.5 1.5 0 0 0 1.5-1.2L17.5 7" stroke={color} {...STROKE} />
      {/* tapioca pearls */}
      <Circle cx="10" cy="18.5" r="0.9" fill={color} />
      <Circle cx="12.3" cy="19" r="0.9" fill={color} />
      <Circle cx="14" cy="18.3" r="0.9" fill={color} />
    </Svg>
  );
}

// key -> component. lucide icons already accept { color, size }.
const ICONS = {
  "glass-water": GlassWater,
  bottle: BottleIcon,
  mug: Coffee,
  cup: CupSoda,
  wine: Wine,
  boba: BobaIcon,
  carton: Milk,
};

// Editor picker grid — order also drives the "Add container" default (first).
export const CONTAINER_ICON_OPTIONS = [
  { key: "glass-water", label: "Glass" },
  { key: "bottle", label: "Bottle" },
  { key: "mug", label: "Mug" },
  { key: "cup", label: "Cup" },
  { key: "wine", label: "Wine" },
  { key: "boba", label: "Boba" },
  { key: "carton", label: "Carton" },
];

export { DEFAULT_ICON_KEY } from "@/constants/hydrationContainers";

export default function ContainerIcon({ iconKey, color = "#A9334D", size = 24 }) {
  const Icon = ICONS[iconKey] ?? ICONS[DEFAULT_ICON_KEY];
  return <Icon color={color} size={size} strokeWidth={2} />;
}

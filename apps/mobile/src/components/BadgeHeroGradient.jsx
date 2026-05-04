import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  RadialGradient,
  Stop,
  Rect,
  Circle,
} from "react-native-svg";

export function BadgeHeroGradient({ width, height }) {
  const blobTRcx = width - 104;
  const blobTRcy = 104;
  const blobTRr = 144;

  const blobBLcx = 82;
  const blobBLcy = height - 172;
  const blobBLr = 112;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <Defs>
        <SvgLinear
          id="heroLinear"
          gradientUnits="userSpaceOnUse"
          x1={width * 0.7}
          y1={0}
          x2={width * 0.3}
          y2={height}
        >
          <Stop offset="0" stopColor="#F2EEE8" stopOpacity="1" />
          <Stop offset="0.6" stopColor="#EDE0DA" stopOpacity="1" />
          <Stop offset="1" stopColor="#E2CCC6" stopOpacity="1" />
        </SvgLinear>

        <RadialGradient
          id="blobTR"
          gradientUnits="userSpaceOnUse"
          cx={blobTRcx}
          cy={blobTRcy}
          r={blobTRr}
        >
          <Stop offset="0" stopColor="#A9334D" stopOpacity="0.18" />
          <Stop offset="0.7" stopColor="#A9334D" stopOpacity="0.04" />
          <Stop offset="1" stopColor="#A9334D" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient
          id="blobBL"
          gradientUnits="userSpaceOnUse"
          cx={blobBLcx}
          cy={blobBLcy}
          r={blobBLr}
        >
          <Stop offset="0" stopColor="#F0531C" stopOpacity="0.16" />
          <Stop offset="0.7" stopColor="#F0531C" stopOpacity="0.04" />
          <Stop offset="1" stopColor="#F0531C" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect x={0} y={0} width={width} height={height} fill="url(#heroLinear)" />
      <Circle cx={blobTRcx} cy={blobTRcy} r={blobTRr} fill="url(#blobTR)" />
      <Circle cx={blobBLcx} cy={blobBLcy} r={blobBLr} fill="url(#blobBL)" />
    </Svg>
  );
}

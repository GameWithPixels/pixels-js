import Svg, {
  SvgProps,
  Defs,
  LinearGradient,
  Stop,
  G,
  Circle,
  Path,
} from "react-native-svg";
const SvgComponent = ({
  size,
  color1,
  color2,
  ...props
}: { size: number; color1: string; color2: string } & Omit<
  SvgProps,
  "width" | "height"
>) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <Defs>
      <LinearGradient
        id="linear-gradient"
        x1={-111.6}
        x2={-111.07}
        y1={41.5}
        y2={41.5}
        gradientTransform="matrix(52 0 0 -52 5806.59 2173.29)"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset={0} stopColor={color1} />
        <Stop offset={1} stopColor={color2} />
      </LinearGradient>
    </Defs>
    <G transform={`scale(${size / 30.42})`}>
      <Circle fill="url(#linear-gradient)" cx={17.26} cy={15.21} r={13.9} />
      <Path
        fill={props.color ?? "#FFF"}
        d="M21.17 15.35c0 .33-.27.6-.6.6h-2.71v2.71c0 .33-.27.6-.6.6s-.6-.27-.6-.6v-2.71h-2.71c-.33 0-.6-.27-.6-.6s.27-.6.6-.6h2.71v-2.71c0-.33.27-.6.6-.6s.6.27.6.6v2.71h2.71c.33 0 .6.27.6.6Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

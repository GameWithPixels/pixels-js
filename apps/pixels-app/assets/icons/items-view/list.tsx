import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="M6.06 1.98c.85 0 1.53.68 1.53 1.53v3.05c0 .85-.68 1.53-1.53 1.53H3.01c-.84 0-1.53-.68-1.53-1.53V3.51c0-.84.68-1.53 1.53-1.53h3.05ZM31 3c1.13 0 2.04.91 2.04 2.04S32.13 7.08 31 7.08H12.68c-1.13 0-2.04-.91-2.04-2.04S11.55 3 12.68 3H31Zm0 10.18c1.13 0 2.04.91 2.04 2.04s-.91 2.04-2.04 2.04H12.68c-1.13 0-2.04-.91-2.04-2.04s.91-2.04 2.04-2.04H31Zm0 10.18c1.13 0 2.04.91 2.04 2.04s-.91 2.04-2.04 2.04H12.68c-1.13 0-2.04-.91-2.04-2.04s.91-2.04 2.04-2.04H31ZM1.48 13.69c0-.85.68-1.53 1.53-1.53h3.05c.85 0 1.53.68 1.53 1.53v3.05c0 .85-.68 1.53-1.53 1.53H3.01c-.84 0-1.53-.68-1.53-1.53v-3.05Zm4.58 8.65c.85 0 1.53.68 1.53 1.53v3.05c0 .85-.68 1.53-1.53 1.53H3.01c-.84 0-1.53-.68-1.53-1.53v-3.05c0-.85.68-1.53 1.53-1.53h3.05Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;
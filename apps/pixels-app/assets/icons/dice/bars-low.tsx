import Svg, { SvgProps, G, Path } from "react-native-svg";
const SvgComponent = ({
  size,
  shadedColor,
  ...props
}: { size: number; shadedColor?: string } & Omit<
  SvgProps,
  "width" | "height"
>) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="M12.99 15.21c-1.44 0-2.63 1.18-2.63 2.58v8.75c0 1.49 1.18 2.68 2.58 2.68s2.68-1.18 2.68-2.63v-8.8c0-1.4-1.18-2.58-2.63-2.58ZM4.23 22.22c-1.44 0-2.63 1.18-2.63 2.58v1.75c0 1.49 1.18 2.68 2.58 2.68s2.68-1.18 2.68-2.63v-1.75a2.64 2.64 0 0 0-2.63-2.63Z"
      />
      <Path
        fill={shadedColor ?? "#737374"}
        d="M21.74 8.21c-1.44 0-2.63 1.18-2.63 2.58v15.76c0 1.49 1.18 2.68 2.58 2.68 1.49 0 2.68-1.18 2.68-2.63V10.79c0-1.4-1.18-2.58-2.63-2.58Zm8.75-7.01c-1.44 0-2.63 1.18-2.63 2.58v22.76c0 1.49 1.18 2.68 2.58 2.68s2.68-1.18 2.68-2.63V3.78c0-1.4-1.18-2.58-2.63-2.58Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

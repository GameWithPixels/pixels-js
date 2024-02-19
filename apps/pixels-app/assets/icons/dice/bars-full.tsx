import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="M12.88 15.21c-1.44 0-2.63 1.18-2.63 2.58v8.76c0 1.49 1.18 2.68 2.58 2.68s2.68-1.18 2.68-2.63v-8.8c0-1.4-1.18-2.58-2.63-2.58Zm-8.76 7c-1.44 0-2.63 1.18-2.63 2.58v1.75c0 1.49 1.18 2.68 2.58 2.68s2.68-1.18 2.68-2.63v-1.75a2.64 2.64 0 0 0-2.63-2.63ZM21.63 8.2C20.19 8.2 19 9.38 19 10.78v15.76c0 1.49 1.18 2.68 2.58 2.68 1.49 0 2.68-1.18 2.68-2.63V10.78c0-1.4-1.18-2.58-2.63-2.58Zm8.76-7c-1.44 0-2.63 1.18-2.63 2.58v22.76c0 1.49 1.18 2.68 2.58 2.68s2.68-1.18 2.68-2.63V3.78c0-1.4-1.18-2.58-2.63-2.58Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

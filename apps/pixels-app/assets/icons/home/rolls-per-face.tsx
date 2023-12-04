import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="M13.45 4.74a2.86 2.86 0 0 1 2.86-2.86h1.9a2.86 2.86 0 0 1 2.86 2.86v20.94a2.86 2.86 0 0 1-2.86 2.86h-1.9a2.86 2.86 0 0 1-2.86-2.86V4.74ZM3.93 16.16a2.86 2.86 0 0 1 2.86-2.86h1.9a2.86 2.86 0 0 1 2.86 2.86v9.52a2.86 2.86 0 0 1-2.86 2.86h-1.9a2.86 2.86 0 0 1-2.86-2.86v-9.52Zm23.8-10.47a2.86 2.86 0 0 1 2.86 2.86v17.14a2.86 2.86 0 0 1-2.86 2.86h-1.9a2.86 2.86 0 0 1-2.86-2.86V8.55a2.86 2.86 0 0 1 2.86-2.86h1.9Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

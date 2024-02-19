import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="M25.98 3H8.53C6.6 3 5.04 4.56 5.04 6.49v17.45c0 1.93 1.56 3.49 3.49 3.49h17.45c1.93 0 3.49-1.56 3.49-3.49V6.49C29.47 4.56 27.9 3 25.98 3Zm-3.54 13.52h-3.93v3.93c0 .72-.59 1.31-1.26 1.31-.72 0-1.31-.59-1.31-1.31v-3.93h-3.98c-.67 0-1.31-.59-1.31-1.31s.59-1.31 1.31-1.31h3.88V9.97c0-.72.59-1.31 1.31-1.31s1.26.59 1.26 1.31v3.93h3.93c.72 0 1.26.59 1.26 1.31.15.72-.39 1.31-1.16 1.31Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

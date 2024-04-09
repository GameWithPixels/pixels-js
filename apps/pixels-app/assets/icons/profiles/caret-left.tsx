import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 9) * 5} height={size} {...props}>
    <G transform={`scale(${size / 9})`}>
      <Path
        fill={props.color ?? "#fff"}
        d="m3.22 8.03-3-2.98A.841.841 0 0 1 0 4.48c0-.213.073-.384.22-.53l3-2.98A.75.75 0 0 1 4.5 1.5v5.979a.75.75 0 0 1-.463.693c-.28.116-.603.073-.817-.142Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

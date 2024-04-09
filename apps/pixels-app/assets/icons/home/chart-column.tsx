import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 14) * 16} height={size} {...props}>
    <G transform={`scale(${size / 14})`}>
      <Path
        fill={props.color ?? "#fff"}
        d="M1 0a1 1 0 0 1 1 1v10.5a.5.5 0 0 0 .5.5H15a.999.999 0 1 1 0 2H2.5A2.5 2.5 0 0 1 0 11.5V1a1 1 0 0 1 1-1Zm4 6c.553 0 1 .447 1 1v2a.999.999 0 1 1-2 0V7c0-.553.447-1 1-1Zm4 3a.999.999 0 1 1-2 0V4a.999.999 0 1 1 2 0v5Zm2-4c.553 0 1 .447 1 1v3a.999.999 0 1 1-2 0V6c0-.553.447-1 1-1Zm4 4a.999.999 0 1 1-2 0V2a1 1 0 1 1 2 0v7Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

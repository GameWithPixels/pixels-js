import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 16) * 18} height={size} {...props}>
    <G transform={`scale(${size / 16})`}>
      <Path
        fill={props.color ?? "#fff"}
        d="M16 0a2 2 0 0 1 2 2v7c0 1.103-.897 2-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h14Zm0 2H2v7h14V2ZM0 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1v-1Zm7-1c.553 0 1 .447 1 1v1c0 .553-.447 1-1 1H6c-.553 0-1-.447-1-1v-1c0-.553.447-1 1-1h1Zm3 1c0-.553.447-1 1-1h1c.553 0 1 .447 1 1v1c0 .553-.447 1-1 1h-1c-.553 0-1-.447-1-1v-1Zm7-1c.553 0 1 .447 1 1v1c0 .553-.447 1-1 1h-1c-.553 0-1-.447-1-1v-1c0-.553.447-1 1-1h1Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

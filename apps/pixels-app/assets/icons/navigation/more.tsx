import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 13) * 16 * 0.9} height={size * 0.9} {...props}>
    <G transform={`scale(${(size / 13) * 0.9})`}>
      <Path
        fill={props.color ?? "#fff"}
        strokeWidth={0.1}
        d="M0 1.063C0 .752.252.5.563.5h14.624a.563.563 0 0 1 0 1.125H.563A.562.562 0 0 1 0 1.062Zm0 5.625c0-.31.252-.563.563-.563h14.624c.31 0 .563.253.563.563 0 .309-.253.562-.563.562H.563A.563.563 0 0 1 0 6.687Zm15.188 6.187H.562a.563.563 0 0 1 0-1.125h14.626c.309 0 .562.253.562.563 0 .309-.253.562-.563.562Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

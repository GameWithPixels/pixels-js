import Svg, { SvgProps, Path } from "react-native-svg";
const SvgComponent = (props: SvgProps) => (
  <Svg width={16} height={13} {...props}>
    <Path
      fill={props.color ?? "#FFF"}
      d="M0 1.063C0 .752.252.5.563.5h14.624a.563.563 0 0 1 0 1.125H.563A.562.562 0 0 1 0 1.062Zm0 5.625c0-.31.252-.563.563-.563h14.624c.31 0 .563.253.563.563 0 .309-.253.562-.563.562H.563A.563.563 0 0 1 0 6.687Zm15.188 6.187H.562a.563.563 0 0 1 0-1.125h14.626c.309 0 .562.253.562.563 0 .309-.253.562-.563.562Z"
    />
  </Svg>
);
export default SvgComponent;

import { ColorValue } from "react-native";
import Svg, {
  SvgProps,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
const SvgComponent = ({
  size,
  startColor,
  stopColor,
  ...props
}: {
  size: number;
  startColor?: ColorValue;
  stopColor?: ColorValue;
} & Omit<SvgProps, "width" | "height" | "color">) => (
  <Svg
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinejoin="round"
    strokeMiterlimit={2}
    viewBox="0 0 131 131"
    width={size}
    height={size}
    {...props}
  >
    <Path
      d="M16.298 59.759V16.298h43.461v43.461H16.298Zm0 54.326V70.624h43.461v43.461H16.298Zm54.326-54.326V16.298h43.461v43.461H70.624Zm0 54.326V70.624h43.461v43.461H70.624ZM27.163 48.894h21.731V27.163H27.163v21.731Zm54.327 0h21.73V27.163H81.49v21.731Zm0 54.326h21.73V81.49H81.49v21.73Zm-54.327 0h21.731V81.49H27.163v21.73Z"
      fill="url(#a)"
      fillRule="nonzero"
    />
    <Defs>
      <LinearGradient
        id="a"
        x1={0}
        x2={1}
        y1={0}
        y2={0}
        gradientTransform="translate(16.298 65.192) scale(97.7875)"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset={0} stopColor={startColor} stopOpacity={1} />
        <Stop offset={1} stopColor={stopColor} stopOpacity={1} />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default SvgComponent;

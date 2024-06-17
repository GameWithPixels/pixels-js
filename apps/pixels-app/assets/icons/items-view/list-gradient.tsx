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
    viewBox="0 0 107 107"
    width={size}
    height={size}
    {...props}
  >
    <Path
      d="M36.875 91.736V80.764h65.833v10.972H36.875Zm0-32.917V47.847h65.833v10.972H36.875Zm0-32.916V14.931h65.833v10.972H36.875ZM14.931 97.222c-3.018 0-5.601-1.074-7.75-3.223-2.148-2.149-3.223-4.732-3.223-7.749 0-3.017 1.075-5.6 3.223-7.749 2.149-2.149 4.732-3.223 7.75-3.223 3.017 0 5.6 1.074 7.749 3.223 2.148 2.149 3.223 4.732 3.223 7.749 0 3.017-1.075 5.6-3.223 7.749-2.149 2.149-4.732 3.223-7.749 3.223Zm0-32.916c-3.018 0-5.601-1.075-7.75-3.224-2.148-2.148-3.223-4.731-3.223-7.749 0-3.017 1.075-5.6 3.223-7.749 2.149-2.149 4.732-3.223 7.75-3.223 3.017 0 5.6 1.074 7.749 3.223 2.148 2.149 3.223 4.732 3.223 7.749 0 3.018-1.075 5.601-3.223 7.749-2.149 2.149-4.732 3.224-7.749 3.224Zm0-32.917c-3.018 0-5.601-1.074-7.75-3.223-2.148-2.149-3.223-4.732-3.223-7.749 0-3.018 1.075-5.601 3.223-7.749 2.149-2.149 4.732-3.224 7.75-3.224 3.017 0 5.6 1.075 7.749 3.224 2.148 2.148 3.223 4.731 3.223 7.749 0 3.017-1.075 5.6-3.223 7.749-2.149 2.149-4.732 3.223-7.749 3.223Z"
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
        gradientTransform="matrix(98.75 0 0 87.7778 3.958 53.333)"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset={0} stopColor={startColor} stopOpacity={1} />
        <Stop offset={1} stopColor={stopColor} stopOpacity={1} />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default SvgComponent;

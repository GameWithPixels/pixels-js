import Svg, { Circle, Path, SvgProps } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg
    viewBox="0 0 1000 1000"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinejoin="round"
    strokeMiterlimit={2}
    width={size}
    height={size}
    {...props}
  >
    <Path
      d="M443.008 331.135h112.537c62.543 0 113.32 50.777 113.32 113.32v342.224c0 62.544-50.777 113.321-113.32 113.321H213.321C150.777 900 100 849.223 100 786.679V444.455c0-62.543 50.777-113.32 113.321-113.32h76.442v64.939h-76.442c-26.703 0-48.382 21.679-48.382 48.381v342.224c0 26.703 21.679 48.382 48.382 48.382h342.224c26.702 0 48.381-21.679 48.381-48.382V444.455c0-26.702-21.679-48.381-48.381-48.381H443.008v-64.939z"
      fill="#fff"
    />
    <Path
      d="M559.525 668.865h-115.07c-62.543 0-113.32-50.777-113.32-113.32V213.321c0-62.544 50.777-113.321 113.32-113.321h342.224C849.223 100 900 150.777 900 213.321v342.224c0 62.543-50.777 113.32-113.321 113.32H712.77v-64.939h73.909c26.703 0 48.382-21.679 48.382-48.381V213.321c0-26.703-21.679-48.382-48.382-48.382H444.455c-26.702 0-48.381 21.679-48.381 48.382v342.224c0 26.702 21.679 48.381 48.381 48.381h115.07v64.939z"
      fill="#fff"
    />
    <Circle cx={200} cy={200} r={75.356} fill="#fff" />
    <Circle cx={800} cy={800} r={75.356} fill="#fff" />
  </Svg>
);
export default SvgComponent;
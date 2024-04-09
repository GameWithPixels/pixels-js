import Svg, { Path, G, SvgProps } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg
    viewBox="0 0 1000 1000"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="square"
    strokeMiterlimit={9}
    fill="none"
    stroke={props.color ?? "#fff"}
    width={size}
    height={size}
    {...props}
  >
    <Path
      d="M485.375 211.616h383.89M101.485 211.616h265.136"
      strokeWidth="55px"
    />
    <Path
      d="M350.477 237.813H220.155v-51.368h130.322v-73.884h51.368V310.67h-51.368v-72.857z"
      fill={props.color ?? "#fff"}
    />
    <G>
      <Path d="M101.485 457.124h383.89" strokeWidth="55.05px" />
      <Path
        d="M571.235 556.179V358.07h58.498v73.37h268.782v51.368H629.733v73.371h-58.498z"
        fill={props.color ?? "#fff"}
      />
    </G>
    <G>
      <Path
        d="M869.265 656.414v199.867c0 13.789-11.194 24.984-24.983 24.984H126.469c-13.789 0-24.984-11.195-24.984-24.984V656.414c0-13.789 11.195-24.983 24.984-24.983h717.813c13.789 0 24.983 11.194 24.983 24.983z"
        strokeWidth="34.58px"
      />
      <Path
        d="M862.254 650.987v39.112c0 10.794-8.763 19.557-19.557 19.557H121.042c-10.794 0-19.557-8.763-19.557-19.557v-39.112c0-10.793 8.763-19.556 19.557-19.556h721.655c10.794 0 19.557 8.763 19.557 19.556z"
        strokeWidth="36.54px"
      />
      <Path
        d="M185.395 797.444h337.654"
        strokeWidth="36.68px"
        strokeLinecap="round"
      />
    </G>
  </Svg>
);
export default SvgComponent;

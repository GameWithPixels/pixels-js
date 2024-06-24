import Svg, { SvgProps, Path } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg viewBox="0 0 135 75" width={size} height={(size * 75) / 135} {...props}>
    <Path
      d="M135 30v15c0 4.125-3.375 7.5-7.5 7.5V60c0 8.292-6.708 15-15 15H15C6.708 75 0 68.292 0 60V15C0 6.708 6.708 0 15 0h97.5c8.292 0 15 6.708 15 15v7.5c4.167 0 7.5 3.333 7.5 7.5Zm-18.75-15a3.735 3.735 0 0 0-3.75-3.75H15A3.735 3.735 0 0 0 11.25 15v45A3.735 3.735 0 0 0 15 63.75h97.5a3.735 3.735 0 0 0 3.75-3.75V15ZM22.5 22.5H45v30H22.5v-30Z"
      fill={props.color ?? "#fff"}
    />
  </Svg>
);
export default SvgComponent;

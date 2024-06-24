import Svg, { SvgProps, Path, ClipPath, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg viewBox="0 0 135 75" width={size} height={(size * 75) / 135} {...props}>
    <Path
      d="M127.5 22.5c4.167 0 7.5 3.333 7.5 7.5v15c0 4.125-3.375 7.5-7.5 7.5V60c0 8.292-6.708 15-15 15H15C6.708 75 0 68.292 0 60V15C0 6.708 6.708 0 15 0h97.5c8.292 0 15 6.708 15 15v7.5Zm-11.083-8.371a2.762 2.762 0 0 0-2.761-2.761h-99.6a2.762 2.762 0 0 0-2.76 2.761v48.902a2.762 2.762 0 0 0 2.76 2.761h99.6a2.762 2.762 0 0 0 2.761-2.761V14.129Z"
      fill={props.color ?? "#fff"}
    />
    <ClipPath id="a">
      <Path d="M20.196 17.209h91.906v37.88H20.196z" />
    </ClipPath>
    <G clipPath="url(#a)">
      <Path
        d="M105 22.5H22.5v30H105v-30Zm22.5 0V15c0-8.292-6.708-15-15-15H15C6.708 0 0 6.708 0 15v45c0 8.292 6.708 15 15 15h97.5c8.292 0 15-6.708 15-15v-7.5c4.125 0 7.5-3.375 7.5-7.5V30c0-4.167-3.333-7.5-7.5-7.5Zm-15 37.5H15V15h97.5v45Z"
        fill={props.color ?? "#fff"}
      />
    </G>
  </Svg>
);
export default SvgComponent;

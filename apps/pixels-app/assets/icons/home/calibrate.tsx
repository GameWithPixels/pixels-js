import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="m19.83 11.36.5 3.07c.09.63.54 1.15 1.16 1.33 2.57.75 9.12 2.98 9.12 4.89 0 2.9-6.05 5.22-13.43 5.22S3.84 23.55 3.84 20.73c0-1.99 6.55-4.14 9.12-4.89.62-.17 1.08-.69 1.16-1.33l1.82-11.69c.11-.68.73-1.15 1.41-1.08.59-.03 1.1.41 1.16.99l.91 6.05.41 2.57Z"
      />
      <Path
        fill={props.color ?? "#FFF"}
        d="m19.99 25.94-1.66 2.32c-.45.59-1.28.73-1.91.33-.08-.08-.25-.17-.33-.33l-1.66-2.32"
      />
      <Path
        fill={props.color ?? "#FFF"}
        d="M22.73 16.25c-.5 1.57-2.82 2.74-5.55 2.74s-4.89-1.16-5.47-2.74"
      />
    </G>
  </Svg>
);
export default SvgComponent;

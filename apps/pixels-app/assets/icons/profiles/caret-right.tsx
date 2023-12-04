import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 11) * 7} height={size} {...props}>
    <G transform={`scale(${size / 11})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="m2.475.963 3.75 3.723c.184.209.275.449.275.663 0 .213-.092.48-.275.663l-3.75 3.723a.937.937 0 0 1-1.022.204c-.35-.146-.578-.436-.578-.84V1.625a.938.938 0 0 1 1.6-.662Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

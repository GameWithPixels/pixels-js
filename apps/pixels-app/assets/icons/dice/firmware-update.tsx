import Svg, { Path, SvgProps } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg viewBox="0 0 93 93" width={size} height={size} {...props}>
    <Path
      d="M46.262 0c25.533 0 46.262 20.729 46.262 46.262S71.795 92.524 46.262 92.524 0 71.795 0 46.262 20.729 0 46.262 0Zm0 6.25C24.179 6.25 6.25 24.179 6.25 46.262c0 22.083 17.929 40.012 40.012 40.012 22.083 0 40.012-17.929 40.012-40.012 0-22.083-17.929-40.012-40.012-40.012Z"
      fill={props.color ?? "#fff"}
    />
    <Path
      d="M44.848 20.316v26.27L32.765 34.503l-3.021 3.075L47.006 54.84l17.261-17.262-3.02-3.075-12.084 12.083v-26.27h-4.315Z"
      fill={props.color ?? "#fff"}
      fillRule="nonzero"
    />
    <Path
      d="M26.594 63.099H65.93"
      stroke={props.color ?? "#fff"}
      strokeWidth="6.25px"
    />
  </Svg>
);
export default SvgComponent;

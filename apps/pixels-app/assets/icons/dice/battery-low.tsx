import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#FFF"}
        d="M9.16 11.61h-2.7v7.2h2.7v-7.2Zm22.5 0v-1.8c0-1.99-1.61-3.6-3.6-3.6H4.66c-1.99 0-3.6 1.61-3.6 3.6v10.8c0 1.99 1.61 3.6 3.6 3.6h23.4c1.99 0 3.6-1.61 3.6-3.6v-1.8c.99 0 1.8-.81 1.8-1.8v-3.6c0-1-.8-1.8-1.8-1.8Zm-3.6 9H4.66V9.81h23.4v10.8Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

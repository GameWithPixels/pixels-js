import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#fff"}
        d="M33.46 13.41v3.6c0 .99-.81 1.8-1.8 1.8v1.8c0 1.99-1.61 3.6-3.6 3.6H4.66c-1.99 0-3.6-1.61-3.6-3.6V9.81c0-1.99 1.61-3.6 3.6-3.6h23.4c1.99 0 3.6 1.61 3.6 3.6v1.8c1 0 1.8.8 1.8 1.8Zm-4.5-3.6c0-.5-.4-.9-.9-.9H4.66c-.5 0-.9.4-.9.9v10.8c0 .5.4.9.9.9h23.4c.5 0 .9-.4.9-.9V9.81Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

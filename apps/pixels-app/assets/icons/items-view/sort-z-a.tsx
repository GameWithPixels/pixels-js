import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 30.42) * 34.51} height={size} {...props}>
    <G transform={`scale(${size / 30.42})`}>
      <Path
        fill={props.color ?? "#fff"}
        d="M11.15 2.19c-.74-.81-2.13-.81-2.87 0l-5.3 5.85c-.78.79-.73 2.03.07 2.75.79.73 2.02.67 2.75-.12l1.97-2.16v18.37c0 1.08.87 1.95 1.95 1.95s1.95-.87 1.95-2V8.51l1.97 2.15c.38.42.91.63 1.44.63a1.946 1.946 0 0 0 1.43-3.26l-5.35-5.84Zm10.24 3.29h3.09l-4.46 4.46c-.56.56-.72 1.39-.42 2.12s1.01 1.2 1.8 1.2h7.73c1.13-.05 2-.87 2-1.95s-.87-1.95-1.95-1.95h-3.09l4.46-4.46c.56-.56.72-1.39.42-2.12s-1.01-1.2-1.85-1.2h-7.73c-1.08 0-1.95.87-1.95 1.95s.87 1.95 1.95 1.95ZM31.89 26l-4.87-9.74c-.66-1.33-2.82-1.33-3.48 0L18.67 26c-.48.97-.09 2.14.87 2.63.97.48 2.13.09 2.61-.88l.44-.88h5.38l.44.88c.38.76 1.46 1.45 2.61.88.96-.48 1.35-1.66.87-2.63Zm-7.59-2.55.99-1.99.99 1.98h-1.97Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

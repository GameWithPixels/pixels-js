import Svg, { SvgProps, Path, G } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg width={(size / 17) * 19} height={size} {...props}>
    <G transform={`scale(${(size / 17) * 0.53})`}>
      <Path
        fill={props.color ?? "#fff"}
        d="M26.67 16.31c-.19 0-.37-.03-.56-.09l-.14-.06-5.73-3.29c-.39-.2-.69-.7-.69-1.2V5.1c0-.57.28-1.03.74-1.23L25.97.61c.37-.19.81-.2 1.23-.06l.14.06 5.73 3.29c.39.2.69.7.69 1.2v6.65c0 .54-.27.96-.74 1.15l-5.68 3.26c-.21.11-.44.16-.67.16Zm-.02-1.53h.01l5.57-3.19V5.18l-5.57-3.19h-.01l-5.57 3.19v6.41l5.57 3.19Zm-5.68-3.26.05.03s-.03-.02-.05-.03Zm11.34-6.3s.03.02.05.03l-.05-.03ZM25.59 31.46h-9.93c-.65 0-1.22-.57-1.22-1.22v-9.93c0-.65.57-1.22 1.22-1.22h9.93c.65 0 1.22.57 1.22 1.22v9.93c0 .65-.57 1.22-1.22 1.22Zm-9.63-1.53h9.32v-9.32h-9.32v9.32Zm9.63-9.32ZM8.85 20.79c-.51 0-1-.19-1.37-.56l-6.27-6.18c-.59-.58-.62-1.53-.08-2.08l.08-.08L7.48 5.7c.87-.75 2.1-.73 2.83 0l6.26 6.19c.59.59.62 1.54.08 2.08l-.08.08-6.27 6.19c-.43.37-.95.55-1.46.55ZM2.3 12.96l6.26 6.19c.18.17.49.16.72-.04l6.21-6.14-6.25-6.18c-.18-.18-.49-.16-.72.04l-6.21 6.14Z"
      />
    </G>
  </Svg>
);
export default SvgComponent;

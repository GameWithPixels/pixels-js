import Svg, { SvgProps, Path } from "react-native-svg";
const SvgComponent = (props: SvgProps) => (
  <Svg width={18} height={18} {...props}>
    <Path
      fill={props.color ?? "#fff"}
      d="M18 9a9 9 0 0 1-9 9A9 9 0 0 1 2.701 2.571a1.126 1.126 0 1 1 1.574 1.61A6.723 6.723 0 0 0 2.25 9 6.732 6.732 0 0 0 9 15.75a6.752 6.752 0 0 0 1.125-13.407v1.032a1.124 1.124 0 1 1-2.25 0v-2.25C7.875.504 8.378 0 9 0a9 9 0 0 1 9 9Zm-8.434-.598c.359.33.359.865 0 1.164-.299.359-.833.359-1.164 0L5.59 6.754c-.327-.3-.327-.834 0-1.164.33-.327.865-.327 1.164 0l2.812 2.812Z"
    />
  </Svg>
);
export default SvgComponent;

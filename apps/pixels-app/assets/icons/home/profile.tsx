import Svg, { SvgProps, Path } from "react-native-svg";
const SvgComponent = (props: SvgProps) => (
  <Svg width={16} height={13} {...props}>
    <Path
      fill={props.color ?? "#fff"}
      d="M14.25.625H2a1.75 1.75 0 0 0-1.75 1.75v8.75c0 .967.783 1.75 1.75 1.75h12.25a1.75 1.75 0 0 0 1.75-1.75v-8.75a1.75 1.75 0 0 0-1.75-1.75ZM5.062 3.25a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Zm2.625 7h-5.25A.438.438 0 0 1 2 9.812c0-1.208.98-2.187 2.188-2.187h1.75c1.208 0 2.187.98 2.187 2.188 0 .24-.197.437-.437.437Zm6.126-1.75h-3.5a.439.439 0 0 1-.438-.438c0-.24.197-.437.438-.437h3.5a.439.439 0 0 1 0 .875Zm0-1.75h-3.5a.439.439 0 0 1-.438-.438c0-.24.197-.437.438-.437h3.5a.439.439 0 0 1 0 .875Zm0-1.75h-3.5a.439.439 0 0 1-.438-.438c0-.24.197-.437.438-.437h3.5a.439.439 0 0 1 0 .875Z"
    />
  </Svg>
);
export default SvgComponent;
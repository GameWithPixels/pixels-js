import Svg, { SvgProps, Path } from "react-native-svg";
const SvgComponent = ({
  size,
  ...props
}: { size: number; lightningColor?: string } & Omit<
  SvgProps,
  "width" | "height"
>) => (
  <Svg
    viewBox="0 0 563 313"
    width={size}
    height={(size * 313) / 563}
    {...props}
  >
    <Path
      d="M234.21 312.5H62.5C27.95 312.5 0 284.55 0 250V62.5C0 27.95 27.95 0 62.5 0h211.914l-33.38 46.875H62.5A15.562 15.562 0 0046.875 62.5V250A15.562 15.562 0 0062.5 265.625h173.157l-4.707 27.064a30.458 30.458 0 003.26 19.811zM328.29 0h140.46c34.55 0 62.5 27.95 62.5 62.5v31.25c17.363 0 31.25 13.888 31.25 31.25v62.5c0 17.188-14.063 31.25-31.25 31.25V250c0 34.55-27.95 62.5-62.5 62.5H288.086l33.38-46.875H468.75A15.562 15.562 0 00484.375 250V62.5a15.562 15.562 0 00-15.625-15.625H326.843l4.707-27.064A30.458 30.458 0 00328.29 0zM187.5 212.06v6.69H93.75v-125h93.75v28.3l-29.765 41.798a30.513 30.513 0 0024.854 48.212h4.911z"
      fill={props.color ?? "#fff"}
    />
    <Path
      d="M301.488 14.583L182.589 181.548h98.661l-20.238 116.369 118.899-166.965H281.25l20.238-116.369z"
      fill={props.lightningColor ?? "#fff"}
    />
  </Svg>
);

export default SvgComponent;

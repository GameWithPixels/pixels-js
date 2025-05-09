import Svg, { Path, G, SvgProps } from "react-native-svg";

const SvgComponent = ({
  size,
  ...props
}: { size: number } & Omit<SvgProps, "width" | "height">) => (
  <Svg
    viewBox="0 1 22.5 22"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    {...props}
  >
    <Path d="M0 0H24V24H0z" fill="none" />
    <Path
      d="M14.27 6.746c-.413-.113-1.457.205-1.237-.023.371-.386 3.464-2.293 3.464-2.293s-.097 3.633-.244 4.147c-.087.305-.336-.758-.641-1.059l-4.31 7.485a.775.775 0 01-1.342-.772l4.31-7.485z"
      fill="#ff0030"
    />
    <Path
      d="M21.08 12.595l-3.575 6.193a1.794 1.794 0 01-1.557.895l-7.222-.027a1.797 1.797 0 01-1.542-.89L3.55 12.525a1.793 1.793 0 01-.004-1.796l3.576-6.193a1.794 1.794 0 011.557-.895l7.222.027a1.798 1.798 0 011.542.89l3.634 6.241c.322.554.324 1.241.003 1.796zM7.811 3.862l2.177 3.769m11.332 4.03l-4.353-.001m-.328 7.876L3.332 11.853m13.259-8.03L3.322 11.475m13.641-7.437l.007 15.317"
      fill="none"
      fillRule="nonzero"
      stroke="#fff"
      strokeWidth="1.18px"
    />
    <Path
      d="M9.987 15.691V7.633l6.979 4.029-6.979 4.029zm-.002.003l-2.149 3.723"
      fill="none"
      fillRule="nonzero"
      stroke="#fff"
      strokeWidth="1.18px"
    />
    <Path
      d="M19.881 18.962c-.095-.315-.779-.914-.476-.828.444.128 3.142 1.591 3.142 1.591s-2.697 1.462-3.158 1.559c-.308.066.386-.508.484-.822l-12.169-.061a.75.75 0 01.008-1.5l12.169.061z"
      fill="#35cce6"
    />
    <G>
      <Path d="M.226 6.814l7.485 12.86" fill="none" fillRule="nonzero" />
      <Path
        d="M2.394 9.048l5.965 10.249a.75.75 0 11-1.297.754L1.097 9.802c-.293.293-.504 1.413-.616 1.029-.145-.498-.255-4.017-.255-4.017S3.232 8.648 3.593 9.02c.278.287-.799-.083-1.199.028z"
        fill="#1ef154"
      />
    </G>
  </Svg>
);
export default SvgComponent;

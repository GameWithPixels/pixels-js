import {
  FastButton,
  FastButtonProps,
} from "@systemic-games/react-native-base-components";

export default function (props: FastButtonProps) {
  return <FastButton _text={textStyle} px={2} py={1} m={0} {...props} />;
}

const textStyle = { fontSize: "2xl" };

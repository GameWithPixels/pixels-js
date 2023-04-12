import { Dimensions } from "react-native";

const screenRatio = Dimensions.get("window").width / 400;

export default function (value: number) {
  return value * screenRatio;
}

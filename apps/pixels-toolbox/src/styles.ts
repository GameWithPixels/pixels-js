// eslint-disable-next-line import/namespace
import { StyleSheet, Dimensions } from "react-native";

const screenRatio = Dimensions.get("window").width / 400;

export function sr(value: number) {
  return value * screenRatio;
}

export default StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  containerHorizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerFooter: {
    alignItems: "center",
  },
  text: {
    fontSize: sr(18),
  },
  textBold: {
    fontSize: sr(18),
    fontWeight: "bold",
  },
  textBoldRed: {
    fontSize: sr(18),
    fontWeight: "bold",
    color: "red",
  },
  textItalic: {
    fontSize: sr(18),
    fontStyle: "italic",
  },
  box: {
    backgroundColor: "lightgrey",
    borderRadius: sr(10),
    paddingVertical: "2%",
    paddingHorizontal: "4%",
  },
});

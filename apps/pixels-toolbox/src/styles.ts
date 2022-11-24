// eslint-disable-next-line import/namespace
import { StyleSheet, Dimensions } from "react-native";

// TODO update on window size change
const windowWidth = Dimensions.get("window").width;
const virtualWidth = 400;
const screenRatio = windowWidth / virtualWidth;

export function sr(value: number | string) {
  if (typeof value === "number") {
    return value * screenRatio;
  } else {
    const n = Number(value);
    if (!isNaN(n)) {
      return n;
    } else if (value.charAt(value.length - 1) === "%") {
      const p = Number(value.slice(0, -1));
      if (!isNaN(p)) {
        return (p / 100) * windowWidth;
      }
    }
    throw new Error(`Unknown value for sr(): ${value}`);
  }
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

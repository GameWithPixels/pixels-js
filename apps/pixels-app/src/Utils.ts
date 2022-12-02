// eslint-disable-next-line import/namespace
import { Dimensions } from "react-native";
// TODO update on window size change
const windowWidth = Dimensions.get("window").width;
const virtualWidth = 400;
const screenRatio = windowWidth / virtualWidth;

/**
 * Returns a screen dimension in React Native unit assuming a virtual
 * screen width of 400 units.
 * Use this method to scale the UI based on the screen width.
 * @param value An absolute value or a string value with % (of screen width).
 * @returns A screen dimension in React Native units.
 */
export function sr(value: number | string) {
  if (typeof value === "number") {
    return value * screenRatio;
  } else {
    const n = Number(value);
    if (!isNaN(n)) {
      return n * screenRatio;
    } else if (value.charAt(value.length - 1) === "%") {
      const p = Number(value.slice(0, -1));

      if (!isNaN(p)) {
        return (p / 100) * virtualWidth;
      }
    }
    throw new Error(`Unknown value for sr(): ${value}`);
  }
}

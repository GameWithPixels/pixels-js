import { extendTheme } from "native-base";
import { LinearGradient } from "react-native-svg";

import components from "./components";

interface createPixelThemeProps {
  primaryColors: any;
  secondaryColors?: any;
  tertiaryColors?: any;
  customColors?: any;
}

export function createPxTheme({
  primaryColors,
  secondaryColors,
  tertiaryColors,
  customColors,
}: createPixelThemeProps) {
  return extendTheme({
    useSystemColorMode: false,
    config: {
      initialColorMode: "dark",
    },
    dependencies: {
      "linear-gradient": LinearGradient,
    },
    colors: {
      primary: { primaryColors },
      secondary: { secondaryColors },
      tertiary: { tertiaryColors },
      customColors: { customColors },
    },
    components,
  });
}

export const theme = extendTheme({
  useSystemColorMode: false,
  config: {
    initialColorMode: "dark",
  },
  dependencies: {
    "linear-gradient": LinearGradient,
  },
  components,
});

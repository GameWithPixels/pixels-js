import { extendTheme, ITheme } from "native-base";
import { IColorHues } from "native-base/lib/typescript/theme/base/colors";
import { LinearGradient } from "react-native-svg";

import components from "./components";

// Theme configuration and functionalities

// UsePXTheme to create variations of the default components theme with new primary colors
export function UsePxTheme(theme: ITheme, primaryColors: IColorHues) {
  const newTheme = extendTheme(theme, {
    // @ts-expect-error
    colors: {
      primary: primaryColors,
    },
  });
  return newTheme;
}

// Base components default theme
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

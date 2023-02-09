import { extendTheme, ITheme } from "native-base";
import { IColorHues } from "native-base/lib/typescript/theme/base/colors";
import { LinearGradient } from "react-native-svg";

import components from "./components";

// Theme configuration and functionalities
export interface CreatePixelThemeParams {
  theme: ITheme;
  primaryColors?: IColorHues;
  secondaryColors?: IColorHues;
  tertiaryColors?: IColorHues;
}

/**
 * UsePXTheme to create variations of the default components theme with new primary, secondary or tertiary colors
 * @param theme The theme to override with new parameters
 * See {@link CreatePixelThemeParams} for the UsePxTheme other parameters
 * @returns A new theme modified with the new selected colors
 */
export function createPixelTheme({
  theme,
  primaryColors = theme.colors.primary,
  secondaryColors = theme.colors.secondary,
  tertiaryColors = theme.colors.tertiary,
}: CreatePixelThemeParams) {
  const newTheme = extendTheme(theme, {
    // @ts-expect-error
    colors: {
      primary: primaryColors,
      secondary: secondaryColors,
      tertiary: tertiaryColors,
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

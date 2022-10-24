import { theme as BaseTheme } from "@systemic-games/react-native-base-components";
import { extendTheme } from "native-base";

import components from "./components";

export const Pxtheme = extendTheme(BaseTheme, {
  colors: {
    // @ts-expect-error : conflict between themes merging (type difference)
    PixelColors: {
      dark: "#100F1E",
      light: "#1E213A",
      accent: "#6A78FF",
      text: "#8194AE",
      lightText: "#D1D1D1",
      darkText: "#536077",
      darkModeText: "#8094AD",
      buttonBg: "#6A78FF",
      boxBGDark: "#17182C",
      boxBGDark2: "#30334D",
      boxBGLight: "#E2E8F0",
      boxBGLight2: "#CBD5E1",
      appBGDark: "#100F1E",
      higlhightGray: "#404040",
      lightHighlightGray: "#DBDCDE",
      softBlack: "#222222",
      purple: "#932788",
      accentPurple: "#603D64", // Red 60/96/0.37 - Green 3D/61/0.23 - Blue 64/100/0.39 // 301E20
      blue: "#0588CA",
      paleBlue: "#024178",
      green: "#A1CD3A",
      paleGreen: "#496B1A",
      yellow: "#FEBD11",
      paleYellow: "#D1AA0C",
      red: "#ED1834",
      paleRed: "#770616",
      pink: "#C71784",
    },
  },
  // @ts-expect-error : conflict between themes merging (type difference)
  components,
});

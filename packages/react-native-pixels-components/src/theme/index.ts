import { theme as BaseTheme } from "@systemic-games/react-native-base-components";
import { extendTheme } from "native-base";

import pixelComponents from "./components";
import { sr } from "../utils";

const pixelColors = {
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
  highlightGray: "#404040",
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
} as const;

const fontSizes = {
  "2xs": sr(10),
  xs: sr(12),
  sm: sr(14),
  md: sr(16),
  lg: sr(18),
  xl: sr(20),
  "2xl": sr(24),
  "3xl": sr(30),
  "4xl": sr(36),
  "5xl": sr(48),
  "6xl": sr(60),
  "7xl": sr(72),
  "8xl": sr(96),
  "9xl": sr(128),
};

const buttonTheme = {
  defaultProps: {
    bg: "primary.500",
    rounded: "lg",
  },
};

const components = {
  ...pixelComponents,

  Button: buttonTheme,

  FastButton: buttonTheme,

  Icon: {
    sizes: {
      "2xs": sr(10),
      xs: sr(12),
      sm: sr(20),
      md: sr(25),
      lg: sr(30),
      xl: sr(40),
      "2xl": sr(55),
      "3xl": sr(65),
      "4xl": sr(75),
      "5xl": sr(85),
      "6xl": sr(95),
    },
  },
};

// This type is defined to get rid of the typescript error with extendTheme
type PixelThemeExtraTypes =
  | { colors: { pixelColors: typeof pixelColors } }
  | { components: typeof components };

// This type is defined to enforce the emitted type for PixelTheme
type PixelThemeType = typeof BaseTheme & {
  colors: { pixelColors: typeof pixelColors };
} & { components: typeof components };

export const PixelTheme = extendTheme<typeof BaseTheme | PixelThemeExtraTypes>(
  BaseTheme,
  {
    colors: {
      pixelColors,
    },
    fontSizes,
    components,
  }
) as PixelThemeType;

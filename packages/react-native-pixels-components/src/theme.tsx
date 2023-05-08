import React from "react";
import { ViewStyle } from "react-native";
import {
  Provider as PaperProvider,
  ProviderProps,
  useTheme,
} from "react-native-paper";

export const PixelColors = {
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
  accentPurple: "#603D64", // Red 60/96/0.37 - Green 3D/61/0.23 - Blue 64/100/0.39 // 301E20
  purple: "#932788",
  palePurple: "rgb(100, 50, 95)",
  secondaryPalePurple: "rgb(75, 46, 72)",
  blue: "#0588CA",
  paleBlue: "rgb(50, 80, 130)",
  secondaryPaleBlue: "rgb(52, 71, 103)",
  green: "#A1CD3A",
  paleGreen: "rgb(90, 120, 40)",
  secondaryPaleGreen: "rgb(77, 95, 49)",
  yellow: "#FEBD11",
  paleYellow: "rgb(190, 130, 30)",
  secondaryPaleYellow: "rgb(159, 120, 53)",
  red: "#ED1834",
  paleRed: "rgb(140, 20, 30)",
  secondaryPaleRed: "rgb(91, 34, 38)",
  pink: "#C71784",
} as const;

function toPale(accent: "red" | "purple" | "green" | "yellow") {
  return ("pale" + accent[0].toUpperCase() + accent.substring(1)) as
    | "paleRed"
    | "palePurple"
    | "paleGreen"
    | "paleYellow";
}

function toSecondaryPale(accent: "red" | "purple" | "green" | "yellow") {
  return ("secondaryPale" + accent[0].toUpperCase() + accent.substring(1)) as
    | "secondaryPaleRed"
    | "secondaryPalePurple"
    | "secondaryPaleGreen"
    | "secondaryPaleYellow";
}

export function PixelThemeProvider({
  accent,
  ...props
}: { accent: "red" | "purple" | "green" | "yellow" } & ProviderProps) {
  const defaultTheme = useTheme();
  const theme = {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: PixelColors[accent],
      primaryContainer: PixelColors[toPale(accent)],
      secondaryContainer: PixelColors[toSecondaryPale(accent)],
    },
  };

  return <PaperProvider theme={theme} {...props} />;
}

export function useModalStyle(): ViewStyle {
  const theme = useTheme();
  return React.useMemo(
    () => ({
      margin: 10,
      padding: 10,
      borderWidth: 2,
      borderRadius: (theme.isV3 ? 5 : 1) * theme.roundness,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.onBackground,
    }),
    [theme]
  );
}

import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetProps,
} from "@gorhom/bottom-sheet";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { Platform } from "react-native";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
} from "react-native-paper";
import Toast from "react-native-root-toast";

import { makeTransparent } from "../components/colors";
import { bottomSheetAnimationConfigFix } from "../fixes";

export type AppColors = MD3Theme["colors"] & { appBackground: string };

export type AppTheme = MD3Theme & { colors: AppColors };

function createAppTheme({
  primary,
  secondary,
  tertiary,
  onPrimary,
  appBackground,
}: {
  primary: string;
  secondary: string;
  tertiary: string;
  onPrimary: string;
  appBackground: string;
}): Readonly<AppTheme> {
  const surface = makeTransparent("#000000", 0.4);
  const outline = "#303030";
  return {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary,
      secondary,
      tertiary,
      outline,
      surface,
      onPrimary,
      appBackground,
    },
  };
}

const navigationThemes = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

export const AppLightTheme = {
  ...MD3LightTheme,
  ...navigationThemes.LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...navigationThemes.LightTheme.colors,
    appBackground: "#000000",
  },
};

export const AppDarkTheme = {
  ...MD3DarkTheme,
  ...navigationThemes.DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...navigationThemes.DarkTheme.colors,
    appBackground: "#000000",
  },
};

export const BlueDarkTheme = createAppTheme({
  primary: "#0488ca",
  secondary: "#8c2b8a",
  tertiary: "#8c2b8a",
  onPrimary: "#ffffff",
  appBackground: "#000040",
});

export const PurpleDarkTheme = createAppTheme({
  primary: "#8c2c8a",
  secondary: "#e11b4b",
  tertiary: "#e11b4b",
  onPrimary: "#ffffff",
  appBackground: "#400040",
});

export const YellowDarkTheme = createAppTheme({
  primary: "#a1cd3a",
  secondary: "#f8951f",
  tertiary: "#f8951f",
  onPrimary: "#ffffff",
  appBackground: "#004000",
});

export const OrangeDarkTheme = createAppTheme({
  primary: "#f4801e",
  secondary: "#b6192d",
  tertiary: "#b6192d",
  onPrimary: "#ffffff",
  appBackground: "#402000",
});

export const ColorblindBluePurpleTheme = createAppTheme({
  primary: "#648FFF",
  secondary: "#DC267F",
  tertiary: "#DC267F",
  onPrimary: "#ffffff",
  appBackground: "rgba(220, 38, 127, 0.06)",
});

export const ColorblindYellowOrangeTheme = createAppTheme({
  primary: "#FFB000",
  secondary: "#648FFF",
  tertiary: "#FE6100",
  onPrimary: "#ffffff",
  appBackground: "rgba(254, 97, 0, 0.03)",
});

export const ColorblindShadowTheme = createAppTheme({
  primary: "#785EF0",
  secondary: "#648FFF",
  tertiary: "#648FFF",
  onPrimary: "#9EAFDB",
  appBackground: "rgba(100, 143, 255, 0.06)",
});

export const CrystalAquaTheme = createAppTheme({
  primary: "#00E3CC",
  secondary: "#009688",
  tertiary: "#009688",
  onPrimary: "#ffffff",
  appBackground: "rgba(72, 105, 102, 0.09)",
});

export const VitalGreenTheme = createAppTheme({
  primary: "#2B6832",
  secondary: "#009688",
  tertiary: "#04D94F",
  onPrimary: "#ffffff",
  appBackground: "rgba(13, 28, 51, 0.5)",
});

export const DnDTheme = createAppTheme({
  primary: "#F21628",
  secondary: "#F2B807",
  tertiary: "#592014",
  onPrimary: "#ffffff",
  appBackground: "rgba(217, 149, 67, 0.05)",
});

export const CthulhuTheme = createAppTheme({
  primary: "#22402C",
  secondary: "#6CBF45",
  tertiary: "#44732F",
  onPrimary: "#ffffff",
  appBackground: "rgba(13, 13, 13, 0.1)",
});

export const VampireTheme = createAppTheme({
  primary: "#D90B1C",
  secondary: "#D94ED0",
  tertiary: "#5639BF",
  onPrimary: "#ffffff",
  appBackground: "rgba(121, 50, 140, 0.1)",
});

export const AppThemes = {
  dark: AppDarkTheme,
  light: AppLightTheme,
  blue: BlueDarkTheme,
  purple: PurpleDarkTheme,
  yellow: YellowDarkTheme,
  orange: OrangeDarkTheme,
  colorblindBluePurple: ColorblindBluePurpleTheme,
  colorblindYellowOrange: ColorblindYellowOrangeTheme,
  colorblindShadow: ColorblindShadowTheme,
  crystalAqua: CrystalAquaTheme,
  vitalGreen: VitalGreenTheme,
  dnD: DnDTheme,
  cthulhu: CthulhuTheme,
  vampire: VampireTheme,
} as const;

export function backgroundImageFromColor(color: string): number {
  switch (color) {
    default:
      console.log(`backgroundImageFromColor: Unknown primary color ${color}`);
    // eslint-disable-next-line no-fallthrough
    case BlueDarkTheme.colors.primary:
      return require("#/backgrounds/blue.png");
    case PurpleDarkTheme.colors.primary:
      return require("#/backgrounds/purple.png");
    case YellowDarkTheme.colors.primary:
      return require("#/backgrounds/green.png");
    case OrangeDarkTheme.colors.primary:
      return require("#/backgrounds/orange.png");
  }
}

// From react-native-paper\src\styles\themes\v2\colors.tsx
export const Colors = {
  grey50: "#fafafa",
  grey100: "#f5f5f5",
  grey200: "#eeeeee",
  grey300: "#e0e0e0",
  grey400: "#bdbdbd",
  grey500: "#9e9e9e",
  grey600: "#757575",
  grey700: "#616161",
  grey800: "#424242",
  grey900: "#212121",
} as const;

export const ToastSettings = {
  duration: Toast.durations.SHORT,
  position: -100,
  opacity: 1.0,
  backgroundColor: AppDarkTheme.colors.elevation.level3,
  textColor: AppDarkTheme.colors.onSurface,
} as const;

const bottomSheetBackgroundStyle = { backgroundColor: Colors.grey900 } as const; // grey900 - before: colors.elevation.level2,

function BottomSheetBackdropComponent(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
      {...props}
    />
  );
}

export function getBottomSheetProps(
  colors: MD3Theme["colors"]
): Pick<
  BottomSheetProps,
  | "animationConfigs"
  | "backgroundStyle"
  | "handleIndicatorStyle"
  | "backdropComponent"
  | "accessible"
> {
  return {
    animationConfigs: bottomSheetAnimationConfigFix,
    backgroundStyle: bottomSheetBackgroundStyle,
    handleIndicatorStyle: { backgroundColor: colors.primary },
    backdropComponent: BottomSheetBackdropComponent,
    accessible: Platform.OS !== "ios", // This is a workaround to have Voice Over focus on the   content
  };
}

import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetProps,
} from "@gorhom/bottom-sheet";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
} from "react-native-paper";
import Toast from "react-native-root-toast";

import { makeTransparent } from "./components/colors";
import { logError } from "./features/utils";
import { bottomSheetAnimationConfigFix } from "./fixes";
import { RootScreenName } from "./navigation";

function createTheme(
  primary: string,
  secondary: string,
  onPrimary: string
): Readonly<MD3Theme> {
  const surface = makeTransparent("#000000", 0.4);
  const outline = "#303030";
  return {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary,
      secondary,
      outline,
      surface,
      onPrimary,
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
  },
};

export const AppDarkTheme = {
  ...MD3DarkTheme,
  ...navigationThemes.DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...navigationThemes.DarkTheme.colors,
  },
};

export const BlueDarkTheme = createTheme("#0488CA", "#8C2B8A", "#FFFFFF");
export const PurpleDarkTheme = createTheme("#8C2C8A", "#E11B4B", "#FFFFFF");
export const GreenDarkTheme = createTheme("#A1CD3A", "#F8951F", "#111111");
export const OrangeDarkTheme = createTheme("#F4801E", "#B6192D", "#111111");

export const PixelThemes = {
  dark: AppDarkTheme,
  light: AppLightTheme,
  blue: BlueDarkTheme,
  purple: PurpleDarkTheme,
  green: GreenDarkTheme,
  orange: OrangeDarkTheme,
} as const;

export function getRootScreenTheme(screenName: RootScreenName): MD3Theme {
  switch (screenName) {
    case "onboarding":
    case "home":
      return BlueDarkTheme;
    case "profiles":
      return PurpleDarkTheme;
    case "animations":
      return GreenDarkTheme;
    case "settings":
      return OrangeDarkTheme;
    default:
      logError(`No theme for screen ${screenName}`);
      assertNever(screenName);
  }
}

export function backgroundImageFromColor(color: string): number {
  switch (color) {
    default:
      console.log(`backgroundImageFromColor: Unknown primary color ${color}`);
    // eslint-disable-next-line no-fallthrough
    case BlueDarkTheme.colors.primary:
      return require("#/backgrounds/blue.png");
    case PurpleDarkTheme.colors.primary:
      return require("#/backgrounds/purple.png");
    case GreenDarkTheme.colors.primary:
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
> {
  return {
    animationConfigs: bottomSheetAnimationConfigFix,
    backgroundStyle: bottomSheetBackgroundStyle,
    handleIndicatorStyle: { backgroundColor: colors.primary },
    backdropComponent: BottomSheetBackdropComponent,
  };
}

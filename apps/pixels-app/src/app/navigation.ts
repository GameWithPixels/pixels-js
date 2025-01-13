import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import {
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { RuleIndex } from "../screens/profiles/components/RuleCard";

// Root screens
export type BottomTabParamList = {
  onboarding: undefined;
  home: undefined;
  profiles: undefined;
  animations: undefined;
  settings: undefined;
};

export type RootScreenName = keyof BottomTabParamList;

export type OnboardingScreenProps = NativeStackScreenProps<
  BottomTabParamList,
  "onboarding"
>;

export type HomeStackProps = NativeStackScreenProps<BottomTabParamList, "home">;

export type ProfilesStackProps = NativeStackScreenProps<
  BottomTabParamList,
  "profiles"
>;

export type AnimationsStackProps = NativeStackScreenProps<
  BottomTabParamList,
  "animations"
>;

export type SettingsStackProps = NativeStackScreenProps<
  BottomTabParamList,
  "settings"
>;

// Edit profile sub screens
export type EditProfileSubStackParamList = {
  editAdvancedSettings: { profileUuid: string };
  editRule: RuleIndex;
  editRollRules: { profileUuid: string };
};

export type EditRuleScreenProps = NativeStackScreenProps<
  EditProfileSubStackParamList,
  "editRule"
>;

export type EditRollRulesScreenProps = NativeStackScreenProps<
  EditProfileSubStackParamList,
  "editRollRules"
>;

export type EditAdvancedSettingsScreenProps = NativeStackScreenProps<
  EditProfileSubStackParamList,
  "editAdvancedSettings"
>;

// Home screens
export type HomeStackParamList = {
  diceList: undefined;
  dieFocus: { pixelId: number };
  dieDetails: { pixelId: number };
  dieRollsHistory: { pixelId: number };
  editDieProfileStack: NavigatorScreenParams<EditDieProfileStackParamList>;
  firmwareUpdate: undefined;
  restoreFirmware: undefined;
  diceRoller: undefined;
};

export type DiceListScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "diceList"
>;

export type DieFocusScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "dieFocus"
>;

export type DieDetailsScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "dieDetails"
>;

export type RollsHistoryScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "dieRollsHistory"
>;

export type EditDieProfileStackProps = NativeStackScreenProps<
  HomeStackParamList,
  "editDieProfileStack"
>;

export type FirmwareUpdateScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "firmwareUpdate"
>;

export type RestoreFirmwareScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "restoreFirmware"
>;

export type DiceRollerScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "diceRoller"
>;

// Edit Die Profile screens
export type EditDieProfileStackParamList = {
  editDieProfile: { pixelId: number };
} & EditProfileSubStackParamList;

export type EditDieProfileScreenProps = NativeStackScreenProps<
  EditDieProfileStackParamList,
  "editDieProfile"
>;

// Profiles screens
export type ProfilesStackParamList = {
  profilesList: undefined;
  createProfile: undefined;
  editProfileStack: NavigatorScreenParams<EditProfileStackParamList>;
};

export type ProfilesListScreenProps = NativeStackScreenProps<
  ProfilesStackParamList,
  "profilesList"
>;

export type CreateProfileScreenProps = NativeStackScreenProps<
  ProfilesStackParamList,
  "createProfile"
>;

export type EditProfileStackProps = NativeStackScreenProps<
  ProfilesStackParamList,
  "editProfileStack"
>;

// Edit Profile screens
export type EditProfileStackParamList = {
  editProfile: {
    profileUuid: string;
    noDiscard?: boolean;
  };
} & EditProfileSubStackParamList;

export type EditProfileScreenProps = NativeStackScreenProps<
  EditProfileStackParamList,
  "editProfile"
>;

// Animations screens
export type AnimationsStackParamList = {
  animationsList: undefined;
  createAnimation: undefined;
  editAnimation: { animationUuid: string };
  pickColorDesign: {
    pattern?: Readonly<Profiles.Pattern>;
    onSelectPattern?: (pattern: Readonly<Profiles.Pattern>) => void;
  };
};

export type AnimationsListScreenProps = NativeStackScreenProps<
  AnimationsStackParamList,
  "animationsList"
>;

export type CreateAnimationScreenProps = NativeStackScreenProps<
  AnimationsStackParamList,
  "createAnimation"
>;

export type EditAnimationScreenProps = NativeStackScreenProps<
  AnimationsStackParamList,
  "editAnimation"
>;

export type PickColorDesignScreenProps = NativeStackScreenProps<
  AnimationsStackParamList,
  "pickColorDesign"
>;

// Settings screens
export type SettingsStackParamList = {
  settingsMenu: undefined;
  systemInfo: undefined;
  firmwareInfo: undefined;
  support: undefined;
  turnOnDice: undefined;
  checkForUpdate: undefined;
  appSettings: undefined;
  themes: undefined;
};

export type SettingsMenuScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, "settingsMenu">,
  BottomTabScreenProps<BottomTabParamList, "settings">
>;

export type SettingsInfoScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "systemInfo"
>;

export type FirmwareInfoScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "firmwareInfo"
>;

export type SupportScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "support"
>;

export type TurnOnDiceScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "turnOnDice"
>;

export type CheckForUpdateScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "checkForUpdate"
>;

export type AppSettingsScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "appSettings"
>;

export type ThemesScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "themes"
>;

export function getStackNavigationOptions(
  mode?: "default" | "slide-from-bottom" | "bottom-sheet"
): NativeStackNavigationOptions {
  const config = {
    headerShown: false,
    gestureEnabled: true,
  } as const;
  switch (mode) {
    case undefined:
    case "default":
      return config;
    case "slide-from-bottom":
      return {
        ...config,
        animation: "slide_from_bottom",
      };
    case "bottom-sheet":
      return {
        ...config,
        animation: "slide_from_bottom",
        presentation: "modal",
      };
    default:
      assertNever(mode);
  }
}

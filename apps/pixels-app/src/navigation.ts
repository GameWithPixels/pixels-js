import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import {
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { RuleIndex } from "./screens/profiles/components/RuleCard";

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
  editAdvancedRules: { profileUuid: string };
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

export type EditAdvancedRulesScreenProps = NativeStackScreenProps<
  EditProfileSubStackParamList,
  "editAdvancedRules"
>;

// Home screens
export type HomeStackParamList = {
  diceList: undefined;
  firmwareUpdate: undefined;
  dieDetails: { pixelId: number };
  editDieProfile: { pixelId: number };
} & EditProfileSubStackParamList;

export type DiceListScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "diceList"
>;

export type FirmwareUpdateScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "firmwareUpdate"
>;

export type DieDetailsScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "dieDetails"
>;

export type EditDieProfileScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "editDieProfile"
>;

// Profiles screens
export type ProfilesStackParamList = {
  profilesList: undefined;
  createProfile: undefined;
  editProfile: { profileUuid: string };
} & EditProfileSubStackParamList;

export type ProfilesListScreenProps = NativeStackScreenProps<
  ProfilesStackParamList,
  "profilesList"
>;

export type CreateProfileScreenProps = NativeStackScreenProps<
  ProfilesStackParamList,
  "createProfile"
>;

export type EditProfileScreenProps = NativeStackScreenProps<
  ProfilesStackParamList,
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
};

export type SettingsMenuScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, "settingsMenu">,
  BottomTabScreenProps<BottomTabParamList, "settings">
>;

export type SettingsInfoScreenProps = NativeStackScreenProps<
  SettingsStackParamList,
  "systemInfo"
>;

export function getStackNavigationOptions(
  mode?: "default" | "slide-from-bottom" | "bottom-sheet"
): NativeStackNavigationOptions {
  const config = {
    headerShown: false,
    gestureEnabled: true,
  };
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
        presentation: "containedModal",
      };
    default:
      assertNever(mode);
  }
}

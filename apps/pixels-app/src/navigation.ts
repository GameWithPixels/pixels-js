import {
  StackNavigationOptions,
  StackScreenProps,
  TransitionPresets,
} from "@react-navigation/stack";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { Platform } from "react-native";

// Root screens
export type BottomTabParamList = {
  home: undefined;
  profiles: undefined;
  animations: undefined;
  settings: undefined;
};

export type RootScreenName = keyof BottomTabParamList;

export type HomeStackProps = StackScreenProps<BottomTabParamList, "home">;

export type ProfilesStackProps = StackScreenProps<
  BottomTabParamList,
  "profiles"
>;

export type AnimationsStackProps = StackScreenProps<
  BottomTabParamList,
  "animations"
>;

export type SettingsStackProps = StackScreenProps<
  BottomTabParamList,
  "settings"
>;

// Edit profile sub screens
export type EditProfileSubStackParamList = {
  editAdvancedRules: { profileUuid: string };
  editRule: { profileUuid: string; ruleIndex: number };
  editRollRules: { profileUuid: string };
  pickAnimation: {
    animation?: Profiles.Animation;
    onSelectAnimation?: (animation: Profiles.Animation) => void;
  };
};

export type EditRuleScreenProps = StackScreenProps<
  EditProfileSubStackParamList,
  "editRule"
>;

export type EditRollRulesScreenProps = StackScreenProps<
  EditProfileSubStackParamList,
  "editRollRules"
>;

export type EditAdvancedRulesScreenProps = StackScreenProps<
  EditProfileSubStackParamList,
  "editAdvancedRules"
>;

export type PickAnimationScreenProps = StackScreenProps<
  EditProfileSubStackParamList,
  "pickAnimation"
>;

// Home screens
export type HomeStackParamList = {
  diceList: undefined;
  firmwareUpdate: undefined;
  dieDetails: { pixelId: number };
  pickProfile: { pixelId: number };
  pickProfileAndroid: { pixelId: number };
  editDieProfile: { pixelId: number };
} & EditProfileSubStackParamList;

export type DiceListScreenProps = StackScreenProps<
  HomeStackParamList,
  "diceList"
>;

export type FirmwareUpdateScreenProps = StackScreenProps<
  HomeStackParamList,
  "firmwareUpdate"
>;

export type DieDetailsScreenProps = StackScreenProps<
  HomeStackParamList,
  "dieDetails"
>;

export type PickProfileScreenProps = StackScreenProps<
  HomeStackParamList,
  "pickProfile"
>;

export type PickProfileAndroidScreenProps = StackScreenProps<
  HomeStackParamList,
  "pickProfileAndroid"
>;

export type EditDieProfileScreenProps = StackScreenProps<
  HomeStackParamList,
  "editDieProfile"
>;

// Profiles screens
export type ProfilesStackParamList = {
  profilesList: undefined;
  createProfile: undefined;
  editProfile: { profileUuid: string };
} & EditProfileSubStackParamList;

export type ProfilesListScreenProps = StackScreenProps<
  ProfilesStackParamList,
  "profilesList"
>;

export type CreateProfileScreenProps = StackScreenProps<
  ProfilesStackParamList,
  "createProfile"
>;

export type EditProfileScreenProps = StackScreenProps<
  ProfilesStackParamList,
  "editProfile"
>;

// Animations screens
export type AnimationsStackParamList = {
  animationsList: undefined;
  createAnimation: undefined;
  editAnimation: { animationUuid: string };
  pickColorDesign: {
    colorDesign?: Profiles.Pattern;
    onSelectDesign?: (colorDesign: Profiles.Pattern) => void;
  };
};

export type AnimationsListScreenProps = StackScreenProps<
  AnimationsStackParamList,
  "animationsList"
>;

export type CreateAnimationScreenProps = StackScreenProps<
  AnimationsStackParamList,
  "createAnimation"
>;

export type EditAnimationScreenProps = StackScreenProps<
  AnimationsStackParamList,
  "editAnimation"
>;

export type PickColorDesignScreenProps = StackScreenProps<
  AnimationsStackParamList,
  "pickColorDesign"
>;

// Settings screens
export type SettingsStackParamList = {
  settingsMenu: undefined;
  systemInfo: undefined;
};

export type SettingsMenuScreenProps = StackScreenProps<
  SettingsStackParamList,
  "settingsMenu"
>;

export type SettingsInfoScreenProps = StackScreenProps<
  SettingsStackParamList,
  "systemInfo"
>;

export function getStackNavigationOptions(
  mode?:
    | "default"
    | "slide-from-bottom"
    | "bottom-sheet"
    | "bottom-sheet-android"
): StackNavigationOptions {
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
        ...Platform.select({
          ios: TransitionPresets.ModalSlideFromBottomIOS,
          default: TransitionPresets.BottomSheetAndroid,
        }),
      };
    case "bottom-sheet":
      return {
        ...config,
        ...TransitionPresets.ModalPresentationIOS,
      };
    case "bottom-sheet-android":
      return {
        ...config,
        ...TransitionPresets.BottomSheetAndroid,
      };
    default:
      assertNever(mode);
  }
}

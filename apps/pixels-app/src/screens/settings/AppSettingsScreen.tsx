import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  Divider,
  Text as PaperText,
  Switch,
  TextProps,
  useTheme,
} from "react-native-paper";
import Toast from "react-native-root-toast";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import {
  AppSettingsScreenProps,
  SettingsMenuScreenProps,
} from "~/app/navigation";
import { ToastSettings } from "~/app/themes";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithValue";
import { OutlineButton } from "~/components/buttons";
import {
  Library,
  resetAppSettings,
  resetAppTransientState,
  resetDiceStats,
  resetPairedDice,
  setDiceBrightnessFactor,
  setDisablePlayingAnimations,
  switchEnableDebugMode,
} from "~/features/store";
import { resetDiceRoller } from "~/features/store/diceRollerSlice";
import { useConfirmActionSheet } from "~/hooks";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function TextSmall(props: Omit<TextProps<never>, "variant">) {
  return <PaperText {...props} />;
}

function SecretButton({
  top,
  bottom,
  left,
  right,
  onPress,
}: {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        right,
        width: 50,
        height: 50,
        zIndex: 1000,
      }}
    />
  );
}

function AppSettingsPage({
  navigation,
}: {
  navigation: SettingsMenuScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();

  const brightness = useAppSelector(
    (state) => state.appSettings.diceBrightnessFactor
  );
  const disablePlayingAnimations = useAppSelector(
    (state) => state.appSettings.disablePlayingAnimations
  );
  const showConfirmReset = useConfirmActionSheet<"keepProfiles">(
    "Reset App Settings",
    (data) => {
      const keepProfiles = data === "keepProfiles";
      console.warn(
        "Resetting app settings" + (keepProfiles ? " except profiles" : "")
      );
      appDispatch(resetAppSettings());
      appDispatch(resetPairedDice());
      appDispatch(resetDiceStats());
      appDispatch(resetDiceRoller());
      appDispatch(resetAppTransientState());
      Library.dispatchReset(appDispatch, { keepProfiles });
      navigation.navigate("onboarding");
    }
  );

  // Secret buttons to enable debug mode
  const store = useAppStore();
  const pressedSecretButtonsRef = React.useRef<Set<string>>(new Set());
  const pressSecretButton = (secret: string) => {
    pressedSecretButtonsRef.current.add(secret);
    setTimeout(() => pressedSecretButtonsRef.current.delete(secret), 3000);
    if (pressedSecretButtonsRef.current.size === 2) {
      pressedSecretButtonsRef.current.clear();
      appDispatch(switchEnableDebugMode());
      Toast.show(
        `Debug Mode ${store.getState().appSettings.enableDebugMode ? "On" : "Off"}`,
        ToastSettings
      );
    }
  };

  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <SecretButton top={0} right={0} onPress={() => pressSecretButton("1")} />
      <SecretButton
        left={0}
        bottom={0}
        onPress={() => pressSecretButton("2")}
      />
      <PageHeader onGoBack={() => navigation.goBack()}>App Settings</PageHeader>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <View style={{ gap: 10 }}>
          <Text>Global Dice Brightness</Text>
          <TextSmall>(Combined with each Profile's own brightness)</TextSmall>
          <SliderWithValue
            percentage
            value={brightness}
            onEndEditing={(v) => appDispatch(setDiceBrightnessFactor(v))}
          />
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Switch
            value={disablePlayingAnimations}
            onValueChange={(v) => {
              appDispatch(setDisablePlayingAnimations(v));
            }}
            trackColor={{
              false: colors.onSurfaceDisabled,
              true: colors.primary,
            }}
          />
          <Text>Disable Playing Animations In App</Text>
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <OutlineButton
          onPress={() => showConfirmReset({ data: "keepProfiles" })}
        >
          Reset App Settings Except Profiles
        </OutlineButton>
        <OutlineButton
          onPress={() => showConfirmReset()}
          style={{ backgroundColor: colors.errorContainer }}
        >
          Reset All App Settings
        </OutlineButton>
      </ScrollView>
    </View>
  );
}

export function AppSettingsScreen({ navigation }: AppSettingsScreenProps) {
  return (
    <AppBackground>
      <AppSettingsPage
        // @ts-ignore TODO cast to parent navigation type
        navigation={navigation}
      />
    </AppBackground>
  );
}

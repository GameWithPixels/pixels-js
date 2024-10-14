import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
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
import { isDevApp } from "~/features/isDevApp";
import {
  Library,
  resetAppSettings,
  resetAppTransientState,
  resetDiceStats,
  resetPairedDice,
  setDiceBrightnessFactor,
  setDisablePlayingAnimations,
  setForceUpdateFirmware,
  setUpdateBootloader,
  switchEnableDebugMode,
} from "~/features/store";
import { resetDiceRoller } from "~/features/store/diceRollerSlice";
import { useConfirmActionSheet, useDebugMode } from "~/hooks";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function TextSmall(props: Omit<TextProps<never>, "variant">) {
  return <PaperText {...props} />;
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
  const debugMode = useDebugMode();
  const showConfirmReset = useConfirmActionSheet<"keepProfiles">(
    "Reset App Settings",
    (data) => {
      const keepProfiles = data === "keepProfiles";
      console.warn(
        "Resetting app settings" + (keepProfiles ? " except profiles" : "")
      );
      !debugMode && appDispatch(resetAppSettings());
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
  const secretToggleRef = React.useRef<{
    counter: number;
    timeoutId?: ReturnType<typeof setTimeout>;
  }>({ counter: 0 });
  const { width, height } = useWindowDimensions();
  const checkForTogglingDevMode = (x: number, y: number) => {
    if (x > 0.8 * width && y < 0.1 * height) {
      clearTimeout(secretToggleRef.current.timeoutId);
      if (secretToggleRef.current.counter < 4) {
        secretToggleRef.current.counter++;
        secretToggleRef.current.timeoutId = setTimeout(
          () => (secretToggleRef.current.counter = 0),
          500
        );
      } else {
        secretToggleRef.current.counter = 0;
        appDispatch(switchEnableDebugMode());
        const debugMode = store.getState().appSettings.enableDebugMode;
        Toast.show(`Debug Mode ${debugMode ? "On" : "Off"}`, ToastSettings);
        if (!debugMode) {
          appDispatch(setUpdateBootloader(false));
          appDispatch(setForceUpdateFirmware(false));
        }
      }
    }
  };

  const { colors } = useTheme();
  return (
    <View
      style={{ height: "100%" }}
      onTouchEnd={(e) =>
        checkForTogglingDevMode(
          e.nativeEvent.locationX,
          e.nativeEvent.locationY
        )
      }
    >
      <PageHeader onGoBack={() => navigation.goBack()}>App Settings</PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <View style={{ gap: 10 }}>
          {isDevApp() && (
            <>
              <Divider style={{ marginVertical: 10 }} />
              <Text style={{ alignSelf: "center" }}>
                DEV APP!{debugMode ? " - Debug Mode Active" : ""}
              </Text>
              <Divider style={{ marginVertical: 10 }} />
            </>
          )}
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

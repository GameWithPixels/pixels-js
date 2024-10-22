import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { FileLogger } from "react-native-file-logger";
import { Divider, Switch, useTheme } from "react-native-paper";

import { SettingsSwitch } from "./components/SettingsSwitch";
import { Body, Remark } from "./components/text";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import {
  AppSettingsScreenProps,
  SettingsMenuScreenProps,
} from "~/app/navigation";
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
  setDebugMode,
  setDiceBrightnessFactor,
  setDisablePlayingAnimations,
  setShowAdvancedSettings,
} from "~/features/store";
import { resetDiceRoller } from "~/features/store/diceRollerSlice";
import { useConfirmActionSheet } from "~/hooks";

function AppSettingsPage({
  navigation,
}: {
  navigation: SettingsMenuScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();

  const {
    diceBrightnessFactor: brightness,
    disablePlayingAnimations: disablePlayAnims,
    showAdvancedSettings,
    debugMode,
  } = useAppSelector((state) => state.appSettings);
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
        const { showAdvancedSettings: old } = store.getState().appSettings;
        const showAdvancedSettings = !old;
        appDispatch(setShowAdvancedSettings(showAdvancedSettings));
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
              <Body style={{ alignSelf: "center" }}>
                DEV APP!{debugMode ? " - Debug Mode Active" : ""}
              </Body>
              <Divider style={{ marginVertical: 10 }} />
            </>
          )}
          <Body>Global Dice Brightness</Body>
          <Remark>(Combined with each Profile's own brightness)</Remark>
          <SliderWithValue
            percentage
            value={brightness}
            onEndEditing={(v) => appDispatch(setDiceBrightnessFactor(v))}
          />
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Switch
            value={disablePlayAnims}
            onValueChange={(v) => {
              appDispatch(setDisablePlayingAnimations(v));
            }}
            trackColor={{
              false: colors.onSurfaceDisabled,
              true: colors.primary,
            }}
          />
          <Body>Disable Playing Animations In App</Body>
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
        {showAdvancedSettings && (
          <>
            <Divider style={{ marginVertical: 10 }} />
            <SettingsSwitch
              value={showAdvancedSettings}
              onValueChange={(v) => {
                appDispatch(setShowAdvancedSettings(v));
              }}
            >
              Show Advanced Settings
            </SettingsSwitch>
            <SettingsSwitch
              value={debugMode}
              onValueChange={(v) => {
                appDispatch(setDebugMode(v));
              }}
            >
              Debug Mode
            </SettingsSwitch>
            <Divider style={{ marginVertical: 10 }} />
            <OutlineButton
              onPress={() => {
                if (__DEV__) {
                  FileLogger.getLogFilePaths().then((logFiles) =>
                    console.log("Log files:\n" + logFiles.join("\n"))
                  );
                }
                FileLogger.sendLogFilesByEmail({
                  to: "olivier@gamewithpixels.com",
                  subject: "Pixels App Logs",
                }).catch((e) =>
                  console.error("Error exporting logs: " + String(e))
                );
              }}
            >
              Export Logs
            </OutlineButton>
          </>
        )}
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

import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { AppState, ScrollView, View } from "react-native";
import { Divider, Text as PaperText, TextProps } from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithTitle";
import { OutlineButton } from "~/components/buttons";
import { Library } from "~/features/store";
import {
  resetAppSettings,
  setDiceBrightnessFactor,
} from "~/features/store/appSettingsSlice";
import { resetAppTransientState } from "~/features/store/appTransientSlice";
import { resetDiceStats } from "~/features/store/diceStatsSlice";
import { resetDiceTransientState } from "~/features/store/diceTransientSlice";
import { resetPairedDice } from "~/features/store/pairedDiceSlice";
import { useConfirmActionSheet, usePixelsCentral } from "~/hooks";
import { AppSettingsScreenProps, SettingsMenuScreenProps } from "~/navigation";

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
  const central = usePixelsCentral();
  const appDispatch = useAppDispatch();

  const settingsBrightness = useAppSelector(
    (state) => state.appSettings.diceBrightnessFactor
  );
  const [brightness, setBrightness] = React.useState(settingsBrightness);
  const brightnessValue = React.useRef(brightness);
  React.useEffect(() => {
    // Reload brightness from redux store
    setBrightness(settingsBrightness);
    brightnessValue.current = settingsBrightness;
  }, [settingsBrightness]);
  useFocusEffect(
    React.useCallback(() => {
      const subs = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          // Store brightness on app leaving foreground
          appDispatch(setDiceBrightnessFactor(brightnessValue.current));
        }
      });
      return () => {
        // Store brightness on unmount / blur
        appDispatch(setDiceBrightnessFactor(brightnessValue.current));
        subs.remove();
      };
    }, [appDispatch])
  );

  const showConfirmReset = useConfirmActionSheet("Reset App Settings", () => {
    central.stopScan();
    appDispatch(resetAppSettings());
    appDispatch(resetPairedDice());
    appDispatch(resetDiceStats());
    appDispatch(resetDiceTransientState());
    appDispatch(resetAppTransientState());
    Library.dispatchReset(appDispatch);
    navigation.navigate("onboarding");
  });
  return (
    <View style={{ height: "100%" }}>
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
          <TextSmall>(Applied on top of Profile's brightness)</TextSmall>
          <SliderWithValue
            value={brightness}
            percentage
            onValueChange={(v) => {
              setBrightness(v);
              brightnessValue.current = v;
            }}
          />
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <OutlineButton onPress={() => showConfirmReset()}>
          Reset App Settings
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

import React from "react";
import { ScrollView, View } from "react-native";
import {
  Divider,
  Text as PaperText,
  Switch,
  TextProps,
  useTheme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
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
} from "~/features/store";
import { resetDiceRoller } from "~/features/store/diceRollerSlice";
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

  const brightness = useAppSelector(
    (state) => state.appSettings.diceBrightnessFactor
  );
  const disablePlayingAnimations = useAppSelector(
    (state) => state.appSettings.disablePlayingAnimations
  );
  const showConfirmReset = useConfirmActionSheet("Reset App Settings", () => {
    central.stopScan();
    appDispatch(resetAppSettings());
    appDispatch(resetPairedDice());
    appDispatch(resetDiceStats());
    appDispatch(resetDiceRoller());
    appDispatch(resetAppTransientState());
    Library.dispatchReset(appDispatch);
    navigation.navigate("onboarding");
  });

  const { colors } = useTheme();
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

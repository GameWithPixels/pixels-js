import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  Divider,
  Text as PaperText,
  Switch,
  TextProps,
  ThemeProvider,
  useTheme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithValue";
import { GradientButton, OutlineButton } from "~/components/buttons";
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
import {
  useAppTheme,
  useBottomSheetBackHandler,
  useConfirmActionSheet,
  usePixelsCentral,
  useSetAppTheme,
} from "~/hooks";
import {
  AppSettingsScreenProps,
  RootScreenName,
  SettingsMenuScreenProps,
} from "~/navigation";
import { getBottomSheetProps, PixelThemes } from "~/themes";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function TextSmall(props: Omit<TextProps<never>, "variant">) {
  return <PaperText {...props} />;
}

function ThemePicker({ screen }: { screen: RootScreenName }) {
  const theme = useAppTheme(screen);
  const themesKeys = Object.keys(PixelThemes) as (keyof typeof PixelThemes)[];
  const selectedThemeName =
    themesKeys[Object.values(PixelThemes).indexOf(theme)];
  const setTheme = useSetAppTheme();

  const [visible, setVisible] = React.useState(false);
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const { colors } = theme;
  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text>{screen} screen:</Text>
        <OutlineButton onPress={() => setVisible(true)}>
          {selectedThemeName}
        </OutlineButton>
      </View>
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        onDismiss={() => setVisible(false)}
        onChange={onChange}
        {...getBottomSheetProps(colors)}
      >
        <ThemeProvider theme={theme}>
          <BottomSheetScrollView
            contentContainerStyle={{ padding: 20, gap: 10 }}
          >
            <Text>Theme</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {themesKeys.map((themeName) =>
                themeName === selectedThemeName ? (
                  <GradientButton key={themeName}>{themeName}</GradientButton>
                ) : (
                  <OutlineButton
                    key={themeName}
                    onPress={() => setTheme(screen, PixelThemes[themeName])}
                  >
                    {themeName}
                  </OutlineButton>
                )
              )}
            </View>
          </BottomSheetScrollView>
        </ThemeProvider>
      </BottomSheetModal>
    </>
  );
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
  const showConfirmReset = useConfirmActionSheet<"keepProfiles">(
    "Reset App Settings",
    (data) => {
      const keepProfiles = data === "keepProfiles";
      central.stopScan();
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
        <Text>Themes</Text>
        <ThemePicker screen="home" />
        <ThemePicker screen="profiles" />
        <ThemePicker screen="settings" />
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

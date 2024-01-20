import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";
import { Linking, ScrollView, View, Text as RnText } from "react-native";
import { Text } from "react-native-paper";
import { useStore } from "react-redux";

import { useAppDispatch } from "~/app/hooks";
import { RootState } from "~/app/store";
import { AppBackground } from "~/components/AppBackground";
import { MenuButton } from "~/components/buttons";
import { Library } from "~/features/store";
import { resetAppSettings } from "~/features/store/appSettingsSlice";
import { resetAppUpdate } from "~/features/store/appUpdateSlice";
import { resetRollsHistory } from "~/features/store/diceRollsSlice";
import { resetPairedDice } from "~/features/store/pairedDiceSlice";
import { useConfirmActionSheet } from "~/hooks";
import { SettingsMenuScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

const pages = [
  // "Audio Clips",
  // "Import Profiles",
  // "Export Logs",
  // "Export Settings",
  // "Import Settings",
  // "Shop",
  "How To Turn On Your Dice",
  "Support",
  "Privacy Policy",
  "App & System Information",
  "Dice Firmware Information",
  "Check for Update",
  "Reset App Settings",
  "Speech",
  "Bottom Sheet",
] as const;

type PageName = (typeof pages)[number];

function MenuSection({
  title,
  start,
  end,
  supPagesCount,
  openPage,
}: {
  title: string;
  start: number;
  end?: number;
  supPagesCount: number;

  openPage: (page: PageName) => void;
}) {
  return (
    <>
      <Text
        variant="titleLarge"
        style={AppStyles.selfCentered}
        children={title}
      />
      <View>
        {pages.slice(start, end).map((p, i) => (
          <MenuButton
            key={p}
            iconSize={i >= supPagesCount ? 0 : undefined}
            noTopBorder={i > 0}
            squaredTopBorder={i > 0}
            squaredBottomBorder={i < (end ?? pages.length) - start - 1}
            sentry-label={"settings-" + p.toLocaleLowerCase().replace(" ", "-")}
            style={{ backgroundColor: "transparent" }}
            onPress={() => openPage(p)}
          >
            {p}
          </MenuButton>
        ))}
      </View>
    </>
  );
}

function SettingsMenuPage({
  navigation,
}: {
  navigation: SettingsMenuScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const store = useStore<RootState>();
  const showConfirmReset = useConfirmActionSheet("Reset App Settings", () => {
    appDispatch(resetAppSettings());
    appDispatch(resetPairedDice());
    appDispatch(resetRollsHistory());
    appDispatch(resetAppUpdate());
    Library.dispatchReset(appDispatch);
    Library.dispatchAddDefaultProfiles(appDispatch, store.getState().library);
    navigation.navigate("onboarding");
  });
  const openPage = (page: PageName) => {
    switch (page) {
      case "How To Turn On Your Dice":
        navigation.navigate("turnOnDice");
        break;
      case "Support":
        navigation.navigate("support");
        break;
      case "Privacy Policy":
        Linking.openURL("https://gamewithpixels.com/privacy-policy/");
        break;
      case "App & System Information":
        navigation.navigate("systemInfo");
        break;
      case "Dice Firmware Information":
        navigation.navigate("firmwareInfo");
        break;
      case "Check for Update":
        navigation.navigate("checkForUpdate");
        break;
      case "Reset App Settings":
        showConfirmReset();
        break;
      case "Speech":
        navigation.navigate("speech");
        break;
      case "Bottom Sheet":
        sheetRef.current?.present();
        break;
    }
  };
  const sheetRef = React.useRef<BottomSheetModal>(null);
  return (
    <>
      <ScrollView
        style={{ height: "100%" }}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 10,
          gap: 20,
        }}
      >
        <MenuSection
          title="Help"
          start={0}
          end={3}
          supPagesCount={2}
          openPage={openPage}
        />
        <MenuSection
          title="Settings"
          start={3}
          end={7}
          supPagesCount={3}
          openPage={openPage}
        />
        <MenuSection
          title="Testing"
          start={7}
          supPagesCount={3}
          openPage={openPage}
        />
      </ScrollView>
      {/* For testing */}
      <BottomSheetModal
        ref={sheetRef}
        stackBehavior="push"
        snapPoints={["50%"]}
        backgroundStyle={getBottomSheetBackgroundStyle()}
        onDismiss={() => sheetRef.current?.dismiss()}
      >
        <BottomSheetView
          style={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RnText style={{ color: "grey", fontSize: 30 }}>All good! 🎉</RnText>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

export function SettingsMenuScreen({ navigation }: SettingsMenuScreenProps) {
  return (
    <AppBackground>
      <SettingsMenuPage navigation={navigation} />
    </AppBackground>
  );
}

import { Linking, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";

import { useAppDispatch } from "~/app/hooks";
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
  "Dice Software Information",
  "Check for Update",
  "Reset App Settings",
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
  const showConfirmReset = useConfirmActionSheet("Reset App Settings", () => {
    appDispatch(resetAppSettings());
    appDispatch(resetPairedDice());
    appDispatch(resetRollsHistory());
    appDispatch(resetAppUpdate());
    Library.dispatchReset(appDispatch);
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
      case "Dice Software Information":
        navigation.navigate("firmwareInfo");
        break;
      case "Check for Update":
        navigation.navigate("checkForUpdate");
        break;
      case "Reset App Settings":
        showConfirmReset();
        break;
    }
  };
  return (
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
        supPagesCount={3}
        openPage={openPage}
      />
    </ScrollView>
  );
}

export function SettingsMenuScreen({ navigation }: SettingsMenuScreenProps) {
  return (
    <AppBackground>
      <SettingsMenuPage navigation={navigation} />
    </AppBackground>
  );
}

import * as Linking from "expo-linking";
import React from "react";
import { ScrollView, View } from "react-native";
import { Text } from "react-native-paper";

import { SettingsMenuScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { MenuButton } from "~/components/buttons";

const pages = [
  // "Audio Clips",
  // "Import Profiles",
  // "Export Logs",
  // "Export Settings",
  // "Import Settings",
  // "Shop",
  "Check for App Patch",
  "Themes",
  "Settings",
  "App & System Information",
  "Dice Firmware Information",
  "How To Turn On Your Dice",
  "Support",
  "Privacy Policy",
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
            caretSize={i >= supPagesCount ? 0 : undefined}
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
      case "Check for App Patch":
        navigation.navigate("checkForUpdate");
        break;
      case "Themes":
        navigation.navigate("themes");
        break;
      case "Settings":
        navigation.navigate("appSettings");
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
        title="App Configuration"
        start={0}
        end={3}
        supPagesCount={3}
        openPage={openPage}
      />
      <MenuSection
        title="Information"
        start={3}
        end={5}
        supPagesCount={2}
        openPage={openPage}
      />
      <MenuSection
        title="Help"
        start={5}
        end={8}
        supPagesCount={2}
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

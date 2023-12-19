import * as Updates from "expo-updates";
import { ScrollView } from "react-native";

import { useAppDispatch } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { MenuButton } from "~/components/buttons";
import { resetAppSettingsToDefault } from "~/features/store/appSettingsSlice";
import { removeAllPairedDie } from "~/features/store/pairedDiceSlice";
import { resetProfilesToDefault } from "~/features/store/profilesLibrarySlice";
import { useConfirmActionSheet } from "~/hooks";
import { SettingsMenuScreenProps } from "~/navigation";

async function onFetchUpdateAsync() {
  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    // You can also add an alert() to see the error message in case of an error when fetching updates.
    alert(`Error fetching latest Expo update: ${error}`);
  }
}

const pages = [
  "Audio Clips",
  "Firmware",
  "Import Profiles",
  "Export Logs",
  "Export Settings",
  "Import Settings",
  "Restore Default",
  "System Info",
  "Check for Update",
] as const;

function SettingsMenuPage({
  navigation,
}: {
  navigation: SettingsMenuScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const showConfirmRestore = useConfirmActionSheet(
    "Restore Default Settings",
    () => {
      appDispatch(resetAppSettingsToDefault());
      appDispatch(removeAllPairedDie());
      appDispatch(resetProfilesToDefault());
      navigation.navigate("onboarding");
    }
  );
  const openPage = (page: (typeof pages)[number]) => {
    switch (page) {
      case "System Info":
        navigation.navigate("systemInfo");
        break;
      case "Restore Default":
        showConfirmRestore();
        break;
      case "Check for Update":
        onFetchUpdateAsync();
    }
  };
  return (
    <ScrollView
      style={{ height: "100%" }}
      contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}
    >
      {pages.map((p, i) => (
        <MenuButton
          key={p}
          iconSize={i >= 2 ? 0 : undefined}
          noTopBorder={i > 0}
          squaredTopBorder={i > 0}
          squaredBottomBorder={i < pages.length - 1}
          style={{ backgroundColor: "transparent" }}
          onPress={() => openPage(p)}
        >
          {p}
        </MenuButton>
      ))}
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

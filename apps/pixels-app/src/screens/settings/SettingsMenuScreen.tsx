import { StackNavigationProp } from "@react-navigation/stack";
import { ScrollView } from "react-native";

import { AppBackground } from "@/components/AppBackground";
import { MenuButton } from "@/components/buttons";
import { useConfirmActionSheet } from "@/hooks";
import { useSettings } from "@/hooks/useSettings";
import { SettingsMenuScreenProps, SettingsStackParamList } from "@/navigation";

const pages = [
  "Audio Clips",
  "Firmware",
  "Import Profiles",
  "Export Logs",
  "Export Settings",
  "Import Settings",
  "Restore Default",
  "System Info",
] as const;

function SettingsMenuPage({
  navigation,
}: {
  navigation: StackNavigationProp<SettingsStackParamList>;
}) {
  const { setShowIntro, setShowPromo } = useSettings();
  const showConfirmRestore = useConfirmActionSheet(
    "Restore Default Settings",
    () => {
      setShowIntro(true);
      setShowPromo(true);
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

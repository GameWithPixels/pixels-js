import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Constants from "expo-constants";
import { Box, Center, Link, Text } from "native-base";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  useWindowDimensions,
  // eslint-disable-next-line import/namespace
} from "react-native";

import Header from "./Header";
import PixelsList from "./PixelsList";

import { useAppSelector } from "~/app/hooks";
import AppPage from "~/components/AppPage";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import { type RootStackParamList } from "~/navigation";
import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function HomePage() {
  // Setup page options
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Home">>();
  useEffect(() => {
    navigation.setOptions({
      title: `Toolbox v${Constants.manifest?.version}`,
      headerTitle: ({ children }) => <Header title={children} />,
      headerStyle: {
        height: sr(40) + Constants.statusBarHeight,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DFU file
  const { dfuFiles } = useAppSelector((state) => state.dfuFiles);
  const [selectedFwLabel, setSelectedFwLabel] = useState<string>();
  useEffect(() => {
    if (dfuFiles?.length) {
      setSelectedFwLabel(
        `${dfuFiles
          .map((p) => getDfuFileInfo(p).type ?? "unknown")
          .join(", ")}: ${toLocaleDateTimeString(
          getDfuFileInfo(dfuFiles[0]).date ?? new Date(0)
        )}`
      );
    } else {
      setSelectedFwLabel(undefined);
    }
  }, [dfuFiles]);

  // Values for UI
  const { t } = useTranslation();
  const window = useWindowDimensions();
  return (
    <>
      {/* Takes all available space except for footer (see footer below this Box) */}
      <Box flex={1} alignItems="center" left="2%" width="96%">
        <Text pl="7%" mb={sr(10)} alignSelf="flex-start">
          ↖️ <Text italic>{t("openMenuToGoToValidation")}</Text>
        </Text>
        <Link onPress={() => navigation.navigate("SelectDfuFiles")}>
          {selectedFwLabel ?? t("tapToSelectFirmware")}
        </Link>
        <PixelsList />
      </Box>
      {/* Footer showing app and system info */}
      <Center mt={sr(8)}>
        <Text italic>
          {t("screenWithSize", {
            width: Math.round(window.width),
            height: Math.round(window.height),
          }) +
            " - " +
            t("osNameWithVersion", {
              name: Platform.OS,
              version: Platform.Version,
            })}
        </Text>
      </Center>
    </>
  );
}

export default function () {
  return (
    <AppPage>
      <HomePage />
    </AppPage>
  );
}

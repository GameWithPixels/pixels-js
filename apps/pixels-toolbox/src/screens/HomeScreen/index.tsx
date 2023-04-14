import { FastBox } from "@systemic-games/react-native-base-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Button, Text } from "react-native-paper";

import SwipeablePixelsList from "./SwipeablePixelsList";

import { useAppSelector } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import { HomeProps } from "~/navigation";
import gs from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function HomePage({ navigation }: HomeProps) {
  // DFU file
  const { dfuFiles } = useAppSelector((state) => state.dfuFiles);
  const [selectedFwLabel, setSelectedFwLabel] = React.useState<string>();
  React.useEffect(() => {
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

  // Navigation
  const onDieDetails = React.useCallback(
    (pixelId: number) => navigation.navigate("DieDetails", { pixelId }),
    [navigation]
  );

  // Values for UI
  const { t } = useTranslation();
  const window = useWindowDimensions();
  return (
    <>
      {/* Takes all available space except for footer (see footer below this Box) */}
      <FastBox flex={1} alignItems="center" px={3}>
        <Text style={styles.textValidation}>
          ↖️ <Text style={gs.italic}>{t("openMenuToGoToValidation")}</Text>
        </Text>
        <Button
          onPress={() => navigation.navigate("SelectDfuFiles")}
          labelStyle={gs.underlined}
        >
          {selectedFwLabel ?? t("tapToSelectFirmware")}
        </Button>
        <SwipeablePixelsList onDieDetails={onDieDetails} />
      </FastBox>
      {/* Footer showing app and system info */}
      <FastBox mt={8} alignSelf="center">
        <Text variant="labelSmall">
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
      </FastBox>
    </>
  );
}

export default function (props: HomeProps) {
  return (
    <AppPage>
      <HomePage {...props} />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  textValidation: {
    marginLeft: 20,
    margin: 3,
    alignSelf: "flex-start",
  },
});

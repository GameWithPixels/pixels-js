import { FastBox } from "@systemic-games/react-native-base-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Button, Text } from "react-native-paper";

import SwipeablePixelsList from "./SwipeablePixelsList";

import useAppDfuFilesBundles from "~/app/useAppDfuFilesBundles";
import { AppPage } from "~/components/AppPage";
import { HomeProps } from "~/navigation";
import gs from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function HomePage({ navigation }: HomeProps) {
  // DFU files bundles are loaded asynchronously
  const [selectedDfuBundle, availableDfuBundles, dfuBundlesError] =
    useAppDfuFilesBundles();

  // Label to display for the selected firmware
  const selectedFwLabel = React.useMemo(() => {
    const b = selectedDfuBundle;
    if (b) {
      return `${b.types.join(", ")}: ${toLocaleDateTimeString(b.date)}`;
    }
  }, [selectedDfuBundle]);

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
      <FastBox flex={1} gap={5} alignItems="center">
        <Text style={styles.textValidation}>
          ↖️ <Text style={gs.italic}>{t("openMenuToGoToValidation")}</Text>
        </Text>
        <Button
          onPress={() =>
            availableDfuBundles?.length && navigation.navigate("SelectDfuFiles")
          }
          contentStyle={gs.fullWidth}
          labelStyle={availableDfuBundles ? gs.underlined : gs.empty}
        >
          {dfuBundlesError
            ? "Error loading DFU files!"
            : !availableDfuBundles
            ? "Loading DFU files..."
            : !availableDfuBundles.length
            ? "Got no DFU files!"
            : selectedFwLabel ?? t("tapToSelectFirmware")}
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
    <AppPage pt={0}>
      <HomePage {...props} />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  textValidation: {
    marginLeft: 20,
    alignSelf: "flex-start",
  },
});

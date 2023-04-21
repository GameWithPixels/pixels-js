import { FastBox } from "@systemic-games/react-native-base-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import SwipeablePixelsList from "./SwipeablePixelsList";

import { AppPage } from "~/components/AppPage";
import useAppDfuFilesBundles, {
  NoDfuFileLoadedError,
} from "~/features/hooks/useAppDfuFilesBundles";
import { HomeProps } from "~/navigation";
import gs from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function DfuBundleSelection({ navigation }: Pick<HomeProps, "navigation">) {
  // DFU files bundles are loaded asynchronously
  const [selectedDfuBundle, availableDfuBundles, dfuBundlesError] =
    useAppDfuFilesBundles();
  const noDFUFiles = dfuBundlesError instanceof NoDfuFileLoadedError;

  // Function to open DFU file selection
  const selectDfuFile = React.useMemo(
    () =>
      selectedDfuBundle || noDFUFiles
        ? () => navigation.navigate("SelectDfuFiles")
        : undefined,
    [navigation, noDFUFiles, selectedDfuBundle]
  );

  // Label to display for the selected firmware
  const selectedFwLabel = React.useMemo(() => {
    const b = selectedDfuBundle;
    if (b) {
      const index = availableDfuBundles.indexOf(selectedDfuBundle);
      const date = toLocaleDateTimeString(b.date);
      return `${index === 0 ? "(*) " : ""}${b.fileTypes.join(", ")}: ${date}`;
    }
  }, [availableDfuBundles, selectedDfuBundle]);

  const { t } = useTranslation();
  const theme = useTheme();
  return !dfuBundlesError || noDFUFiles ? (
    <Button
      onPress={selectDfuFile}
      contentStyle={gs.fullWidth}
      labelStyle={availableDfuBundles ? gs.underlined : gs.empty}
    >
      {selectedDfuBundle
        ? selectedFwLabel ?? t("tapToSelectFirmware")
        : noDFUFiles
        ? "No DFU files loaded"
        : "Loading DFU files..."}
    </Button>
  ) : (
    <Text
      style={{ ...gs.bold, color: theme.colors.error, marginVertical: 10 }}
    >{`${dfuBundlesError}`}</Text>
  );
}

function HomePage({ navigation }: HomeProps) {
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
        <DfuBundleSelection navigation={navigation} />
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

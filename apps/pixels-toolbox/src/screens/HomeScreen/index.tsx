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
import { HomeScreenProps } from "~/navigation";
import gs from "~/styles";
import toLocaleDateTimeString from "~/features/toLocaleDateTimeString";

function DfuBundleSelection({
  navigation,
}: Pick<HomeScreenProps, "navigation">) {
  // DFU files bundles are loaded asynchronously
  const [selectedDfuBundle, availableDfuBundles, dfuBundlesError] =
    useAppDfuFilesBundles();
  const noDFUFilesError = dfuBundlesError instanceof NoDfuFileLoadedError;
  const dfuFilesLoading = !selectedDfuBundle && !dfuBundlesError;

  // Function to open DFU file selection
  const selectDfuFile = React.useCallback(
    () => navigation.navigate("SelectDfuFiles"),
    [navigation]
  );

  // Values for UI
  const theme = useTheme();
  const { t } = useTranslation();

  // Label to display for the selected firmware
  const selectedFwLabel = React.useMemo(() => {
    const b = selectedDfuBundle;
    if (b) {
      const index = availableDfuBundles.indexOf(selectedDfuBundle);
      const date = toLocaleDateTimeString(b.date);
      const type = b.items.map((i) => t(i.type)).join(", ");
      return `${index === 0 ? "(*) " : ""}${type}: ${date}`;
    }
  }, [availableDfuBundles, selectedDfuBundle, t]);

  return !dfuBundlesError || noDFUFilesError ? (
    <Button
      onPress={dfuFilesLoading ? undefined : selectDfuFile}
      contentStyle={gs.fullWidth}
      labelStyle={dfuFilesLoading ? gs.empty : gs.underlined}
    >
      {selectedDfuBundle
        ? selectedFwLabel ?? t("tapToSelectFirmware")
        : noDFUFilesError
        ? "No DFU files loaded"
        : "Loading DFU files..."}
    </Button>
  ) : (
    <Text
      style={{ ...gs.bold, color: theme.colors.error, marginVertical: 10 }}
    >{`${dfuBundlesError}`}</Text>
  );
}

function HomePage({ navigation }: HomeScreenProps) {
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

export default function (props: HomeScreenProps) {
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

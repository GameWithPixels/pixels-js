import { useFocusEffect } from "@react-navigation/native";
import { BaseBox } from "@systemic-games/react-native-base-components";
import * as Updates from "expo-updates";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { SwipeablePixelsList } from "./SwipeablePixelsList";

import { AppStyles } from "~/AppStyles";
import { AppPage } from "~/components/AppPage";
import { PrintDieLabelModal } from "~/components/PrintDieLabelModal";
import {
  useAppDfuFilesBundles,
  NoDfuFileLoadedError,
} from "~/features/hooks/useAppDfuFilesBundles";
import { usePrintDieLabel } from "~/features/hooks/usePrintDieLabel";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import { HomeScreenProps } from "~/navigation";

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
  const { colors } = useTheme();
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
      contentStyle={AppStyles.fullWidth}
      labelStyle={dfuFilesLoading ? AppStyles.empty : AppStyles.underlined}
    >
      {selectedDfuBundle
        ? selectedFwLabel ?? t("tapToSelectFirmware")
        : noDFUFilesError
        ? "No DFU files loaded"
        : "Loading DFU files..."}
    </Button>
  ) : (
    <Text
      style={{
        ...AppStyles.bold,
        color: colors.error,
        marginVertical: 10,
      }}
    >{`${dfuBundlesError}`}</Text>
  );
}

function HomePage({ navigation }: HomeScreenProps) {
  // Navigation
  const showDetails = React.useCallback(
    (pd: PixelDispatcher) =>
      navigation.navigate("DieDetails", { pixelId: pd.pixelId }),
    [navigation]
  );

  // Print modal
  const [printPixel, setPrintPixel] = React.useState<PixelDispatcher>();
  const { setPrintDieLabel } = usePrintDieLabel();
  React.useEffect(
    () => setPrintDieLabel(() => setPrintPixel),
    [setPrintDieLabel]
  );

  // EAS updates
  const [hasEasUpdate, setHasEasUpdate] = React.useState(false);
  useFocusEffect(
    React.useCallback(() => {
      // Checking for updates every minute
      const check = () => {
        Updates.checkForUpdateAsync()
          .then(({ manifest }) => {
            setHasEasUpdate(!!manifest);
          })
          .catch(() => {});
      };
      check();
      const id = setInterval(check, 60_000);
      return () => {
        clearInterval(id);
      };
    }, [])
  );

  // Values for UI
  const { t } = useTranslation();
  const window = useWindowDimensions();
  return (
    <>
      {/* Takes all available space except for footer (see footer below this Box) */}
      <BaseBox flex={1} gap={5} alignItems="center">
        <Text style={styles.textValidation}>
          ↖️{" "}
          <Text style={AppStyles.italic}>{t("openMenuToGoToValidation")}</Text>
        </Text>
        {hasEasUpdate && (
          <Text style={{ marginTop: 5 }}>
            ⚠️ {t("updateAvailableGoToSettings")}
          </Text>
        )}
        <DfuBundleSelection navigation={navigation} />
        <SwipeablePixelsList
          onShowDetails={showDetails}
          onPrintLabel={setPrintPixel}
        />
      </BaseBox>
      {/* Footer showing app and system info */}
      <BaseBox mt={8} alignSelf="center">
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
      </BaseBox>

      <PrintDieLabelModal
        pixel={printPixel}
        onDismiss={() => setPrintPixel(undefined)}
      />
    </>
  );
}

export function HomeScreen(props: HomeScreenProps) {
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

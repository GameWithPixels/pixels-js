import { useFocusEffect } from "@react-navigation/native";
import {
  BaseBox,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import * as Updates from "expo-updates";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, useWindowDimensions } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

import { SwipeablePixelsList } from "./SwipeablePixelsList";

import { AppStyles } from "~/AppStyles";
import { AppPage } from "~/components/AppPage";
import { PrintDieLabelModal } from "~/components/PrintDieLabelModal";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import {
  useAppDfuFilesBundles,
  NoDfuFileLoadedError,
} from "~/hooks/useAppDfuFilesBundles";
import { usePrintDieLabel } from "~/hooks/usePrintDieLabel";
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
  const blFwLabel = React.useMemo(() => {
    if (selectedDfuBundle) {
      return selectedDfuBundle.items.map((i) => t(i.type)).join(" & ");
    }
  }, [selectedDfuBundle, t]);
  const dateLabel = React.useMemo(() => {
    if (selectedDfuBundle) {
      return toLocaleDateTimeString(selectedDfuBundle.date);
    }
  }, [selectedDfuBundle]);

  return !dfuBundlesError || noDFUFilesError ? (
    <>
      <Card
        style={{ width: "100%", paddingVertical: 10, paddingHorizontal: 20 }}
      >
        <BaseVStack gap={5}>
          <Text variant="titleMedium">
            {blFwLabel ? `${blFwLabel}:` : "Loading..."}
          </Text>
          <BaseHStack alignItems="flex-end" justifyContent="space-between">
            <BaseVStack gap={5}>
              <Text>
                {selectedDfuBundle
                  ? dateLabel ?? t("tapToSelectFirmware")
                  : noDFUFilesError
                  ? "No DFU files loaded"
                  : "Loading DFU files..."}
              </Text>
              {selectedDfuBundle && (
                <Text>
                  {availableDfuBundles.indexOf(selectedDfuBundle) === 0
                    ? "(Same As Validation)"
                    : `(${
                        selectedDfuBundle.date > availableDfuBundles[0].date
                          ? "More recent"
                          : "Older"
                      } than Validation)`}
                </Text>
              )}
            </BaseVStack>
            <Button
              mode="outlined"
              onPress={dfuFilesLoading ? undefined : selectDfuFile}
            >
              Change
            </Button>
          </BaseHStack>
        </BaseVStack>
      </Card>
    </>
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
      <BaseBox flex={1} gap={10} width="100%" alignItems="center">
        {hasEasUpdate && (
          <Text style={{ marginVertical: 10 }}>
            ⚠️ {t("updateAvailableGoToSettings")}
          </Text>
        )}
        <DfuBundleSelection navigation={navigation} />
        <SwipeablePixelsList
          flex={1}
          flexGrow={1}
          width="100%"
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
    <AppPage>
      <HomePage {...props} />
    </AppPage>
  );
}

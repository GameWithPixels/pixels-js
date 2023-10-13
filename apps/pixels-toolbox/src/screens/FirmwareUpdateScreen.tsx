import { useFocusEffect } from "@react-navigation/native";
import {
  BaseBox,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import {
  BleScanner,
  ScannedPeripheral,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, StyleSheet } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { useAppSelector } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import { ProgressBar } from "~/components/ProgressBar";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { isDfuDone } from "~/features/dfu/updateFirmware";
import { useUpdateFirmware } from "~/features/hooks/useUpdateFirmware";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import { FirmwareUpdateScreenProps } from "~/navigation";

function formatAddress(address: number): string {
  return address.toString(16).toUpperCase();
}

function PeripheralInfo({ peripheral }: { peripheral: ScannedPeripheral }) {
  return (
    <Card>
      <Card.Content style={{ paddingHorizontal: 20 }}>
        <Text>Name: {peripheral.name}</Text>
        <Text>Address: {formatAddress(peripheral.address)}</Text>
        <Text>RSSI: {peripheral.advertisementData.rssi}</Text>
      </Card.Content>
    </Card>
  );
}

// We want this page to automatically update devices that have a firmware that crashes
// during init (and thus immediately reboot).
// The DFU needs to happen right after the bootloader has started.
// Idea:
// 1. Scan for all PIX* devices with a odd (or even?) mac address (= bootloader mode)
// 2. If we're getting constant advertisements for more than a few seconds it means that either
//    the device is stuck in bootloader mode (for example because of an aborted DFU) or the that
//    the firmware crashes during the init.
// 3. Only show the devices that meet the above criteria
// 4. Once the user select a device, ask them to turn it of.
// 5. Wait for advertisement to stop for that device.
// 6. Ask user to turn device back on, trigger DFU on first received advertisement.
function FirmwareUpdatePage({ navigation }: FirmwareUpdateScreenProps) {
  const errorHandler = useErrorHandler();

  // DFU files bundles are loaded asynchronously
  const { selected, available } = useAppSelector((state) => state.dfuBundles);
  const bundle = React.useMemo(
    () =>
      available[selected]
        ? DfuFilesBundle.create(available[selected])
        : undefined,
    [available, selected]
  );

  // Selection
  const [selection, setSelection] = React.useState<ScannedPeripheral>();

  // DFU
  const [dfuTarget, setDfuTarget] = React.useState<ScannedPeripheral>();
  const [updateFirmware, dfuState, dfuProgress, dfuLastError] =
    useUpdateFirmware();
  React.useEffect(() => {
    if (dfuTarget && bundle) {
      updateFirmware(
        dfuTarget,
        bundle.bootloader?.pathname,
        bundle.firmware?.pathname,
        dfuTarget.name.startsWith("PXL") || dfuTarget.name.startsWith("Dfu")
      );
    }
  }, [bundle, dfuTarget, updateFirmware]);
  React.useEffect(() => {
    if (dfuState && isDfuDone(dfuState)) {
      setDfuTarget(undefined);
    }
  }, [dfuState]);

  // Scan list
  const [scannedPeripherals, setScannedPeripherals] = React.useState<
    ScannedPeripheral[]
  >([]);
  const pendingScans = React.useRef<ScannedPeripheral[]>([]);
  // Queue scan events and process them in batch
  useFocusEffect(
    React.useCallback(() => {
      if (!dfuTarget) {
        console.log("### START SCAN");
        BleScanner.start("", (sp: ScannedPeripheral) => {
          if (sp.name.length) {
            const arr = pendingScans.current;
            const i = arr.findIndex((item) => item.systemId === sp.systemId);
            if (i < 0) {
              arr.push(sp);
            } else {
              arr[i] = sp;
            }
          }
        }).catch(errorHandler);
        return () => {
          console.log("### STOP SCAN");
          BleScanner.stop().catch(errorHandler);
        };
      }
    }, [errorHandler, dfuTarget])
  );
  // Process scan events in batches
  React.useEffect(() => {
    const id = setInterval(
      () =>
        setScannedPeripherals((arr) => {
          if (pendingScans.current.length) {
            const scans = pendingScans.current;
            pendingScans.current = [];
            arr = [...arr];
            for (const sp of scans) {
              const index = arr.findIndex(
                (item) => item.systemId === sp.systemId
              );
              if (index < 0) {
                arr.push(sp);
              } else {
                arr[index] = sp;
              }
            }
          }
          return arr;
        }),
      1000 // Update every second
    );
    return () => {
      clearInterval(id);
    };
  }, [errorHandler]);
  React.useEffect(() => {
    if (!dfuTarget) {
      setScannedPeripherals([]);
    }
  }, [dfuTarget]);

  // Clear error
  const clearError = React.useCallback(() => {
    setErrorCleared(true);
    setDfuTarget(undefined);
  }, []);

  // Values for UI
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorCleared, setErrorCleared] = React.useState(false);
  React.useEffect(() => dfuLastError && setErrorCleared(false), [dfuLastError]);

  // Build UI label for selected bundle
  const bundleLabel = React.useMemo(() => {
    if (bundle) {
      const date = toLocaleDateTimeString(bundle.date);
      const types = bundle.items.map((i) => t(i.type)).join(", ");
      return `${selected === 0 ? "(*) " : ""}${types}: ${date}`;
    }
  }, [bundle, selected, t]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: sp }: { item: ScannedPeripheral }) => (
      <Pressable key={sp.systemId} onPress={() => setSelection(sp)}>
        <PeripheralInfo peripheral={sp} />
      </Pressable>
    ),
    []
  );
  const refreshControl = React.useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          setScannedPeripherals([]);
          pendingScans.current.length = 0;
          setTimeout(() => {
            // Wait of 1 second before stopping the refresh animation
            setRefreshing(false);
          }, 1000);
        }}
      />
    ),
    [refreshing]
  );

  return (
    <BaseVStack flex={1}>
      {dfuLastError && !errorCleared ? (
        // Got an error, display it until cleared
        <BaseVStack alignItems="center" justifyContent="center" gap={10}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.error }}
          >{`${dfuLastError}`}</Text>
          <Button
            mode="contained-tonal"
            style={styles.buttonOk}
            onPress={clearError}
          >
            {t("ok")}
          </Button>
        </BaseVStack>
      ) : selection ? (
        // Confirm selection
        <BaseVStack gap={10}>
          <Text>{`Proceed with firmware update on ${selection.name}?`}</Text>
          <BaseHStack alignSelf="center" gap={10}>
            <Button
              mode="contained-tonal"
              onPress={() => {
                setSelection(undefined);
                setDfuTarget({ ...selection });
              }}
            >
              {t("ok")}
            </Button>
            <Button
              mode="contained-tonal"
              onPress={() => setSelection(undefined)}
            >
              {t("cancel")}
            </Button>
          </BaseHStack>
        </BaseVStack>
      ) : dfuState && !isDfuDone(dfuState) ? (
        // DFU
        <BaseVStack gap={10} alignItems="center" justifyContent="center">
          <Text variant="bodyLarge">Selected Peripheral:</Text>
          {dfuTarget && <PeripheralInfo peripheral={dfuTarget} />}
          <Text variant="bodyLarge">Performing Firmware Update:</Text>
          {dfuState === "uploading" ? (
            <BaseBox w="100%" p={2}>
              <ProgressBar percent={dfuProgress} />
            </BaseBox>
          ) : (
            <Text style={AppStyles.italic}>
              {t("dfuStateWithStatus", { status: t(dfuState) })}
            </Text>
          )}
        </BaseVStack>
      ) : (
        // Scan list
        <>
          <Button
            labelStyle={{ alignSelf: "center", ...AppStyles.underlined }}
            onPress={() => navigation.navigate("SelectDfuFiles")}
          >
            {bundleLabel ?? t("tapToSelectFirmware")}
          </Button>
          {bundleLabel && (
            <BaseVStack gap={10}>
              <Text style={AppStyles.italic}>
                Tap on a peripheral to attempt a Pixel firmware update.
              </Text>
              <Text variant="bodyLarge">Bluetooth Scanned Peripherals:</Text>
              <FlatList
                style={AppStyles.fullWidth}
                contentContainerStyle={AppStyles.listContentContainer}
                data={scannedPeripherals}
                renderItem={renderItem}
                refreshControl={refreshControl}
              />
            </BaseVStack>
          )}
        </>
      )}
    </BaseVStack>
  );
}

export function FirmwareUpdateScreen(props: FirmwareUpdateScreenProps) {
  return (
    <AppPage>
      <FirmwareUpdatePage {...props} />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "gray",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOk: {
    marginTop: 10,
    width: 100,
  },
});

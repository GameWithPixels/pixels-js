import {
  FastBox,
  FastHStack,
  FastVStack,
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

import { useAppSelector } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import ProgressBar from "~/components/ProgressBar";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { useUpdateFirmware } from "~/features/hooks/useUpdateFirmware";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import { FirmwareUpdateScreenProps } from "~/navigation";
import gs from "~/styles";

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
        dfuTarget.name.startsWith("PXL") || dfuTarget.name.startsWith("Dfu") // Running bootloader?
      );
    }
  }, [bundle, dfuTarget, updateFirmware]);
  React.useEffect(() => {
    if (dfuState === "completed" || dfuState === "aborted") {
      setDfuTarget(undefined);
    }
  }, [dfuState]);

  // Scan list
  const [scannedPeripherals, setScannedPeripherals] = React.useState<
    ScannedPeripheral[]
  >([]);
  const pendingScans = React.useRef<ScannedPeripheral[]>([]);
  // Queue scan events and process them in batch
  React.useEffect(() => {
    BleScanner.start("", (sp: ScannedPeripheral) => {
      const arr = pendingScans.current;
      const i = arr.findIndex((item) => item.systemId === sp.systemId);
      if (i < 0) {
        arr.push(sp);
      } else {
        arr[i] = sp;
      }
    }).catch(errorHandler);
    return () => {
      BleScanner.stop().catch(errorHandler);
    };
  }, [errorHandler]);
  // Process scan events in batches
  React.useEffect(() => {
    const id = setInterval(
      () =>
        setScannedPeripherals((arr) => {
          if (pendingScans.current.length) {
            const scans = pendingScans.current;
            pendingScans.current = [];
            arr = [...arr];
            scans.forEach((sp) => {
              const index = arr.findIndex(
                (item) => item.systemId === sp.systemId
              );
              if (index < 0) {
                arr.push(sp);
              } else {
                arr[index] = sp;
              }
            });
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
  const theme = useTheme();
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
    <FastVStack flex={1}>
      {dfuLastError && !errorCleared ? (
        // Got an error, display it until cleared
        <FastVStack alignItems="center" justifyContent="center" gap={10}>
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.error }}
          >{`${dfuLastError}`}</Text>
          <Button
            mode="contained-tonal"
            style={styles.buttonOk}
            onPress={clearError}
          >
            {t("ok")}
          </Button>
        </FastVStack>
      ) : selection ? (
        // Confirm selection
        <FastVStack gap={10}>
          <Text>{`Proceed with firmware update on ${selection.name}?`}</Text>
          <FastHStack alignSelf="center" gap={10}>
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
          </FastHStack>
        </FastVStack>
      ) : dfuState ? (
        // DFU
        <FastVStack gap={10} alignItems="center" justifyContent="center">
          <Text variant="bodyLarge">Selected Peripheral:</Text>
          {dfuTarget && <PeripheralInfo peripheral={dfuTarget} />}
          <Text variant="bodyLarge">Performing Firmware Update:</Text>
          {dfuState === "uploading" ? (
            <FastBox w="100%" p={2}>
              <ProgressBar percent={dfuProgress} />
            </FastBox>
          ) : (
            <Text style={gs.italic}>
              {t("dfuStateWithStatus", { status: t(dfuState) })}
            </Text>
          )}
        </FastVStack>
      ) : (
        // Scan list
        <>
          <Button
            labelStyle={{ alignSelf: "center", ...gs.underlined }}
            onPress={() => navigation.navigate("SelectDfuFiles")}
          >
            {bundleLabel ?? t("tapToSelectFirmware")}
          </Button>
          {bundleLabel && (
            <FastVStack gap={10}>
              <Text style={gs.italic}>
                Tap on a peripheral to attempt a Pixel firmware update.
              </Text>
              <Text variant="bodyLarge">Bluetooth Scanned Peripherals:</Text>
              <FlatList
                style={gs.fullWidth}
                data={scannedPeripherals}
                renderItem={renderItem}
                contentContainerStyle={gs.listContentContainer}
                refreshControl={refreshControl}
              />
            </FastVStack>
          )}
        </>
      )}
    </FastVStack>
  );
}

export default function (props: FirmwareUpdateScreenProps) {
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

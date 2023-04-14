import { FastBox } from "@systemic-games/react-native-base-components";
import {
  BleScanner,
  ScannedPeripheral,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, StyleSheet } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { useAppSelector } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import ProgressBar from "~/components/ProgressBar";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import useUpdateFirmware from "~/features/dfu/useUpdateFirmware";
import { FirmwareUpdateProps } from "~/navigation";
import gs from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function formatAddress(address: number): string {
  return address.toString(16).toUpperCase();
}

function PeripheralInfo({ peripheral }: { peripheral: ScannedPeripheral }) {
  return (
    <>
      <Text>Name: {peripheral.name}</Text>
      <Text>Address: {formatAddress(peripheral.address)}</Text>
      <Text>RSSI: {peripheral.advertisementData.rssi}</Text>
    </>
  );
}

function keyExtractor(p: ScannedPeripheral) {
  return p.systemId;
}
function Separator() {
  return <FastBox height={3} />;
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
function FirmwareUpdatePage({ navigation }: FirmwareUpdateProps) {
  const errorHandler = useErrorHandler();

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

  // DFU
  const [dfuTarget, setDfuTarget] = React.useState<ScannedPeripheral>();
  const [updateFirmware, dfuState, dfuProgress, dfuLastError] =
    useUpdateFirmware();
  const onSelect = React.useCallback(
    (sp: ScannedPeripheral) => {
      setDfuTarget((dfuTarget) => {
        if (!dfuTarget) {
          const filesInfo = dfuFiles.map(getDfuFileInfo);
          const bootloader = filesInfo.filter(
            (i) => i.type === "bootloader"
          )[0];
          const firmware = filesInfo.filter((i) => i.type === "firmware")[0];
          if (firmware?.pathname?.length) {
            dfuTarget = sp;
            updateFirmware(
              sp.address,
              bootloader?.pathname,
              firmware?.pathname
            );
          }
        }
        return dfuTarget;
      });
    },
    [dfuFiles, updateFirmware]
  );

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
            arr = [...arr];
            pendingScans.current.forEach((sp) => {
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
  }, [errorHandler, onSelect]);

  // Values for UI
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorCleared, setErrorCleared] = React.useState(false);
  React.useEffect(() => dfuLastError && setErrorCleared(false), [dfuLastError]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: sp }: { item: ScannedPeripheral }) => (
      <Pressable style={styles.card} onPress={() => onSelect(sp)}>
        <PeripheralInfo peripheral={sp} />
      </Pressable>
    ),
    [onSelect]
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

  const theme = useTheme();

  return (
    <FastBox w="100%" m={3}>
      {dfuLastError && !errorCleared ? (
        // Got an error
        <FastBox w="100%" alignItems="center" justifyContent="center">
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.error }}
          >{`${dfuLastError}`}</Text>
          <Button
            mode="contained-tonal"
            style={styles.buttonOk}
            onPress={() => setErrorCleared(true)}
          >
            {t("ok")}
          </Button>
        </FastBox>
      ) : !dfuState ? (
        <>
          <Button
            labelStyle={{ alignSelf: "center", ...gs.underlined }}
            onPress={() => navigation.navigate("SelectDfuFiles")}
          >
            {selectedFwLabel ?? t("tapToSelectFirmware")}
          </Button>
          {selectedFwLabel && (
            <FastBox gap={10}>
              <Text style={gs.italic}>
                Tap on a peripheral to attempt a Pixel firmware update.
              </Text>
              <Text style={gs.bold}>Bluetooth Scanned Peripherals:</Text>
              <FlatList
                style={gs.fullWidth}
                data={scannedPeripherals}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={Separator}
                refreshControl={refreshControl}
              />
            </FastBox>
          )}
        </>
      ) : (
        // Updating Firmware
        <FastBox
          width="100%"
          gap={10}
          alignItems="center"
          justifyContent="center"
        >
          <Text style={gs.bold}>Selected Peripheral:</Text>
          {dfuTarget && <PeripheralInfo peripheral={dfuTarget} />}
          <Text style={gs.bold}>Performing Firmware Update:</Text>
          {dfuState === "dfuStarting" && dfuProgress > 0 ? (
            <FastBox w="100%" p={2}>
              <ProgressBar percent={dfuProgress} />
            </FastBox>
          ) : (
            <Text style={gs.italic}>
              {t("dfuStateWithStatus", {
                status: dfuState ? t(dfuState) : t("initializing"),
              })}
            </Text>
          )}
        </FastBox>
      )}
    </FastBox>
  );
}

export default function (props: FirmwareUpdateProps) {
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

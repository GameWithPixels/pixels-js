import * as React from "react";
import { useCallback, useState } from "react";
import DocumentPicker, { types } from "react-native-document-picker";
import {
  StyleSheet,
  View,
  Text,
  Button,
  SafeAreaView,
  StatusBar,
} from "react-native";
import {
  startDfu,
  DfuProgressEvent,
  DfuStateEvent,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import type { Device } from "@systemic-games/react-native-bluetooth-le";
import RNFS from "react-native-fs";
import bleHelper from "./pixel/PixelBleHelper";

export default function App() {
  const [zipPath, setZipPath] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
  const [dfuState, setDfuState] = useState("");
  const [dfuProgress, setDfuProgress] = useState(0);
  const [lastError, setLastError] = useState("");

  const errorHandler = useCallback((error: any) => {
    if (typeof error === "string") {
      setLastError(error);
    } else if (error.message) {
      setLastError(error.message);
    } else {
      setLastError(JSON.stringify(error));
    }
    console.error(error);
  }, []);

  // Request user to select firmware file and copy it to local folder
  const selectFile = useCallback(async () => {
    setLastError("");
    try {
      const response = await DocumentPicker.pick({
        presentationStyle: "fullScreen",
        type: [types.zip],
        allowMultiSelection: false,
      });
      if (response.length) {
        console.log("Selected file: " + response[0].uri);
        const destPath = `${RNFS.TemporaryDirectoryPath}/firmware.zip`;
        await RNFS.copyFile(response[0].uri, destPath);
        console.log("File copied to " + destPath);
        setZipPath(destPath);
      }
    } catch (err) {
      errorHandler(err);
      setZipPath("");
    }
  }, [errorHandler]);

  // Scan for Pixels
  const startScan = useCallback(() => {
    setLastError("");
    bleHelper.subscribeConnectionStatusChanged();
    setScanStatus("scanRequested");
    bleHelper.subscribeScanStatusChanged((scanning) => {
      if (scanning) {
        setScanStatus("scanning");
      } else {
        setScanStatus("");
      }
    });
    bleHelper
      .scanForPixels((device, _advData) => {
        // eslint-disable-next-line no-shadow
        setScannedDevices((scannedDevices) => {
          // face status from adv data
          if (
            scannedDevices.findIndex((d) => d.systemId === device.systemId) < 0
          ) {
            console.log(`Found device ${device.name}`);
            const arr = [...scannedDevices, device];
            return arr.sort((d1, d2) => d1.name.localeCompare(d2.name));
          }
          return scannedDevices;
        });
      })
      .then((res) => {
        if (!res) {
          setScanStatus("error");
        }
      })
      .catch(errorHandler);
  }, [errorHandler]);

  // Stop scanning
  const stopScan = useCallback(() => {
    bleHelper.stopScanning();
  }, []);

  // Upload selected firmware
  const uploadFirmware = useCallback(async () => {
    setLastError("");
    setDfuState("");
    setDfuProgress(0);
    const dev = scannedDevices[0];
    try {
      console.log(`Starting DFU on ${dev.address.toString(16)}`);
      await startDfu(dev.address, zipPath, {
        deviceName: dev.name,
        retries: 3,
        dfuStateListener: ({ state }: DfuStateEvent) => {
          console.log("DFU state:", state);
          setDfuState(state);
        },
        dfuProgressListener: ({ percent }: DfuProgressEvent) => {
          console.log("DFU progress:", percent);
          setDfuProgress(percent);
        },
      });
      console.log("DFU successful");
    } catch (err) {
      errorHandler(err);
    }
  }, [scannedDevices, zipPath, errorHandler]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={"dark-content"} />
      <Text style={styles.textTitle}>Pixels DFU update</Text>
      <Text style={styles.text}>1. Select Zip File</Text>
      <Text style={styles.text}>2. Scan for BLE devices</Text>
      <Text style={styles.text}>3. Upload file (to 1st device in list)</Text>
      <View style={styles.box}>
        <Button title="Select Zip file" onPress={selectFile} />
        <Text
          style={styles.textFilename}
          numberOfLines={1}
          ellipsizeMode={"middle"}
        >
          {`File: ${zipPath}`}
        </Text>
      </View>
      <View style={styles.box}>
        <View style={styles.containerRow}>
          <Button title="Scan" onPress={startScan} />
          <Button title="Stop Scan" onPress={stopScan} />
          <Button title="Clear" onPress={() => setScannedDevices([])} />
        </View>
        <Text style={styles.text}>{`Scan status: ${scanStatus}`}</Text>
        <Text style={styles.text}>Scanned devices:</Text>
        {scannedDevices.map((dev, i) => (
          <Text
            style={i === 0 ? styles.textSelectedDevice : styles.textDevice}
            key={dev.address}
          >{`${dev.name} => ${dev.address.toString(16)}`}</Text>
        ))}
      </View>
      <View style={styles.box}>
        {zipPath.length && scannedDevices.length ? (
          <Button title="Upload!" onPress={uploadFirmware} />
        ) : (
          <></>
        )}
        <Text style={styles.text}>{`DFU state: ${dfuState}`}</Text>
        <Text style={styles.text}>{`DFU progress: ${dfuProgress}`}</Text>
      </View>
      {lastError ? (
        <Text style={styles.textError}>{`Error!\n${lastError}`}</Text>
      ) : (
        <></>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  containerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  box: {
    margin: "3%",
    backgroundColor: "lightgray",
    borderRadius: 10,
    paddingVertical: "4%",
    paddingHorizontal: "4%",
    width: "95%",
  },
  text: {
    fontSize: 18,
  },
  textTitle: {
    fontSize: 22,
    fontWeight: "bold",
    paddingVertical: "5%",
  },
  textFilename: {
    fontSize: 14,
    paddingTop: "2%",
  },
  textSelectedDevice: {
    fontSize: 18,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  textDevice: {
    fontSize: 18,
  },
  textError: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

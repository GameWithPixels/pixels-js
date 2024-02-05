import {
  Central,
  ScannedPeripheral,
} from "@systemic-games/react-native-bluetooth-le";
import {
  DfuError,
  DfuProgressEvent,
  DfuState,
  DfuStateEvent,
  DfuTargetId,
  abortDfu,
  startDfu,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import * as React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text as RNText,
  useColorScheme,
  TextProps,
  PressableProps,
  Switch,
} from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import DocumentPicker, { types } from "react-native-document-picker";

const pixelServiceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

function getFilename(uri: string): string {
  return uri.split("/").pop() ?? uri;
}

function idToString(targetId: DfuTargetId): string {
  return typeof targetId === "number"
    ? targetId.toString(16).match(/.{2}/g)?.join(":") ?? ""
    : `{${targetId}}`;
}

export default function App() {
  // Dark mode support
  const isDarkMode = useColorScheme() === "dark";
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  // Keep last error to display it
  const [lastError, setLastError] = React.useState<Error>();
  // Scanning status
  const [isScanning, setIsScanning] = React.useState(false);
  // Whether to only scan for Pixels
  const [onlyPixels, setOnlyPixels] = React.useState(false);
  const [scannedPeripherals, setScannedPeripherals] = React.useState<
    ScannedPeripheral[]
  >([]);

  // Update list of peripheral with the given data
  const updatePeripherals = React.useCallback(
    (peripheral: ScannedPeripheral) =>
      setScannedPeripherals((prevPeripherals) => {
        const index = prevPeripherals.findIndex(
          (p) => p.systemId === peripheral.systemId
        );
        if (index < 0) {
          // New peripheral
          return [...prevPeripherals, peripheral];
        } else {
          // Replace previous entry
          const copy = [...prevPeripherals];
          copy[index] = peripheral;
          return copy;
        }
      }),
    []
  );

  // Initialize/shutdown Central
  React.useEffect(() => {
    // Clear any pending error
    setLastError(undefined);
    // Initialize Central
    Central.initialize();
    // Start scanning immediately
    setIsScanning(true);
    return () => {
      // Stop Central
      Central.shutdown();
    };
  }, []);

  // Start/stop scanning
  React.useEffect(() => {
    if (onlyPixels) {
      // Keep only Pixels
      setScannedPeripherals((peripherals) =>
        peripherals.filter(
          (p) => p.advertisementData.services?.includes(pixelServiceUuid)
        )
      );
    }
    if (isScanning) {
      // Clear any pending error
      setLastError(undefined);
      // Start scanning
      const services = onlyPixels ? [pixelServiceUuid] : [];
      Central.startScan(services, (ev) => {
        if (ev.type === "peripheral") {
          // Only show connectable peripherals with a name
          if (
            ev.peripheral.name.length &&
            ev.peripheral.advertisementData.isConnectable
          ) {
            updatePeripherals(ev.peripheral);
          }
        } else if (ev.scanStatus !== "stopped") {
          setIsScanning(false);
        }
      }).catch((error) => {
        setIsScanning(false);
        setLastError(error);
      });
    } else {
      Central.stopScan();
    }
  }, [isScanning, onlyPixels, updatePeripherals]);

  // DFU
  const [dfuFile, setDFUFile] = React.useState<{
    name: string;
    uri: string;
  }>();
  const [queuedDFUs, setQueuedDFUs] = React.useState<ScannedPeripheral[]>([]);
  const [currentDFU, setCurrentDFU] = React.useState<string>();
  const [state, setState] = React.useState<DfuState>();
  const [progress, setProgress] = React.useState<number>(0);
  React.useEffect(() => {
    if (dfuFile && !currentDFU && queuedDFUs.length) {
      const p = queuedDFUs[0];
      if (p) {
        setCurrentDFU(p.systemId);
        const id = p.address ? p.address : p.systemId;
        console.log(`Starting DFU for ${idToString(id)} with ${dfuFile.uri}`);
        startDfu(id, dfuFile.uri, {
          dfuStateListener: (ev: DfuStateEvent) => {
            console.log(`DFU state: ${idToString(ev.targetId)} => ${ev.state}`);
            setState(ev.state);
            if (
              ev.state === "completed" ||
              ev.state === "aborted" ||
              ev.state === "errored"
            ) {
              setProgress(0);
              setQueuedDFUs((q) => q.filter((_, i) => i > 0));
              setCurrentDFU(undefined);
            }
          },
          dfuProgressListener: (ev: DfuProgressEvent) => {
            if (ev.percent % 10 === 0) {
              console.log(`DFU upload: ${ev.percent}%`);
            }
            setProgress(ev.percent);
          },
        }).catch((error: DfuError) => {
          console.log(`DFU error: ${error}`);
          setLastError(error);
        });
      }
    }
  }, [currentDFU, dfuFile, queuedDFUs]);

  return (
    <SafeAreaView style={[styles.containerMain, backgroundStyle]}>
      <Text style={styles.textTitle}>React Native</Text>
      <Text style={styles.textTitle}>DFU Example</Text>
      {lastError && (
        <Text style={styles.textError}>Error! {lastError.message}</Text>
      )}
      <View style={styles.containerHorizontal}>
        <Button onPress={() => setIsScanning((b) => !b)}>
          {isScanning ? "Stop Scanning" : "Start Scan"}
        </Button>
        <Button
          style={styles.button}
          onPress={() => {
            setScannedPeripherals((peripherals) =>
              peripherals.filter(
                (p) => !!queuedDFUs.find((p2) => p.systemId === p2.systemId)
              )
            );
          }}
        >
          Clear List
        </Button>
      </View>
      <Button
        style={styles.button}
        onPress={() => {
          const selectDFUFile = async () => {
            const response = await DocumentPicker.pickSingle({
              presentationStyle: "fullScreen",
              type: [types.zip],
              copyTo: "cachesDirectory",
            });
            if (response.fileCopyUri) {
              setDFUFile({
                name: response.name ?? getFilename(response.uri),
                uri: response.fileCopyUri,
              });
            }
          };
          selectDFUFile().catch(() => {});
        }}
      >
        {!dfuFile ? "Select DFU File" : dfuFile.name}
      </Button>
      <View style={styles.containerHorizontal}>
        <Text>Scan Only For Pixels Dice</Text>
        <Switch
          onValueChange={() => setOnlyPixels((b) => !b)}
          value={onlyPixels}
        />
      </View>
      <ScrollView
        style={styles.fullWidth}
        contentContainerStyle={styles.containerItems}
      >
        {scannedPeripherals.length ? (
          scannedPeripherals.map((p) => {
            const isDfuQueued = !!queuedDFUs.find(
              (p2) => p.systemId === p2.systemId
            );
            const dfuStatus = !isDfuQueued
              ? "none"
              : currentDFU !== p.systemId
                ? `pending${dfuFile ? "" : " (no file selected)"}`
                : `${state} ${state === "uploading" ? `${progress}%` : ""}`;
            return (
              <View key={p.systemId} style={styles.frame}>
                <Text style={styles.textHeader}>
                  {p.name.length ? p.name : "[no name]"}
                </Text>
                <Text>
                  <Text>DFU Status: {dfuStatus}</Text>
                </Text>
                <View style={styles.containerHorizontal}>
                  <Button
                    onPress={() => {
                      setLastError(undefined);
                      setQueuedDFUs((q) => {
                        const i = q.findIndex(
                          (p2) => p.systemId === p2.systemId
                        );
                        switch (i) {
                          case -1:
                            return [...q, p];
                          case 0:
                            console.log("Aborting DFU!");
                            abortDfu().catch(setLastError);
                          // eslint-disable-next-line no-fallthrough
                          default:
                            return q.filter((_, j) => i !== j);
                        }
                      });
                    }}
                  >
                    {isDfuQueued ? "Cancel DFU" : "Queue DFU"}
                  </Button>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.textHeader}>No peripheral found so far</Text>
        )}
      </ScrollView>
      <Text>by Systemic Games</Text>
    </SafeAreaView>
  );
}

// Text component with theme support
function Text({ style, ...props }: TextProps) {
  const isDarkMode = useColorScheme() === "dark";
  const colorStyle = {
    color: isDarkMode ? Colors.white : Colors.black,
  };
  return <RNText style={[styles.text, colorStyle, style]} {...props} />;
}

// Button component with theme support
function Button({ children, style, ...props }: PressableProps) {
  const isDarkMode = useColorScheme() === "dark";
  const normalStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    borderColor: isDarkMode ? Colors.lighter : Colors.darker,
  };
  const pressedStyle = {
    backgroundColor: isDarkMode ? Colors.dark : Colors.light,
    borderColor: isDarkMode ? Colors.lighter : Colors.darker,
  };
  return (
    <Pressable
      style={(state) => [
        styles.button,
        state.pressed ? pressedStyle : normalStyle,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  containerMain: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 10,
    gap: 20,
  },
  containerHorizontal: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 20,
  },
  frame: {
    width: "100%",
    padding: 10,
    gap: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "gray",
  },
  fullWidth: {
    width: "100%",
  },
  containerItems: {
    flexGrow: 1,
    gap: 10,
    padding: 10,
  },
  text: {},
  textTitle: {
    fontWeight: "bold",
    fontSize: 30,
  },
  textHeader: {
    fontWeight: "bold",
    fontSize: 20,
    alignSelf: "center",
  },
  textError: {
    fontWeight: "bold",
    color: "crimson",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
  },
});

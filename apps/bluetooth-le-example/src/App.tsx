import {
  Central,
  CentralEventMap,
  ConnectionStatus,
  ScannedPeripheral,
} from "@systemic-games/react-native-bluetooth-le";
import * as React from "react";
import {
  Platform,
  Pressable,
  PressableProps,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text as RNText,
  TextProps,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

const pixelServiceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const pixelNotifyCharacteristicUuid = pixelServiceUuid;
const pixelWriteCharacteristicUuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

// Returns whether the given peripheral is a Pixels die
function isPixel(peripheral: ScannedPeripheral): boolean {
  return (
    peripheral.advertisementData.services?.includes(pixelServiceUuid) ?? false
  );
}

// Returns whether the given status means the peripheral is connecting, connected or ready
function isConnectingOrReady(status?: ConnectionStatus): boolean {
  return (
    status === "connecting" || status === "connected" || status === "ready"
  );
}

// Returns whether the given status means the peripheral is disconnecting or disconnected
function isDisconnected(status?: ConnectionStatus) {
  return status === "disconnecting" || status === "disconnected";
}

// Identify the peripheral (it should be a Pixels die)
async function identify(peripheral: ScannedPeripheral): Promise<void> {
  await Central.writeCharacteristic(
    peripheral,
    pixelServiceUuid,
    pixelWriteCharacteristicUuid,
    new Uint8Array([
      1, // message type => WhoAreYou
    ])
  );
}

// Make the peripheral blink (it should be a Pixels die)
async function blink(peripheral: ScannedPeripheral): Promise<void> {
  await Central.writeCharacteristic(
    peripheral,
    pixelServiceUuid,
    pixelWriteCharacteristicUuid,
    /* eslint-disable prettier/prettier */
    new Uint8Array([
      29, // message type => Blink
      3, // count
      0, 3, // duration
      10, 10, 0, 0, // color
      255, 255, 255, 255, // face mask
      200, // fade
      0, // loop
    ])
    /* eslint-enable prettier/prettier */
  );
}

export default function App() {
  // Dark mode support
  const isDarkMode = useColorScheme() === "dark";
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  // Keep last error to display it
  const [lastError, setLastError] = React.useState<Error>();
  // Auto start scanning
  const [autoStart, setAutoStart] = React.useState(true);
  // Scanning status
  const [isScanning, setIsScanning] = React.useState(false);
  // Whether to only scan for Pixels
  const [onlyPixels, setOnlyPixels] = React.useState(false);
  // List of scanned peripherals
  const [scannedPeripherals, setScannedPeripherals] = React.useState<
    (ScannedPeripheral & { ledCount?: number })[]
  >([]);
  // List of last know connection status for the peripherals
  const [connectionStatuses, setConnectionStatuses] = React.useState<
    CentralEventMap["peripheralConnectionStatus"][]
  >([]);

  // Update list of peripheral with the given data
  const updatePeripherals = React.useCallback(
    (peripheral: ScannedPeripheral & { ledCount?: number }) =>
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

  // Get latest known connection status for given peripheral
  const getConnectionStatus = (
    peripheral: ScannedPeripheral
  ): ConnectionStatus =>
    connectionStatuses.find(
      (s) => s.peripheral.systemId === peripheral.systemId
    )?.connectionStatus ?? "disconnected";

  // Scan function
  const scan = React.useCallback((onlyPixels: boolean) => {
    // Clear any pending error
    setLastError(undefined);
    // Start scanning
    const services = onlyPixels ? [pixelServiceUuid] : [];
    Central.startScan(services).catch((e) => {
      setLastError(e);
    });
  }, []);

  // Update scan when "onlyPixels" changes
  const changeOnlyPixels = (onlyPixels: boolean) => {
    setOnlyPixels(onlyPixels);
    if (onlyPixels) {
      // Keep only Pixels
      setScannedPeripherals((peripherals) =>
        peripherals.filter((p) =>
          p.advertisementData.services?.includes(pixelServiceUuid)
        )
      );
    }
    if (isScanning) {
      scan(onlyPixels);
    }
  };

  // Initialize/shutdown Central
  React.useEffect(() => {
    // Clear any pending error
    setLastError(undefined);
    // Set up Central event listeners
    const onScanStatus = ({ status }: CentralEventMap["scanStatus"]) => {
      console.log(`Scan status ${status}`);
      setIsScanning(status === "scanning");
    };
    const onScannedPeripheral = ({
      peripheral: p,
    }: CentralEventMap["scannedPeripheral"]) => {
      // Only show connectable peripherals with a name
      if (p.name.length && p.advertisementData.isConnectable) {
        updatePeripherals(p);
        // When a connected peripheral is reset, there is a delay before we are notified
        // of a disconnection. However the peripheral might quickly restart and be scanned
        // before this delay elapses, so we reset its last know connection status by removing
        // it from the list.
        setConnectionStatuses((statuses) =>
          statuses.filter((s) => s.peripheral.systemId !== p.systemId)
        );
      }
    };
    // Peripheral connection status changed callback
    const onConnection = (
      ev: CentralEventMap["peripheralConnectionStatus"]
    ) => {
      console.log(
        `Peripheral ${ev.peripheral.name} connection status changed to ${ev.connectionStatus}`
      );
      // Update list of connection statuses with the one we just got
      setConnectionStatuses((statuses) => {
        if (ev.connectionStatus === "ready" && isPixel(ev.peripheral)) {
          // Subscribe to notify characteristic when Pixel is ready
          Central.subscribeCharacteristic(
            ev.peripheral,
            pixelServiceUuid,
            pixelNotifyCharacteristicUuid,
            (notifyEv) => {
              // Read received data
              const data = Array.from(notifyEv.value);
              // Log received data
              const bytes = data.map((n) => n.toString()).join(", ");
              console.log(
                `Pixel ${notifyEv.peripheral.name} got data: ${bytes}`
              );
              // Check if this a IAmADie identification message
              if (data[0] === 2) {
                // Extract led count from message data
                const ledCount = data[1];
                // And store it
                updatePeripherals({ ...ev.peripheral, ledCount });
              }
            }
          ).catch(setLastError);
        }
        // Store latest connection status for this peripheral
        // Start by removing any previously stored status
        const filtered = statuses.filter(
          (s) => s.peripheral.systemId !== ev.peripheral.systemId
        );
        // And append this new status
        return [...filtered, ev];
      });
    };
    Central.addListener("scanStatus", onScanStatus);
    Central.addListener("scannedPeripheral", onScannedPeripheral);
    Central.addListener("peripheralConnectionStatus", onConnection);
    // Initialize Central
    Central.initialize();
    // Reset scanning state
    setIsScanning(Central.getScanStatus() === "scanning");
    return () => {
      // Remove event listeners
      Central.removeListener("scanStatus", onScanStatus);
      Central.removeListener("scannedPeripheral", onScannedPeripheral);
      Central.removeListener("peripheralConnectionStatus", onConnection);
      // Stop Central
      Central.shutdown();
    };
  }, [updatePeripherals]); // Stable identity

  // Autostart scanning
  React.useEffect(() => {
    if (autoStart) {
      setAutoStart(false);
      scan(onlyPixels);
    }
  }, [autoStart, onlyPixels, scan]);

  return (
    <SafeAreaView style={[styles.containerMain, backgroundStyle]}>
      <Text style={styles.textTitle}>React Native</Text>
      <Text style={styles.textTitle}>Bluetooth LE Example</Text>
      {Platform.OS === "android" && (
        <Text>
          On Android, scanning fails silently if started more than 5 times in
          the last 30 seconds.
        </Text>
      )}
      {lastError && (
        <Text style={styles.textError}>Error! {lastError.message}</Text>
      )}
      <View style={styles.containerHorizontal}>
        <Button
          onPress={() => (isScanning ? Central.stopScan() : scan(onlyPixels))}
        >
          {isScanning ? "Stop Scanning" : "Start Scan"}
        </Button>
        <Button
          style={styles.button}
          onPress={() => {
            setScannedPeripherals((peripherals) =>
              peripherals.filter((p) =>
                isConnectingOrReady(getConnectionStatus(p))
              )
            );
          }}
        >
          Clear List
        </Button>
      </View>
      <View style={styles.containerHorizontal}>
        <Text>Scan Only For Pixels Dice</Text>
        <Switch onValueChange={changeOnlyPixels} value={onlyPixels} />
      </View>
      <ScrollView
        style={styles.fullWidth}
        contentContainerStyle={styles.containerItems}
      >
        {scannedPeripherals.length ? (
          scannedPeripherals.map((p) => {
            const status = getConnectionStatus(p);
            const isDisco = isDisconnected(status);
            return (
              <View key={p.systemId} style={styles.frame}>
                <Text style={styles.textHeader}>
                  {p.name.length ? p.name : "[no name]"}
                </Text>
                <Text>RSSI: {p.advertisementData.rssi}</Text>
                <Text>
                  Services:
                  {p.advertisementData.services
                    ?.map((s) => `\n  • ${s}`)
                    .join("") ?? "No service"}
                </Text>
                <Text>
                  <Text>Status: {status}</Text>
                  {p.ledCount && <Text>, LEDs Count: {p.ledCount}</Text>}
                </Text>
                <View style={styles.containerHorizontal}>
                  <Button
                    onPress={() => {
                      setLastError(undefined);
                      (isDisco
                        ? Central.connectPeripheral(p)
                        : Central.disconnectPeripheral(p)
                      ).catch(setLastError);
                    }}
                  >
                    {isDisco ? "Connect" : "Disconnect"}
                  </Button>
                  {status === "ready" && isPixel(p) && (
                    <>
                      <Button onPress={() => identify(p).catch(setLastError)}>
                        Identify
                      </Button>
                      <Button onPress={() => blink(p).catch(setLastError)}>
                        Blink
                      </Button>
                    </>
                  )}
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

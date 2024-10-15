import { MaterialCommunityIcons } from "@expo/vector-icons";
import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import { useForceUpdate } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { IconButton, Text, TouchableRipple } from "react-native-paper";

import { useAppSelector } from "~/app/hooks";
import { useDebugMode, usePixelsCentral } from "~/hooks";

function ConnectionStatusButton({
  count,
  icon,
}: {
  count: number;
  icon: string; //(typeof MaterialCommunityIcons)["name"];
}) {
  return (
    <TouchableRipple
      onPress={() => {}}
      style={{
        width: 60,
        height: 40,
        alignContent: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#353535",
        borderRadius: 10,
      }}
    >
      <Text variant="bodyLarge" style={{ textAlign: "center" }}>
        {count}
        {/* @ts-expect-error */}
        <MaterialCommunityIcons name={icon} size={16} color="white" />
      </Text>
    </TouchableRipple>
  );
}

function ConnectionStatusBar() {
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const id = setInterval(forceUpdate, 1000);
    return () => clearInterval(id);
  }, [pairedDice, forceUpdate]);
  const central = usePixelsCentral();
  const pixels = pairedDice.map(({ pixelId }) => central.getPixel(pixelId));
  const connectingCount = pixels.filter(
    (p) => p?.status === "connecting" || p?.status === "identifying"
  ).length;
  const connectedCount = pixels.filter((p) => p?.status === "ready").length;
  const disconnectedCount =
    pairedDice.length - connectingCount - connectedCount;
  return (
    <View
      style={{
        flexDirection: "row",
        paddingLeft: 10,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#171717",
        borderWidth: 1,
        borderColor: "#454955",
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
      }}
    >
      <ConnectionStatusButton
        count={connectingCount}
        icon="bluetooth-settings"
      />
      <ConnectionStatusButton count={connectedCount} icon="bluetooth-connect" />
      <View
        style={{
          height: "100%",
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 10,
          borderColor: "#454955",
          borderLeftWidth: 1,
          borderRightWidth: 1,
          // gap: 10,
        }}
      >
        <ConnectionStatusButton
          count={disconnectedCount}
          icon="bluetooth-off"
        />
        <IconButton
          icon="information-outline"
          iconColor="white"
          onPress={() => {}}
        />
      </View>
      <IconButton icon="refresh" iconColor="white" onPress={() => {}} />
    </View>
  );
}

function ConnectQueueStatusBar() {
  const central = usePixelsCentral();
  const [queue, setQueue] = React.useState(central.connectQueue);
  React.useEffect(() => {
    return central.addListener("connectQueue", setQueue);
  }, [central]);
  const [scanning, setScanning] = React.useState(
    central.scanStatus === "scanning"
  );
  React.useEffect(() => {
    const onScanStatus = () => setScanning(central.scanStatus === "scanning");
    onScanStatus();
    return central.addListener("scanStatus", onScanStatus);
  }, [central]);
  return (
    <View
      style={{
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#171717",
        borderWidth: 1,
        borderColor: "#454955",
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
      }}
    >
      {queue && (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text>High count: {queue.highPriority.length}</Text>
            <Text>Low count: {queue.lowPriority.length}</Text>
            <Text>{scanning ? "Scan On" : "Scan Off"}</Text>
          </View>
          <Text numberOfLines={0}>
            High ids: {queue.highPriority.map(unsigned32ToHex).join(", ")}
          </Text>
        </>
      )}
    </View>
  );
}

export function DebugConnectionStatusesBar() {
  const debugMode = useDebugMode();
  return (
    debugMode && (
      <>
        <ConnectionStatusBar />
        <ConnectQueueStatusBar />
      </>
    )
  );
}

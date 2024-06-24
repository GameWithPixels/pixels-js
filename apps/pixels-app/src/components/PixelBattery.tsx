import {
  PixelInfoNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { BatteryIcon } from "./icons";

export function PixelBattery({
  pixel,
  size,
  disabled,
}: {
  pixel?: PixelInfoNotifier;
  size: number;
  disabled?: boolean;
}) {
  const level = usePixelInfoProp(pixel, "batteryLevel");
  const charging = usePixelInfoProp(pixel, "isCharging");
  return (
    <View>
      <BatteryIcon value={level} size={size} disabled={!pixel || disabled} />
      {charging && (
        <Text style={{ position: "absolute", left: -20, top: -2 }}>⚡</Text>
      )}
    </View>
  );
}

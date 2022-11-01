import {
  ScannedPixel,
  Pixel,
  PixelDesignAndColorValues,
} from "@systemic-games/react-native-pixels-connect";
import { ReactNode } from "react";
import {
  Text,
  StyleSheet,
  // eslint-disable-next-line import/namespace
} from "react-native";

import getPixelEnumName from "~/getPixelEnumName";
import globalStyles from "~/styles";

export interface PixelInfoBoxProps {
  pixel: Pixel | ScannedPixel;
  children?: ReactNode;
}

export default function ({ pixel, children }: PixelInfoBoxProps) {
  const pixIdHex = pixel.pixelId.toString(16).toLocaleUpperCase();
  const scanned = pixel instanceof Pixel ? undefined : pixel;
  const design = getPixelEnumName(
    scanned?.designAndColor ?? PixelDesignAndColorValues.Unknown,
    PixelDesignAndColorValues
  );
  const batteryLevel = Math.round((scanned?.batteryLevel ?? 0) / 2.55);
  const rssi = scanned?.rssi ?? 0;
  const currentFace = scanned?.currentFace ?? -1;
  const ledCount = scanned?.ledCount ?? -1;
  return (
    <>
      <Text>
        <Text style={styles.textBold}>{`Name: ${pixel.name}`}</Text>
        <Text style={styles.text}>{` (id: ${pixIdHex})`}</Text>
      </Text>
      <Text
        style={styles.text}
      >{`RSSI: ${rssi}, battery: ${batteryLevel}%`}</Text>
      <Text
        style={styles.text}
      >{`Roll: ${currentFace} / ${ledCount} LEDs / ${design}`}</Text>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
});

import { Pixel, getPixel } from "@systemic-games/react-native-pixels-connect";
import {
  Button,
  Text,
  View,
  FlatList,
  StyleSheet,
  // eslint-disable-next-line import/namespace
} from "react-native";

import PixelInfoBox from "./PixelInfoBox";
import Spacer from "./Spacer";

import globalStyles, { sr } from "~/styles";
import usePixelScannerWithFocus from "~/usePixelScannerWithFocus";

interface SelectPixelProps {
  setSelectedPixel: (pixel: Pixel) => void;
}

export default function ({ setSelectedPixel }: SelectPixelProps) {
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus({
    sortedByName: true,
  });
  return (
    <>
      <Text style={styles.text}>Select Pixel</Text>
      <Spacer />
      <Button
        onPress={() => scannerDispatch("clear")}
        title="Clear Scan List"
      />
      <Spacer />
      {scannedPixels.length ? (
        <View style={styles.containerScanList}>
          <FlatList
            ItemSeparatorComponent={Spacer}
            data={scannedPixels}
            renderItem={(itemInfo) => (
              <View style={styles.box}>
                <PixelInfoBox pixel={itemInfo.item}>
                  <Button
                    onPress={() => setSelectedPixel(getPixel(itemInfo.item))}
                    title="Select"
                  />
                </PixelInfoBox>
              </View>
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
      ) : (
        <Text style={styles.text}>No Pixel found so far...</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  containerScanList: {
    alignItems: "center",
    justifyContent: "flex-start",
    margin: sr(10),
    flex: 1,
    flexGrow: 1,
  },
});

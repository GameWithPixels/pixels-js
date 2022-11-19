import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  // eslint-disable-next-line import/namespace
} from "react-native";

import PixelInfoBox from "~/components/PixelInfoBox";
import Spacer from "~/components/Spacer";
import globalStyles, { sr } from "~/styles";
import usePixelScannerWithFocus from "~/usePixelScannerWithFocus";

export default function ({
  onSelected,
  onClose,
}: {
  onSelected: (pixel: ScannedPixel) => void;
  onClose: () => void;
}) {
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus({
    sortedByName: true,
  });
  useEffect(() => {
    scannerDispatch("start");
  }, [scannerDispatch]);
  return (
    <>
      <View style={styles.containerScanHeader}>
        <Text
          style={styles.textBold}
        >{`Scanned Pixels (${scannedPixels.length}):`}</Text>
        <Spacer />
        <Button onPress={onClose} title="Close" />
        <Spacer />
        <Button
          onPress={() => scannerDispatch("clear")}
          title="Clear Scan List"
        />
      </View>
      <View style={styles.containerScanList}>
        {scannedPixels.length ? (
          <FlatList
            ItemSeparatorComponent={Spacer}
            data={scannedPixels}
            renderItem={(itemInfo) => (
              <View style={styles.box}>
                <PixelInfoBox pixel={itemInfo.item}>
                  <Button
                    onPress={() => onSelected(itemInfo.item)}
                    title="Select"
                  />
                </PixelInfoBox>
              </View>
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        ) : (
          <Text style={styles.text}>No Pixel found so far...</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  containerScanHeader: {
    margin: sr(20),
  },
  containerScanList: {
    alignItems: "center",
    justifyContent: "flex-start",
    margin: sr(10),
    flex: 1,
    flexGrow: 1,
  },
});

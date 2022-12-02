import { Pixel, getPixel } from "@systemic-games/react-native-pixels-connect";
import {
  Button,
  Text,
  View,
  FlatList,
  StyleSheet,
  // eslint-disable-next-line import/namespace
} from "react-native";

import PixelInfoBox from "./PixelInfoCard";

import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusPixelScanner from "~/features/pixels/hooks/useFocusPixelScanner";
import globalStyles, { sr } from "~/styles";

interface SelectPixelProps {
  setSelectedPixel: (pixel: Pixel) => void;
}

export default function ({ setSelectedPixel }: SelectPixelProps) {
  const { t } = useTranslation();
  const [scannedPixels, scannerDispatch, lastError] = useFocusPixelScanner({
    sortedByName: true,
  });
  useErrorWithHandler(lastError);
  return (
    <>
      <Text style={styles.text}>Select Pixel</Text>
      <Button
        onPress={() => scannerDispatch("clear")}
        title="Clear Scan List"
      />
      {scannedPixels.length ? (
        <View style={styles.containerScanList}>
          <FlatList
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
        <Text style={styles.text}>{t("noPixelsFound")}</Text>
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

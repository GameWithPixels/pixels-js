import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { Button, Center, FlatList, Spacer, Text } from "native-base";
import { useEffect } from "react";

import PixelInfoBox from "~/components/PixelInfoBox";
import usePixelScannerWithFocus from "~/features/pixels/hooks/usePixelScannerWithFocus";

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
    <Center>
      <Center>
        <Text bold>{`Scanned Pixels (${scannedPixels.length}):`}</Text>
        <Button onPress={onClose}>Close</Button>
        <Button onPress={() => scannerDispatch("clear")}>
          Clear Scan List
        </Button>
      </Center>
      <Center>
        {scannedPixels.length ? (
          <FlatList
            ItemSeparatorComponent={Spacer}
            data={scannedPixels}
            renderItem={(itemInfo) => (
              <Center>
                <PixelInfoBox pixel={itemInfo.item}>
                  <Button onPress={() => onSelected(itemInfo.item)}>
                    Select
                  </Button>
                </PixelInfoBox>
              </Center>
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        ) : (
          <Text>No Pixel found so far...</Text>
        )}
      </Center>
    </Center>
  );
}

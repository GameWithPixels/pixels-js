import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { Button, Center, FlatList, Spacer, Text } from "native-base";

import PixelInfoBox from "~/components/PixelInfoCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusPixelScanner from "~/features/pixels/hooks/useFocusPixelScanner";

export default function ({
  onSelected,
  onClose,
  refreshInterval,
}: {
  onSelected: (pixel: ScannedPixel) => void;
  onClose: () => void;
  refreshInterval?: number;
}) {
  const [scannedPixels, scannerDispatch, lastError] = useFocusPixelScanner({
    sortedByName: true,
    refreshInterval,
  });
  useErrorWithHandler(lastError);
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

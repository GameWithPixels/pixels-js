import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { Button, Box, FlatList, Pressable, Text, VStack } from "native-base";

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
    <VStack flex={1} alignItems="center">
      <Text bold>{`Scanned Pixels (${scannedPixels.length}):`}</Text>
      <Button onPress={onClose}>Close</Button>
      <Button onPress={() => scannerDispatch("clear")}>Clear Scan List</Button>
      {scannedPixels.length ? (
        <>
          <Text italic>Tap On Device To Select:</Text>
          <FlatList
            width="100%"
            data={scannedPixels}
            renderItem={(itemInfo) => (
              <Pressable
                onPress={() => onSelected(itemInfo.item)}
                borderColor="gray.500"
                borderWidth={2}
              >
                <PixelInfoBox pixel={itemInfo.item} />
              </Pressable>
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            ItemSeparatorComponent={() => <Box height="3%" />}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </>
      ) : (
        <Text>No Pixel found so far...</Text>
      )}
    </VStack>
  );
}

import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import {
  Button,
  Box,
  FlatList,
  HStack,
  Pressable,
  Text,
  VStack,
} from "native-base";
import { useTranslation } from "react-i18next";

import PixelInfoCard from "~/components/PixelInfoCard";
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
  const { t } = useTranslation();
  const [scannedPixels, scannerDispatch, lastError] = useFocusPixelScanner({
    sortedByName: true,
    refreshInterval,
  });
  useErrorWithHandler(lastError);
  return (
    <VStack flex={1} space="1%" alignItems="center">
      <HStack space="2%">
        <Button onPress={onClose}>{t("close")}</Button>
        <Button onPress={() => scannerDispatch("clear")}>
          {t("clearScanList")}
        </Button>
      </HStack>
      <Text bold>
        {scannedPixels.length
          ? t("scannedPixelsWithCount", { count: scannedPixels.length })
          : t("noPixelsFound")}
      </Text>
      {scannedPixels.length > 0 && (
        <>
          <Text italic>{t("tapOnItemToSelect")}</Text>
          <FlatList
            width="100%"
            data={scannedPixels}
            renderItem={(itemInfo) => (
              <Pressable
                onPress={() => onSelected(itemInfo.item)}
                borderColor="gray.500"
                borderWidth={2}
              >
                <PixelInfoCard pixel={itemInfo.item} />
              </Pressable>
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            ItemSeparatorComponent={() => <Box height={5} />}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </>
      )}
    </VStack>
  );
}

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
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import PixelInfoCard from "~/components/PixelInfoCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusPixelScanner from "~/features/pixels/hooks/useFocusPixelScanner";

function keyExtractor(p: ScannedPixel) {
  return p.systemId;
}

function Separator() {
  return <Box height={3} />;
}

export default function ({
  onSelect: onSelected,
  onClose,
  refreshInterval,
}: {
  onSelect: (pixel: ScannedPixel) => void;
  onClose?: () => void;
  refreshInterval?: number;
}) {
  const [scannedPixels, scannerDispatch, lastError] = useFocusPixelScanner({
    sortedByName: true,
    refreshInterval,
  });
  useErrorWithHandler(lastError);

  // FlatList item rendering
  const renderItem = useCallback(
    ({ item }: { item: ScannedPixel }) => (
      <Pressable
        onPress={() => onSelected(item)}
        borderColor="gray.500"
        borderWidth={2}
      >
        <PixelInfoCard pixel={item} />
      </Pressable>
    ),
    [onSelected]
  );

  const { t } = useTranslation();
  return (
    <VStack flex={1} space="1%" alignItems="center">
      <HStack space="2%">
        {onClose && <Button onPress={onClose}>{t("close")}</Button>}
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
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={Separator}
          />
        </>
      )}
    </VStack>
  );
}

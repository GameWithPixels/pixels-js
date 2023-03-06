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
// eslint-disable-next-line import/namespace
import { ListRenderItemInfo } from "react-native";

import PixelInfoCard from "~/components/PixelInfoCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusPixelScanner from "~/features/pixels/hooks/useFocusPixelScanner";

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

  // FlatList components
  const Separator = useCallback(() => <Box height={5} />, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ScannedPixel>) => (
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
            keyExtractor={(p) => p.pixelId.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </>
      )}
    </VStack>
  );
}

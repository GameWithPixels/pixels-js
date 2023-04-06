import {
  FastBox,
  FastButton,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { Pressable, Text } from "native-base";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";

import PixelInfoCard from "~/components/PixelInfoCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusPixelScanner from "~/features/pixels/hooks/useFocusPixelScanner";

function keyExtractor(p: ScannedPixel) {
  return p.systemId;
}

function Separator() {
  return <FastBox height={3} />;
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
    <FastVStack flex={1} alignItems="center">
      <FastHStack>
        {onClose && (
          <FastButton mr={3} onPress={onClose}>
            {t("close")}
          </FastButton>
        )}
        <FastButton onPress={() => scannerDispatch("clear")}>
          {t("clearScanList")}
        </FastButton>
      </FastHStack>
      <Text mt={1} bold>
        {scannedPixels.length
          ? t("scannedPixelsWithCount", { count: scannedPixels.length })
          : t("noPixelsFound")}
      </Text>
      {scannedPixels.length > 0 && (
        <>
          <Text m={1} italic>
            {t("tapOnItemToSelect")}
          </Text>
          <FlatList
            //width="100%"
            data={scannedPixels}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={Separator}
          />
        </>
      )}
    </FastVStack>
  );
}

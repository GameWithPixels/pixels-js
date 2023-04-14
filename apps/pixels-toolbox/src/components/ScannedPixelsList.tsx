import {
  FastBox,
  FastButton,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import { Pressable, Text } from "native-base";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";

import PixelInfoCard from "~/components/PixelInfoCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusScannedPixelNotifiers from "~/features/pixels/hooks/useFocusScannedPixelNotifiers";

function keyExtractor(p: ScannedPixelNotifier) {
  return p.systemId;
}

function Separator() {
  return <FastBox height={3} />;
}

export default function ({
  onSelect: onSelected,
  onClose,
  minUpdateInterval,
}: {
  onSelect: (scannedPixel: ScannedPixelNotifier) => void;
  onClose?: () => void;
  minUpdateInterval?: number;
}) {
  const [scannedPixels, scannerDispatch, lastError] =
    useFocusScannedPixelNotifiers({
      sortedByName: true,
      minUpdateInterval,
    });
  useErrorWithHandler(lastError);

  // FlatList item rendering
  const renderItem = useCallback(
    ({ item: scannedPixel }: { item: ScannedPixelNotifier }) => (
      <Pressable
        onPress={() => onSelected(scannedPixel)}
        borderColor="gray.500"
        borderWidth={2}
      >
        <PixelInfoCard pixelInfo={scannedPixel} />
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

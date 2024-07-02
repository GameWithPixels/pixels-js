import {
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable } from "react-native";
import { Button, Text } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { PixelInfoCard } from "~/components/PixelInfoCard";
import { useErrorWithHandler } from "~/features/hooks/useErrorWithHandler";
import { useFocusScannedPixelNotifiers } from "~/features/hooks/useFocusScannedPixelNotifiers";

export function ScannedPixelsList({
  onSelect: onSelected,
  onClose,
  minUpdateInterval,
}: {
  onSelect: (scannedPixel: ScannedPixelNotifier) => void;
  onClose?: () => void;
  minUpdateInterval?: number;
}) {
  const [scannedPixels, scannerDispatch, lastError] =
    useFocusScannedPixelNotifiers({ minUpdateInterval });
  useErrorWithHandler(lastError);

  React.useEffect(() => {
    const pixel = scannedPixels.find((p) => p.pixelId === 0x6510ae2e);
    if (pixel) {
      onSelected(pixel);
    }
  }, [onSelected, scannedPixels]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: scannedPixel }: { item: ScannedPixelNotifier }) => (
      <Pressable
        key={scannedPixel.pixelId}
        onPress={() => onSelected(scannedPixel)}
      >
        <PixelInfoCard pixelInfo={scannedPixel} />
      </Pressable>
    ),
    [onSelected]
  );

  const { t } = useTranslation();
  return (
    <BaseVStack gap={10} alignItems="center">
      <BaseHStack>
        {onClose && (
          <Button mode="outlined" style={{ marginRight: 5 }} onPress={onClose}>
            {t("close")}
          </Button>
        )}
        <Button mode="outlined" onPress={() => scannerDispatch("clear")}>
          {t("clearScanList")}
        </Button>
      </BaseHStack>
      <Text style={AppStyles.bold}>
        {scannedPixels.length
          ? t("scannedPixelsWithCount", { count: scannedPixels.length })
          : t("noPixelsFound")}
      </Text>
      {scannedPixels.length > 0 && (
        <>
          <Text style={AppStyles.italic}>{t("tapOnItemToSelect")}</Text>
          <FlatList
            style={AppStyles.fullWidth}
            contentContainerStyle={AppStyles.listContentContainer}
            data={scannedPixels}
            renderItem={renderItem}
          />
        </>
      )}
    </BaseVStack>
  );
}

import {
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable } from "react-native";
import { Button, Text } from "react-native-paper";

import PixelInfoCard from "~/components/PixelInfoCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusScannedPixelNotifiers from "~/features/pixels/hooks/useFocusScannedPixelNotifiers";
import gs from "~/styles";

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
    useFocusScannedPixelNotifiers({
      sortedByName: true,
      minUpdateInterval,
    });
  useErrorWithHandler(lastError);

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
    <FastVStack gap={10} alignItems="center">
      <FastHStack>
        {onClose && (
          <Button
            mode="outlined"
            style={{
              marginRight: 5,
            }}
            onPress={onClose}
          >
            {t("close")}
          </Button>
        )}
        <Button mode="outlined" onPress={() => scannerDispatch("clear")}>
          {t("clearScanList")}
        </Button>
      </FastHStack>
      <Text style={gs.bold}>
        {scannedPixels.length
          ? t("scannedPixelsWithCount", { count: scannedPixels.length })
          : t("noPixelsFound")}
      </Text>
      {scannedPixels.length > 0 && (
        <>
          <Text style={gs.italic}>{t("tapOnItemToSelect")}</Text>
          <FlatList
            style={gs.fullWidth}
            data={scannedPixels}
            renderItem={renderItem}
            contentContainerStyle={gs.listContentContainer}
          />
        </>
      )}
    </FastVStack>
  );
}

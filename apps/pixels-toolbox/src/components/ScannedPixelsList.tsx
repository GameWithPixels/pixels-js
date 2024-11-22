import {
  PixelDieType,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable } from "react-native";
import { Button, Text } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";
import { PixelInfoCard } from "~/components/PixelInfoCard";
import { useErrorWithHandler } from "~/hooks/useErrorWithHandler";
import { useFocusScannedPixelNotifiers } from "~/hooks/useFocusScannedPixelNotifiers";

export function ScannedPixelsList({
  onSelect,
  onClose,
  dieType,
  ledCount,
  minUpdateInterval,
}: {
  onSelect: (scannedPixel: ScannedPixelNotifier) => void;
  onClose?: () => void;
  dieType?: PixelDieType;
  ledCount?: number; // Ignored if dieType is set
  minUpdateInterval?: number;
}) {
  const [scannedDevices, scannerDispatch, scanStatus] =
    useFocusScannedPixelNotifiers({ minUpdateInterval });
  const scannedPixels = React.useMemo(
    () => scannedDevices.filter((i) => i.type === "die"),
    [scannedDevices]
  );
  useErrorWithHandler(
    !(typeof scanStatus === "string") ? scanStatus : undefined
  );

  // Filter scanned pixels based on dieType and ledCount
  const matchingPixels = scannedPixels.filter((pixel) =>
    dieType
      ? pixel.dieType === dieType
      : !ledCount || pixel.ledCount === ledCount
  );

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: scannedPixel }: { item: ScannedPixelNotifier }) => (
      <Pressable
        key={scannedPixel.pixelId}
        onPress={() => onSelect(scannedPixel)}
      >
        <PixelInfoCard pixelInfo={scannedPixel} />
      </Pressable>
    ),
    [onSelect]
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
        {matchingPixels.length
          ? t("scannedPixelsWithCount", { count: matchingPixels.length })
          : t("noPixelsFound")}
        {(dieType ?? ledCount) && (
          <Text>
            {" ("}
            {dieType ? t(dieType) : ledCount ? `${ledCount} ${t("leds")}` : ""})
          </Text>
        )}
      </Text>
      {matchingPixels.length > 0 && (
        <>
          <Text style={AppStyles.italic}>{t("tapOnItemToSelect")}</Text>
          <FlatList
            style={AppStyles.fullWidth}
            contentContainerStyle={AppStyles.listContentContainer}
            data={matchingPixels}
            renderItem={renderItem}
          />
        </>
      )}
    </BaseVStack>
  );
}

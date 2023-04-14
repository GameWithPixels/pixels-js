import {
  FastBox,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";

import PixelInfoCard from "~/components/PixelInfoCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import useFocusScannedPixelNotifiers from "~/features/pixels/hooks/useFocusScannedPixelNotifiers";
import gs from "~/styles";

function keyExtractor(p: ScannedPixelNotifier) {
  return p.systemId;
}

function Separator() {
  return <FastBox height={3} />;
}

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
        style={styles.container}
        onPress={() => onSelected(scannedPixel)}
      >
        <PixelInfoCard pixelInfo={scannedPixel} />
      </Pressable>
    ),
    [onSelected]
  );

  const { t } = useTranslation();
  return (
    <FastVStack flex={1} alignItems="center">
      <FastHStack my={5}>
        {onClose && (
          <Button mode="outlined" style={styles.mr5} onPress={onClose}>
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

const styles = StyleSheet.create({
  container: {
    borderColor: "gray",
    borderWidth: 2,
  },
  mr5: {
    marginRight: 5,
  },
});

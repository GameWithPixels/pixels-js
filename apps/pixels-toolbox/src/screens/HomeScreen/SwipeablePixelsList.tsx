import { useActionSheet } from "@expo/react-native-action-sheet";
import { FastBox } from "@systemic-games/react-native-base-components";
import {
  ScannedPixel,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { Text } from "react-native-paper";

import { EmojiButton } from "~/components/EmojiButton";
import { PixelSwipeableCard } from "~/components/PixelSwipeableCard";
import PixelDispatcher, {
  PixelDispatcherAction,
} from "~/features/pixels/PixelDispatcher";
import useFocusScannedPixelNotifiers from "~/features/pixels/hooks/useFocusScannedPixelNotifiers";
import gs from "~/styles";

function keyExtractor(p: ScannedPixel) {
  return p.systemId;
}

function Separator() {
  return <FastBox h={2} />;
}

interface SwipeablePixelsListProps {
  onDieDetails: (pixelId: number) => void;
}

export default React.memo(function ({
  onDieDetails,
}: SwipeablePixelsListProps) {
  // Scanning
  const [scannedPixels, scannerDispatch, lastError] =
    useFocusScannedPixelNotifiers();

  // Values for UI
  const { t } = useTranslation();
  const [showMoreInfo, setShowMoreInfo] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Actions dispatched to all Pixels
  const dispatchAll = React.useCallback(
    (action: PixelDispatcherAction) =>
      scannedPixels.forEach((sp) =>
        PixelDispatcher.getInstance(sp).dispatch(action)
      ),
    [scannedPixels]
  );
  const { showActionSheetWithOptions } = useActionSheet();
  const onShowActionSheet = React.useCallback(() => {
    const options = [
      t("connect"),
      t("disconnect"),
      t("blink"),
      t("updateProfile"),
      t("updateBootloaderAndFirmware"),
      t("cancel"),
    ];

    // <Text variant="headlineMedium">{}</Text>
    showActionSheetWithOptions(
      {
        title: t("applyToAllRelevantPixels"),
        options,
        cancelButtonIndex: options.length - 1,
      },
      (index?: number) => {
        switch (index) {
          case 0:
            dispatchAll("connect");
            break;
          case 1:
            dispatchAll("disconnect");
            break;
          case 2:
            dispatchAll("blink");
            break;
          case 3:
            dispatchAll("updateProfile");
            break;
          case 4:
            dispatchAll("queueFirmwareUpdate");
            break;
        }
      }
    );
  }, [dispatchAll, showActionSheetWithOptions, t]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: scannedPixel }: { item: ScannedPixelNotifier }) => (
      <PixelSwipeableCard
        scannedPixel={scannedPixel}
        moreInfo={showMoreInfo}
        onShowDetails={() => onDieDetails(scannedPixel.pixelId)}
      />
    ),
    [onDieDetails, showMoreInfo]
  );
  const refreshControl = React.useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          scannerDispatch("clear");
          setTimeout(() => {
            // Wait of 1 second before stopping the refresh animation
            setRefreshing(false);
          }, 1000);
        }}
      />
    ),
    [refreshing, scannerDispatch]
  );

  return (
    <>
      <FastBox
        my={8}
        width="100%"
        flexDir="row"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <EmojiButton onPress={() => setShowMoreInfo((b) => !b)}>ℹ️</EmojiButton>
        <Text variant="headlineMedium">
          {t("pixelsWithCount", { count: scannedPixels.length })}
        </Text>
        <EmojiButton onPress={onShowActionSheet}>⚙️</EmojiButton>
      </FastBox>
      {lastError ? (
        <Text>{`${lastError}`}</Text>
      ) : scannedPixels.length ? (
        <FlatList
          style={gs.fullWidth}
          data={scannedPixels}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          refreshControl={refreshControl}
        />
      ) : (
        <Text style={gs.italic}>{t("noPixelsFound")}</Text>
      )}
    </>
  );
});

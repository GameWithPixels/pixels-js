import { useActionSheet } from "@expo/react-native-action-sheet";
import { FastBox } from "@systemic-games/react-native-base-components";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { Text } from "react-native-paper";

import { EmojiButton } from "~/components/EmojiButton";
import { PixelInfoCardModeContext } from "~/components/PixelInfoCard";
import { PixelSwipeableCard } from "~/components/PixelSwipeableCard";
import useFocusScannedPixelNotifiers from "~/features/hooks/useFocusScannedPixelNotifiers";
import PixelDispatcher, {
  PixelDispatcherActionName,
} from "~/features/pixels/PixelDispatcher";
import gs from "~/styles";

function ListItem({
  scannedPixel,
  onDieDetails,
}: {
  scannedPixel: ScannedPixelNotifier;
  onDieDetails: (pixelId: number) => void;
}) {
  const onDetails = React.useCallback(
    () => onDieDetails(scannedPixel.pixelId),
    [onDieDetails, scannedPixel.pixelId]
  );
  return (
    <PixelSwipeableCard scannedPixel={scannedPixel} onShowDetails={onDetails} />
  );
}

interface SwipeablePixelsListProps {
  onDieDetails: (pixelId: number) => void;
  minUpdateInterval?: number;
}

export default React.memo(function ({
  onDieDetails,
  minUpdateInterval = 200,
}: SwipeablePixelsListProps) {
  // Scanning
  const [scannedPixels, scannerDispatch, lastError] =
    useFocusScannedPixelNotifiers({
      sortedByName: true,
      minUpdateInterval,
    });

  // Values for UI
  const { t } = useTranslation();
  const [expandedInfo, setExpandedInfo] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Actions dispatched to all Pixels
  const dispatchAll = React.useCallback(
    (action: PixelDispatcherActionName) =>
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
            dispatchAll("uploadProfile");
            break;
          case 4:
            dispatchAll("queueDFU");
            break;
        }
      }
    );
  }, [dispatchAll, showActionSheetWithOptions, t]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: scannedPixel }: { item: ScannedPixelNotifier }) => (
      <ListItem
        key={scannedPixel.pixelId}
        scannedPixel={scannedPixel}
        onDieDetails={onDieDetails}
      />
    ),
    [onDieDetails]
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
        width="100%"
        flexDir="row"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <EmojiButton onPress={() => setExpandedInfo((b) => !b)}>ℹ️</EmojiButton>
        <Text variant="headlineMedium">
          {t("pixelsWithCount", { count: scannedPixels.length })}
        </Text>
        <EmojiButton onPress={onShowActionSheet}>⚙️</EmojiButton>
      </FastBox>
      {lastError ? (
        <Text>{`${lastError}`}</Text>
      ) : scannedPixels.length ? (
        <PixelInfoCardModeContext.Provider
          value={expandedInfo ? "expanded" : "normal"}
        >
          <FlatList
            style={gs.fullWidth}
            data={scannedPixels}
            renderItem={renderItem}
            contentContainerStyle={gs.listContentContainer}
            refreshControl={refreshControl}
          />
        </PixelInfoCardModeContext.Provider>
      ) : (
        <Text style={gs.italic}>{t("noPixelsFound")}</Text>
      )}
    </>
  );
});

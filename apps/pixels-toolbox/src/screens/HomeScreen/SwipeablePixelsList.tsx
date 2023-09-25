import { useActionSheet } from "@expo/react-native-action-sheet";
import { BaseBox } from "@systemic-games/react-native-base-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { Text } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { EmojiButton } from "~/components/EmojiButton";
import { PixelInfoCardModeContext } from "~/components/PixelInfoCard";
import { PixelSwipeableCard } from "~/components/PixelSwipeableCard";
import { useFocusScannedPixelNotifiers } from "~/features/hooks/useFocusScannedPixelNotifiers";
import PixelDispatcher, {
  PixelDispatcherActionMap,
  PixelDispatcherActionName,
} from "~/features/pixels/PixelDispatcher";
import { PrebuildAnimations } from "~/features/pixels/PrebuildAnimations";

function ListItem({
  pixelDispatcher,
  onDieDetails,
}: {
  pixelDispatcher: PixelDispatcher;
  onDieDetails: (pixelId: number) => void;
}) {
  const onDetails = React.useCallback(
    () => onDieDetails(pixelDispatcher.pixelId),
    [onDieDetails, pixelDispatcher.pixelId]
  );
  return (
    <PixelSwipeableCard
      pixelDispatcher={pixelDispatcher}
      onShowDetails={onDetails}
    />
  );
}

interface SwipeablePixelsListProps {
  onDieDetails: (pixelId: number) => void;
  minUpdateInterval?: number;
}

export const SwipeablePixelsList = React.memo(function ({
  onDieDetails,
  minUpdateInterval,
}: SwipeablePixelsListProps) {
  // Scanning
  const [scannedPixels, scannerDispatch, lastError] =
    useFocusScannedPixelNotifiers({ minUpdateInterval });

  // Build our PixelDispatcher instances
  const lastPixelsList = React.useRef<PixelDispatcher[]>([]);
  const pixels = React.useMemo(() => {
    const scanned = scannedPixels.map((scannedPixel) =>
      PixelDispatcher.getDispatcher(scannedPixel)
    );
    const pixels = lastPixelsList.current.filter(
      (p) => p.isInUse || scanned.includes(p)
    );
    pixels.push(...scanned.filter((p) => !pixels.includes(p)));
    lastPixelsList.current = pixels;
    return pixels;
  }, [scannedPixels]);

  // Values for UI
  const { t } = useTranslation();
  const [expandedInfo, setExpandedInfo] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Actions dispatched to all Pixels
  const dispatchAll = React.useCallback(
    <T extends PixelDispatcherActionName>(
      action: T,
      params?: PixelDispatcherActionMap[T]
    ) => pixels.forEach((p) => p.dispatch(action, params)),
    [pixels]
  );
  const { showActionSheetWithOptions } = useActionSheet();
  const showActionSheet = React.useCallback(() => {
    const options = [
      t("connect"),
      t("disconnect"),
      t("blink"),
      t("rainbow"),
      t("rainbowAllFaces"),
      t("playProfileAnimation"),
      t("updateProfile"),
      t("updateBootloaderAndFirmware"),
      t("cancel"),
    ];

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
            dispatchAll("playAnimation", PrebuildAnimations.rainbow);
            break;
          case 4:
            dispatchAll("playAnimation", PrebuildAnimations.rainbowAllFaces);
            break;
          case 5:
            dispatchAll("playProfileAnimation", 0);
            break;
          case 6:
            dispatchAll("uploadProfile");
            break;
          case 7:
            dispatchAll("queueDFU");
            break;
        }
      }
    );
  }, [dispatchAll, showActionSheetWithOptions, t]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: pixelDispatcher }: { item: PixelDispatcher }) => (
      <ListItem
        key={pixelDispatcher.pixelId}
        pixelDispatcher={pixelDispatcher}
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
      <BaseBox
        width="100%"
        flexDir="row"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <EmojiButton onPress={() => setExpandedInfo((b) => !b)}>ℹ️</EmojiButton>
        <Text variant="headlineMedium">
          {t("pixelsWithCount", { count: pixels.length })}
        </Text>
        <EmojiButton onPress={showActionSheet}>⚙️</EmojiButton>
      </BaseBox>
      {lastError ? (
        <Text>{`${lastError}`}</Text>
      ) : pixels.length ? (
        <PixelInfoCardModeContext.Provider
          value={expandedInfo ? "expanded" : "normal"}
        >
          <FlatList
            style={AppStyles.fullWidth}
            contentContainerStyle={AppStyles.listContentContainer}
            data={pixels}
            renderItem={renderItem}
            refreshControl={refreshControl}
          />
        </PixelInfoCardModeContext.Provider>
      ) : (
        <Text style={AppStyles.italic}>{t("noPixelsFound")}</Text>
      )}
    </>
  );
});

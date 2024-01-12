import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  BaseBoxProps,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { Text } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { EmojiButton } from "~/components/EmojiButton";
import { PixelInfoCardModeContext } from "~/components/PixelInfoCard";
import {
  PixelSwipeableCard,
  SwipeablePixelCardProps,
} from "~/components/PixelSwipeableCard";
import { useFocusScannedPixelNotifiers } from "~/features/hooks/useFocusScannedPixelNotifiers";
import PixelDispatcher, {
  PixelDispatcherActionMap,
} from "~/features/pixels/PixelDispatcher";
import PixelsDispatcher from "~/features/pixels/PixelsDispatcher";
import { PrebuildAnimations } from "~/features/pixels/PrebuildAnimations";

interface SwipeablePixelsListProps
  extends Pick<SwipeablePixelCardProps, "onShowDetails" | "onPrintLabel"> {
  minUpdateInterval?: number;
}

export const SwipeablePixelsList = React.memo(function ({
  onShowDetails,
  onPrintLabel,
  minUpdateInterval,
  ...props
}: SwipeablePixelsListProps & BaseBoxProps) {
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
    <T extends keyof PixelDispatcherActionMap>(
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
      t("turnOff"),
      t("videoAnim1"),
      t("videoAnim2"),
      t("videoAnim3"),
      t("rainbowAllFaces"),
      t("fire"),
      t("noise"),
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
            dispatchAll("turnOff");
            break;
          case 3:
            {
              const pd = new PixelsDispatcher();
              pd.playSetAnimations(pixels);
            }
            break;
          case 4:
            {
              const pd = new PixelsDispatcher();
              pd.playSetAnimations2(pixels);
            }
            break;
          case 5:
            {
              const pd = new PixelsDispatcher();
              pd.playSetAnimations3(pixels);
            }
            break;
          case 6:
            dispatchAll("playAnimation", PrebuildAnimations.rainbow);
            break;
          case 7:
            dispatchAll("playAnimation", PrebuildAnimations.cycle_fire);
            break;
          case 8:
            dispatchAll("playAnimation", PrebuildAnimations.noise);
            break;
          case 9:
            dispatchAll("playProfileAnimation", 0);
            break;
          case 10:
            dispatchAll("uploadProfile");
            break;
          case 11:
            dispatchAll("queueDFU");
            break;
        }
      }
    );
  }, [dispatchAll, pixels, showActionSheetWithOptions, t]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: pixelDispatcher }: { item: PixelDispatcher }) => (
      <PixelSwipeableCard
        key={pixelDispatcher.pixelId}
        pixelDispatcher={pixelDispatcher}
        onShowDetails={onShowDetails}
        onPrintLabel={onPrintLabel}
      />
    ),
    [onPrintLabel, onShowDetails]
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
    <BaseVStack {...props}>
      <BaseHStack
        width="100%"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <EmojiButton onPress={() => setExpandedInfo((b) => !b)}>ℹ️</EmojiButton>
        <Text variant="headlineMedium">
          {t("pixelsWithCount", { count: pixels.length })}
        </Text>
        <EmojiButton onPress={showActionSheet}>⚙️</EmojiButton>
      </BaseHStack>
      {lastError ? (
        <Text>{`${lastError}`}</Text>
      ) : pixels.length ? (
        <PixelInfoCardModeContext.Provider
          value={expandedInfo ? "expanded" : "normal"}
        >
          <FlatList
            contentContainerStyle={AppStyles.listContentContainer}
            data={pixels}
            renderItem={renderItem}
            refreshControl={refreshControl}
          />
        </PixelInfoCardModeContext.Provider>
      ) : (
        <Text style={[AppStyles.italic, AppStyles.selfCentered, AppStyles.mv3]}>
          {t("noPixelsFound")}
        </Text>
      )}
    </BaseVStack>
  );
});

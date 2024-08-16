import { useActionSheet } from "@expo/react-native-action-sheet";
import { PrebuildAnimations } from "@systemic-games/pixels-edit-animation";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { Text } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { BaseBoxProps } from "~/components/BaseBox";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";
import { EmojiButton } from "~/components/EmojiButton";
import { PixelInfoCardModeContext } from "~/components/PixelInfoCard";
import {
  PixelSwipeableCard,
  SwipeablePixelCardProps,
} from "~/components/PixelSwipeableCard";
import ChargerDispatcher from "~/features/pixels/ChargerDispatcher";
import PixelDispatcher, {
  PixelDispatcherActionMap,
} from "~/features/pixels/PixelDispatcher";
import { useFocusScannedPixelNotifiers } from "~/hooks/useFocusScannedPixelNotifiers";

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
  const [scannedDevices, scannerDispatch, scanStatus] =
    useFocusScannedPixelNotifiers({ minUpdateInterval });

  // Build our PixelDispatcher instances
  const lastDispatchersList = React.useRef<
    (PixelDispatcher | ChargerDispatcher)[]
  >([]);
  const dispatchers = React.useMemo(() => {
    const scanned = scannedDevices.map((dev) =>
      dev.type === "pixel"
        ? PixelDispatcher.getOrCreateDispatcher(dev)
        : ChargerDispatcher.getOrCreateDispatcher(dev)
    );
    const dispatchers = lastDispatchersList.current.filter(
      (p) => p.isInUse || scanned.includes(p)
    );
    dispatchers.push(...scanned.filter((p) => !dispatchers.includes(p)));
    lastDispatchersList.current = dispatchers;
    return dispatchers;
  }, [scannedDevices]);

  // Values for UI
  const { t } = useTranslation();
  const [expandedInfo, setExpandedInfo] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Actions dispatched to all Pixels
  const dispatchAll = React.useCallback(
    <T extends keyof PixelDispatcherActionMap>(
      action: T,
      params?: PixelDispatcherActionMap[T]
    ) =>
      dispatchers.forEach(
        (p) => p.type === "pixel" && p.dispatch(action, params)
      ),
    [dispatchers]
  );
  const { showActionSheetWithOptions } = useActionSheet();
  const showActionSheet = React.useCallback(() => {
    const options = [
      t("connect"),
      t("disconnect"),
      t("turnOff"),
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
            dispatchAll("playAnimation", PrebuildAnimations.rainbow);
            break;
          case 4:
            dispatchAll("playAnimation", PrebuildAnimations.cycleFire);
            break;
          case 5:
            dispatchAll("playAnimation", PrebuildAnimations.noise);
            break;
          case 6:
            dispatchAll("playProfileAnimation", 0);
            break;
          case 7:
            dispatchAll("uploadProfile");
            break;
          case 8:
            dispatchAll("queueDFU");
            break;
        }
      }
    );
  }, [dispatchAll, showActionSheetWithOptions, t]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: dispatcher }: { item: PixelDispatcher | ChargerDispatcher }) => (
      <PixelSwipeableCard
        key={dispatcher.pixelId}
        pixelDispatcher={dispatcher as PixelDispatcher} // TODO hack until this component is updated
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
          {t("pixelsWithCount", { count: dispatchers.length })}
        </Text>
        <EmojiButton onPress={showActionSheet}>⚙️</EmojiButton>
      </BaseHStack>
      {!(typeof scanStatus === "string") ? (
        <Text>{String(scanStatus)}</Text>
      ) : dispatchers.length ? (
        <PixelInfoCardModeContext.Provider
          value={expandedInfo ? "expanded" : "normal"}
        >
          <FlatList
            contentContainerStyle={AppStyles.listContentContainer}
            data={dispatchers}
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

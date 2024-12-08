import { useActionSheet } from "@expo/react-native-action-sheet";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { Text, useTheme } from "react-native-paper";

import {
  AllViewOptions,
  ViewOptions,
  ViewOptionsModal,
} from "./ViewOptionsModal";

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
  ListHeaderComponent,
  ...props
}: SwipeablePixelsListProps &
  BaseBoxProps & { ListHeaderComponent?: React.ComponentType }) {
  // Scanning
  const [scannedDevices, scannerDispatch, scanStatus] =
    useFocusScannedPixelNotifiers({ minUpdateInterval, keepAliveDuration: 0 });

  // Build our PixelDispatcher instances
  const lastDispatchersList = React.useRef<
    (PixelDispatcher | ChargerDispatcher)[]
  >([]);
  const allDispatchers = React.useMemo(() => {
    const scanned = scannedDevices
      .map((dev) =>
        dev.type === "die"
          ? PixelDispatcher.getOrCreateDispatcher(dev)
          : dev.type === "charger"
            ? ChargerDispatcher.getOrCreateDispatcher(dev)
            : undefined
      )
      .filter((pd): pd is PixelDispatcher | ChargerDispatcher => !!pd);
    const dispatchers = lastDispatchersList.current.filter(
      (p) => p.isInUse || scanned.includes(p)
    );
    dispatchers.push(...scanned.filter((p) => !dispatchers.includes(p)));
    lastDispatchersList.current = dispatchers;
    return dispatchers;
  }, [scannedDevices]);

  // Filters
  const [viewOptions, setViewOptions] = React.useState<ViewOptions[]>(
    AllViewOptions.filter((o) => o !== "onlyConnected" && o !== "expandedInfo")
  );
  const dispatchers = React.useMemo(
    () =>
      allDispatchers.filter(
        (pd) =>
          (pd.type !== "die" ||
            pd.dieType === "unknown" ||
            viewOptions.includes(pd.dieType)) &&
          (pd.type !== "charger" || viewOptions.includes("charger")) &&
          (!viewOptions.includes("onlyConnected") || pd.isReady)
      ),
    [allDispatchers, viewOptions]
  );

  // Values for UI
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = React.useState(false);

  // Actions dispatched to all Pixels
  const dispatchAll = React.useCallback(
    <T extends keyof PixelDispatcherActionMap>(
      action: T,
      params?: PixelDispatcherActionMap[T]
    ) =>
      dispatchers.forEach(
        (p) => p.type === "die" && p.dispatch(action, params)
      ),
    [dispatchers]
  );
  const { showActionSheetWithOptions } = useActionSheet();
  const showMassOpActions = React.useCallback(() => {
    const options = [
      t("connect"),
      t("disconnect"),
      t("turnOff"),
      t("rainbowAllFaces"),
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
            dispatchAll("uploadProfile");
            break;
          case 4:
            dispatchAll("queueDFU");
            break;
        }
      }
    );
  }, [dispatchAll, showActionSheetWithOptions, t]);
  const [optionsVisible, setOptionsVisible] = React.useState(false);

  const { colors } = useTheme();
  const StickyHeader = React.useCallback(
    () => (
      <BaseHStack
        width="100%"
        alignItems="baseline"
        justifyContent="space-between"
        backgroundColor={colors.background}
      >
        <EmojiButton onPress={() => setOptionsVisible(true)}>⋮</EmojiButton>
        <Text variant="headlineMedium">
          {t("pixelsWithCount", { count: dispatchers.length })}
          {allDispatchers.length > dispatchers.length
            ? ` (${allDispatchers.length})`
            : ""}
        </Text>
        <EmojiButton onPress={showMassOpActions}>⚙️</EmojiButton>
      </BaseHStack>
    ),
    [
      allDispatchers.length,
      colors.background,
      dispatchers.length,
      showMassOpActions,
      t,
    ]
  );

  // FlatList item rendering
  const data = ["header", "stickyHeader", ...dispatchers] as const;
  const renderItem = React.useCallback(
    ({ item: dispatcher }: { item: (typeof data)[number] }) =>
      dispatcher === "header" ? (
        ListHeaderComponent ? (
          <ListHeaderComponent />
        ) : null
      ) : dispatcher === "stickyHeader" ? (
        <StickyHeader />
      ) : (
        <PixelSwipeableCard
          key={dispatcher.pixelId}
          pixelDispatcher={dispatcher as PixelDispatcher} // TODO hack until this component is updated
          onShowDetails={onShowDetails}
          onPrintLabel={
            dispatcher instanceof ChargerDispatcher ? undefined : onPrintLabel
          }
        />
      ),
    [ListHeaderComponent, StickyHeader, onPrintLabel, onShowDetails]
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
      <BaseVStack {...props}>
        {!(typeof scanStatus === "string") ? (
          <Text>{String(scanStatus)}</Text>
        ) : allDispatchers.length ? (
          <PixelInfoCardModeContext.Provider
            value={viewOptions.includes("expandedInfo") ? "expanded" : "normal"}
          >
            <FlatList
              contentContainerStyle={AppStyles.listContentContainer}
              data={data}
              renderItem={renderItem}
              refreshControl={refreshControl}
              stickyHeaderIndices={[ListHeaderComponent ? 1 : 0]}
            />
          </PixelInfoCardModeContext.Provider>
        ) : (
          <Text
            style={[AppStyles.italic, AppStyles.selfCentered, AppStyles.mv3]}
          >
            {t("noPixelsDieOrChargerFound")}
          </Text>
        )}
      </BaseVStack>
      <ViewOptionsModal
        visible={optionsVisible}
        selectedOptions={viewOptions}
        onSelectOptions={setViewOptions}
        onDismiss={() => setOptionsVisible(false)}
      />
    </>
  );
});

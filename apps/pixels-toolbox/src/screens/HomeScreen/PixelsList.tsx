import { useDisclose } from "@systemic-games/react-native-pixels-components";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { Box, Center, FlatList, Text } from "native-base";
import { useState, useCallback, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line import/namespace
import { RefreshControl } from "react-native";

import ApplyAllActionsheet from "./ApplyAllActionsheet";

import EmojiButton from "~/components/EmojiButton";
import PixelSwipeableCard from "~/components/PixelSwipeableCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import PixelDispatcher, {
  PixelDispatcherAction,
} from "~/features/pixels/PixelDispatcher";
import useFocusPixelDispatcherScanner from "~/features/pixels/hooks/useFocusPixelDispatcherScanner";

function keyExtractor(p: ScannedPixel) {
  return p.systemId;
}

function Separator() {
  return <Box h={2} />;
}

interface PixelsListProps {
  onDieDetails: (pixelId: number) => void;
}

function PixelsListImpl({ onDieDetails }: PixelsListProps) {
  // Scanning
  const [pixelDispatchers, scannerDispatch, lastError] =
    useFocusPixelDispatcherScanner();
  useErrorWithHandler(lastError);

  // Actions dispatched to all Pixels
  const dispatchAllDisclose = useDisclose();
  const dispatchAll = useCallback(
    (action: PixelDispatcherAction) =>
      pixelDispatchers.forEach((pd) => pd.dispatch(action)),
    [pixelDispatchers]
  );

  // Values for UI
  const { t } = useTranslation();
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // FlatList item rendering
  const renderItem = useCallback(
    ({ item: dispatcher }: { item: PixelDispatcher }) => (
      <PixelSwipeableCard
        pixelDispatcher={dispatcher}
        moreInfo={showMoreInfo}
        onShowDetails={() => onDieDetails(dispatcher.pixelId)}
        swipeableItemsWidth={80}
      />
    ),
    [onDieDetails, showMoreInfo]
  );
  const refreshControl = useMemo(
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
      <Center flexDir="row" my={2} width="100%" alignItems="baseline">
        <EmojiButton onPress={() => setShowMoreInfo((b) => !b)}>ℹ️</EmojiButton>
        <Center flex={1}>
          <Text variant="h2">
            {t("pixelsWithCount", { count: pixelDispatchers.length })}
          </Text>
        </Center>
        <EmojiButton onPress={dispatchAllDisclose.onOpen}>⚙️</EmojiButton>
      </Center>
      {pixelDispatchers.length ? (
        <FlatList
          width="100%"
          data={pixelDispatchers}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          refreshControl={refreshControl}
        />
      ) : (
        <Text italic>{t("noPixelsFound")}</Text>
      )}
      <ApplyAllActionsheet
        dispatch={dispatchAll}
        isOpen={dispatchAllDisclose.isOpen}
        onClose={dispatchAllDisclose.onClose}
      />
    </>
  );
}

export default memo(PixelsListImpl);

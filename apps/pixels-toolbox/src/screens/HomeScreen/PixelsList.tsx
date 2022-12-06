import { Box, Center, FlatList, Text, useDisclose } from "native-base";
import { useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshControl,
  // eslint-disable-next-line import/namespace
} from "react-native";

import ApplyAllActionsheet from "./ApplyAllActionsheet";

import EmojiButton from "~/components/EmojiButton";
import PixelSwipeableCard from "~/components/PixelSwipeableCard";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import { PixelDispatcherAction } from "~/features/pixels/PixelDispatcher";
import useFocusPixelDispatcherScanner from "~/features/pixels/hooks/useFocusPixelDispatcherScanner";
import { sr } from "~/styles";

function PixelsListImpl() {
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
  return (
    <>
      <Center flexDir="row" my={sr(8)} width="100%" alignItems="baseline">
        <EmojiButton onPress={() => setShowMoreInfo((b) => !b)}>ℹ️</EmojiButton>
        <Center flex={1}>
          <Text variant="h2">
            {t("scannedPixelsWithCount", { count: pixelDispatchers.length })}
          </Text>
        </Center>
        <EmojiButton onPress={dispatchAllDisclose.onOpen}>⚙️</EmojiButton>
      </Center>
      {pixelDispatchers.length ? (
        <FlatList
          width="100%"
          data={pixelDispatchers}
          renderItem={(itemInfo) => (
            <PixelSwipeableCard
              pixelDispatcher={itemInfo.item}
              moreInfo={showMoreInfo}
              swipeableItemsWidth={sr("25%")}
            />
          )}
          keyExtractor={(p) => p.pixelId.toString()}
          ItemSeparatorComponent={() => <Box height={sr(8)} />}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
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
          }
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

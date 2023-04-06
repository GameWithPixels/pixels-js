import {
  FastBox,
  useDisclose,
} from "@systemic-games/react-native-pixels-components";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { Text } from "native-base";
import { useState, useCallback, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";

import ApplyAllActionsheet from "./ApplyAllActionsheet";

import EmojiButton from "~/components/EmojiButton";
import PixelSwipeableCard from "~/components/PixelSwipeableCard";
import PixelDispatcher, {
  PixelDispatcherAction,
} from "~/features/pixels/PixelDispatcher";
import useFocusPixelDispatcherScanner from "~/features/pixels/hooks/useFocusPixelDispatcherScanner";
import styles from "~/styles";

function keyExtractor(p: ScannedPixel) {
  return p.systemId;
}

function Separator() {
  return <FastBox h={2} />;
}

interface PixelsListProps {
  onDieDetails: (pixelId: number) => void;
}

function PixelsListImpl({ onDieDetails }: PixelsListProps) {
  // Scanning
  const [pixelDispatchers, scannerDispatch, lastError] =
    useFocusPixelDispatcherScanner();

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
      <FastBox
        my={8}
        width="100%"
        flexDir="row"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <EmojiButton onPress={() => setShowMoreInfo((b) => !b)}>ℹ️</EmojiButton>
        <Text variant="h2">
          {t("pixelsWithCount", { count: pixelDispatchers.length })}
        </Text>
        <EmojiButton onPress={dispatchAllDisclose.onOpen}>⚙️</EmojiButton>
      </FastBox>
      {lastError ? (
        <Text>{`${lastError}`}</Text>
      ) : pixelDispatchers.length ? (
        <FlatList
          style={styles.containerFullWidth}
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

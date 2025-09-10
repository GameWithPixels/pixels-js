import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import {
  useTheme,
  Text,
  ThemeProvider,
  ActivityIndicator,
} from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { TopRightCloseButton, SelectionButton } from "./buttons";

import { getBottomSheetProps } from "~/app/themes";
import { ThreeDDiceConnector } from "~/features/appActions/ThreeDDiceConnector";
import { useBottomSheetBackHandler } from "~/hooks";

export function DDDiceRoomSlugsBottomSheet({
  apiKey,
  roomSlug,
  visible,
  onDismiss,
  onSelectRoomSlug,
}: {
  apiKey: string;
  roomSlug: string;
  visible: boolean;
  onDismiss: () => void;
  onSelectRoomSlug: (slug: string) => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const [roomSlugs, setRoomSlugs] = React.useState<string[] | string>();
  const fetchRooms = React.useCallback(() => {
    // Get room slugs
    const dddice = new ThreeDDiceConnector(apiKey);
    dddice
      .getRoomSlugsAsync()
      .then((slugs) => {
        console.log(`Fetched room slugs: ${slugs}`);
        setRoomSlugs(slugs);
      })
      .catch((err) => {
        console.error(`Error fetching room slugs: ${err}`);
        setRoomSlugs(
          `Error fetching room slugs: ${err instanceof Error ? err.message : err}`
        );
      });
  }, [apiKey]);
  React.useEffect(() => {
    // Initial fetch of room slugs
    fetchRooms();
  }, [fetchRooms]);

  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      onDismiss={onDismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <BottomSheetScrollView
            contentContainerStyle={{ padding: 20, gap: 10 }}
          >
            {!roomSlugs || typeof roomSlugs === "string" ? (
              <View
                style={{
                  flexDirection: "row",
                  alignSelf: "center",
                  alignItems: "center",
                  marginVertical: 20,
                  gap: 20,
                }}
              >
                <Text
                  variant="bodyMedium"
                  style={!!roomSlugs && { color: colors.error }}
                >
                  {roomSlugs
                    ? roomSlugs
                    : roomSlugs === undefined
                      ? "Retrieving rooms..."
                      : "No room found"}
                </Text>
                {roomSlugs === undefined ? (
                  <ActivityIndicator />
                ) : (
                  <MaterialCommunityIcons
                    name="refresh"
                    size={26}
                    color={colors.onSurface}
                    onPress={fetchRooms}
                  />
                )}
              </View>
            ) : (
              <>
                <Text variant="titleMedium">Available Rooms</Text>
                <View>
                  {roomSlugs.map((rs, i) => (
                    <SelectionButton
                      key={rs}
                      selected={roomSlug === rs}
                      noTopBorder={i > 0}
                      squaredTopBorder={i > 0}
                      squaredBottomBorder={i < roomSlugs.length - 1}
                      onPress={() => onSelectRoomSlug(rs)}
                    >
                      {rs}
                    </SelectionButton>
                  ))}
                </View>
              </>
            )}
          </BottomSheetScrollView>
          <TopRightCloseButton onPress={onDismiss} />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}

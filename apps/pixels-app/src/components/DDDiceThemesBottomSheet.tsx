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
import { DDDiceRoomConnection } from "~/features/appActions/DDDiceRoomConnection";
import { ThreeDDiceTheme } from "~/features/appActions/ThreeDDiceConnector";
import { useBottomSheetBackHandler } from "~/hooks";

export function DDDiceThemesBottomSheet({
  dddiceConnection,
  themeId,
  visible,
  onDismiss,
  onSelectTheme,
}: {
  dddiceConnection: DDDiceRoomConnection;
  themeId?: string;
  visible: boolean;
  onDismiss: () => void;
  onSelectTheme: (theme: ThreeDDiceTheme) => void;
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

  const [themes, setThemes] = React.useState<ThreeDDiceTheme[] | string>();
  const fetchThemes = React.useCallback(() => {
    setThemes(undefined);
    dddiceConnection
      .getThemesAsync()
      .then((themes) => {
        console.log(`Fetched themes: ${themes}`);
        setThemes(themes);
      })
      .catch((err) => {
        console.error(`Error fetching themes: ${err}`);
        setThemes(
          `Error fetching themes: ${err instanceof Error ? err.message : err}`
        );
      });
  }, [dddiceConnection]);
  React.useEffect(() => {
    // Initial fetch of themes
    fetchThemes();
  }, [fetchThemes]);

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
            {!themes || typeof themes === "string" ? (
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
                  style={!!themes && { color: colors.error }}
                >
                  {themes
                    ? themes
                    : themes === undefined
                      ? "Retrieving dddice themes..."
                      : "No dddice themes found"}
                </Text>
                {themes === undefined ? (
                  <ActivityIndicator />
                ) : (
                  <MaterialCommunityIcons
                    name="refresh"
                    size={26}
                    color={colors.onSurface}
                    onPress={fetchThemes}
                  />
                )}
              </View>
            ) : (
              <>
                <Text variant="titleMedium">Available Themes</Text>
                <View>
                  {themes.map((t, i) => (
                    <SelectionButton
                      key={t.id}
                      selected={themeId === t.id}
                      noTopBorder={i > 0}
                      squaredTopBorder={i > 0}
                      squaredBottomBorder={i < themes.length - 1}
                      onPress={() => onSelectTheme(t)}
                    >
                      {t.name ?? t.id}
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

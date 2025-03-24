import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { AppActionsGrid } from "./AppActionsGrid";
import { RotatingGradientBorderCard } from "./GradientBorderCard";
import { BottomSheetModalCloseButton, GradientIconButton } from "./buttons";
import { AppActionKindIcon } from "./icons";

import { useAppSelector } from "~/app/hooks";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { AppActionKind } from "~/features/store";
import { useBottomSheetBackHandler, useBottomSheetPadding } from "~/hooks";

const appActionKinds: readonly AppActionKind[] = [
  "speak",
  "url",
  "json",
  "discord",
  "twitch",
  "dddice",
] as const;

function NewAppActionButtons({
  onPress,
}: {
  onPress?: (format: AppActionKind) => void;
}) {
  return (
    onPress && (
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        {appActionKinds.map((kind) => (
          <View key={kind} style={{ width: 50, alignItems: "center", gap: 5 }}>
            <GradientIconButton
              icon={(props) => (
                <AppActionKindIcon actionKind={kind} {...props} />
              )}
              onPress={() => onPress?.(kind)}
            />
            <Text variant="bodySmall">{kind}</Text>
          </View>
        ))}
      </View>
    )
  );
}

export function PickAppActionBottomSheet({
  appActionUuid,
  onSelectAppActionUuid,
  onCreateAppAction,
  visible,
  onDismiss,
}: {
  appActionUuid?: string;
  onSelectAppActionUuid?: (uuid: string) => void;
  onCreateAppAction?: (kind: AppActionKind) => void;
  visible: boolean;
  onDismiss: () => void;
}) {
  const allActionsIds = useAppSelector(
    (state) => state.appActions.entries.ids as string[]
  );

  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);
  const scrollRef = React.useRef<GHScrollView>(null);
  const paddingBottom = useBottomSheetPadding();
  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={["92%"]}
      onDismiss={onDismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <BottomSheetView
            style={{
              flex: 1,
              paddingHorizontal: 10,
              paddingBottom,
              gap: 10,
            }}
          >
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Select App Action
            </Text>
            <GHScrollView ref={scrollRef} contentContainerStyle={{ gap: 10 }}>
              {allActionsIds.length ? (
                <>
                  <NewAppActionButtons onPress={onCreateAppAction} />
                  <AppActionsGrid
                    appActionUuids={allActionsIds}
                    numColumns={2}
                    selected={appActionUuid}
                    onPressAppAction={onSelectAppActionUuid}
                    onLongPressAppAction={(uuid) => {}}
                  />

                  <Text variant="bodySmall" style={AppStyles.selfCentered}>
                    Long press on Audio Clip to remove it.
                  </Text>
                </>
              ) : (
                <RotatingGradientBorderCard
                  style={{
                    width: "80%",
                    marginTop: 20,
                    alignSelf: "center",
                  }}
                  contentStyle={{
                    paddingVertical: 40,
                    paddingHorizontal: 20,
                    gap: 40,
                  }}
                >
                  <Text variant="titleLarge">Create App Action</Text>
                  <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
                    Store connection settings bla bla bla
                  </Text>
                  <NewAppActionButtons onPress={onCreateAppAction} />
                </RotatingGradientBorderCard>
              )}
            </GHScrollView>
          </BottomSheetView>
          <BottomSheetModalCloseButton onPress={onDismiss} />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}

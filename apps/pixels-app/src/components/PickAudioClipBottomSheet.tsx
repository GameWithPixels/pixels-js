import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";
import { Alert } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { AudioClipsGrid } from "./AudioClipsGrid";
import { BottomSheetModalCloseButton, OutlineButton } from "./buttons";

import { useAppStore } from "~/app/hooks";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { importFileAsset, removeFileAsset } from "~/features/audio";
import {
  useAudioClipsList,
  useBottomSheetBackHandler,
  useBottomSheetPadding,
} from "~/hooks";

export function PickAudioClipBottomSheet({
  audioClipUuid,
  onSelectAudioClip,
  visible,
  onDismiss,
}: {
  audioClipUuid?: string;
  onSelectAudioClip?: (audioClipUuid: string) => void;
  visible: boolean;
  onDismiss: () => void;
}) {
  const store = useAppStore();
  const allClips = useAudioClipsList();

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
              paddingHorizontal: 20,
              paddingBottom,
              gap: 10,
            }}
          >
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Select Audio Clip
            </Text>
            <OutlineButton onPress={() => importFileAsset(store, "audio")}>
              Import Audio File
            </OutlineButton>
            <GHScrollView ref={scrollRef} contentContainerStyle={{ gap: 20 }}>
              <AudioClipsGrid
                clips={allClips}
                numColumns={2}
                selected={audioClipUuid}
                onPressClip={onSelectAudioClip}
                onLongPressClip={(uuid) =>
                  Alert.alert(
                    "Remove Audio Clip?",
                    "This will remove the audio clip from the app, but it won't delete the original file.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => removeFileAsset(store, uuid, "audio"),
                      },
                    ]
                  )
                }
              />
              {allClips.length > 0 && (
                <Text variant="bodySmall" style={AppStyles.selfCentered}>
                  Long press on Audio Clip to remove it.
                </Text>
              )}
            </GHScrollView>
          </BottomSheetView>
          <BottomSheetModalCloseButton onPress={onDismiss} />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}

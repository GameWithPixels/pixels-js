import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React from "react";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { IconButton, Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { AudioClipsGrid } from "./AudioClipsGrid";
import { OutlineButton } from "./buttons";

import { useAppStore } from "~/app/hooks";
import { AppStore } from "~/app/store";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { LibraryAssets } from "~/features/store";
import { generateUuid, logError } from "~/features/utils";
import {
  useAudioClipsList,
  useBottomSheetBackHandler,
  useBottomSheetPadding,
} from "~/hooks";

async function importAudioClip(store: AppStore): Promise<void> {
  try {
    const files = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: true,
    });
    for (const file of files.assets ?? []) {
      let uuid = generateUuid();
      while (store.getState().libraryAssets.audioClips.entities[uuid]) {
        uuid = generateUuid();
      }
      const audioDir = FileSystem.documentDirectory + "audioClips/";
      const pathname = audioDir + uuid;
      if ((await FileSystem.getInfoAsync(audioDir)).exists) {
        await FileSystem.deleteAsync(pathname, { idempotent: true });
      } else {
        await FileSystem.makeDirectoryAsync(audioDir);
      }
      await FileSystem.moveAsync({
        from: file.uri,
        to: pathname,
      });
      const typeIndex = file.name.lastIndexOf(".");
      const type = typeIndex >= 0 ? file.name.slice(typeIndex + 1) : "";
      store.dispatch(
        LibraryAssets.AudioClips.add({
          uuid,
          name: file.name,
          type,
        })
      );
    }
  } catch (e: any) {
    logError(`Failed to import audio clip: ${e?.message ?? e}`);
  }
}

export function PickAudioClipBottomSheet({
  audioClipUuid,
  onSelectAudioClip,
  visible,
  onDismiss,
}: {
  audioClipUuid?: string;
  onSelectAudioClip?: (audioClipUuid: string) => void;
  onDismiss: () => void;
  visible: boolean;
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
              paddingHorizontal: 10,
              paddingBottom,
              gap: 10,
            }}
          >
            <OutlineButton onPress={() => importAudioClip(store)}>
              Import Audio Clip
            </OutlineButton>
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Select Audio Clip
            </Text>
            <GHScrollView ref={scrollRef} contentContainerStyle={{ gap: 10 }}>
              <AudioClipsGrid
                clips={allClips}
                numColumns={2}
                selected={audioClipUuid}
                onSelectClip={onSelectAudioClip}
              />
            </GHScrollView>
          </BottomSheetView>
          <IconButton
            icon="close"
            iconColor={colors.primary}
            sentry-label="close-pick-animation"
            style={{ position: "absolute", right: 0, top: -15 }}
            onPress={onDismiss}
          />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}

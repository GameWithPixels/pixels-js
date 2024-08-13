import { assertNever } from "@systemic-games/pixels-core-utils";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { Button, Card, Switch, Text, useTheme } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { useAppDispatch } from "~/app/hooks";
import { store } from "~/app/store";
import { AppPage } from "~/components/AppPage";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import {
  addImportedDfuFiles,
  setSelectedDfuFiles,
} from "~/features/store/dfuFilesSlice";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import { useAppDfuFilesBundles } from "~/hooks/useAppDfuFilesBundles";
import { SelectDfuFilesScreenProps } from "~/navigation";

async function importDfuFile() {
  const file = await DocumentPicker.getDocumentAsync({
    type: "application/zip",
    copyToCacheDirectory: true,
  });
  if (file.assets?.length) {
    const pathname = FileSystem.cacheDirectory + file.assets[0].name;
    await FileSystem.deleteAsync(pathname, { idempotent: true });
    await FileSystem.moveAsync({
      from: file.assets[0].uri,
      to: pathname,
    });
    store.dispatch(addImportedDfuFiles([pathname]));
  }
}

function getDescription(bundle: DfuFilesBundle): string | undefined {
  switch (bundle.kind) {
    case "factory":
      return "🔥 Used In Factory Validation 🔥";
    case "app":
      return undefined;
    case "imported":
      return "Imported";
    default:
      assertNever(bundle.kind);
  }
}

function SelectDfuFilePage({ navigation }: SelectDfuFilesScreenProps) {
  const appDispatch = useAppDispatch();

  // DFU files bundles are loaded asynchronously
  const [selectedBundle, availableBundles, bundlesError] =
    useAppDfuFilesBundles();
  const sortedBundles = React.useMemo(() => {
    const b = [...availableBundles];
    b.sort((b1, b2) => b2.date.getTime() - b1.date.getTime());
    return b;
  }, [availableBundles]);

  // Files to show
  const [hideBootloaders, setHideBootloaders] = React.useState(true);
  const bundles = React.useMemo(
    () => sortedBundles.filter((b) => !hideBootloaders || !!b.firmware),
    [sortedBundles, hideBootloaders]
  );

  // FlatList item rendering
  const { colors } = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        selectedCard: {
          borderColor: colors.primary,
          borderWidth: 2,
        },
      }),
    [colors.primary]
  );
  const renderItem = React.useCallback(
    ({ item: bundle }: { item: DfuFilesBundle; index: number }) => {
      const comment = bundle.main.comment;
      const desc = getDescription(bundle);
      return (
        <Pressable
          key={bundle?.bootloader?.pathname ?? bundle?.firmware?.pathname}
          style={AppStyles.flex}
          onPress={() => {
            appDispatch(setSelectedDfuFiles(availableBundles.indexOf(bundle)));
            navigation.goBack();
          }}
        >
          <Card
            style={bundle === selectedBundle ? styles.selectedCard : undefined}
          >
            <Card.Title title={`📅 ${toLocaleDateTimeString(bundle.date)}`} />
            <Card.Content style={{ gap: 5 }}>
              <Text style={AppStyles.bold}>{`Type: ${bundle.items
                .map((i) => i.type)
                .join(", ")}`}</Text>
              {(comment?.length ?? 0) > 0 && (
                <Text>{`Comment: ${comment}`}</Text>
              )}
              {desc && <Text style={{ marginTop: 10 }}>{desc}</Text>}
            </Card.Content>
          </Card>
        </Pressable>
      );
    },
    [
      appDispatch,
      availableBundles,
      navigation,
      selectedBundle,
      styles.selectedCard,
    ]
  );

  return (
    <BaseVStack height="100%" alignItems="center" gap={10}>
      <Button mode="contained-tonal" onPress={importDfuFile}>
        Import A DFU Zip File
      </Button>
      {bundles.length ? (
        <>
          <BaseHStack alignItems="center">
            <Text>Hide Standalone Bootloaders</Text>
            <Switch
              onValueChange={setHideBootloaders}
              value={hideBootloaders}
            />
          </BaseHStack>
          <Text variant="titleLarge">Select Firmware:</Text>
          <FlatList
            style={AppStyles.fullWidth}
            contentContainerStyle={AppStyles.listContentContainer}
            data={bundles}
            renderItem={renderItem}
          />
        </>
      ) : (
        <Text style={AppStyles.bold}>{`${
          bundlesError ?? "No DFU files!"
        }`}</Text>
      )}
    </BaseVStack>
  );
}

export function SelectDfuFilesScreen(props: SelectDfuFilesScreenProps) {
  return (
    <AppPage>
      <SelectDfuFilePage {...props} />
    </AppPage>
  );
}

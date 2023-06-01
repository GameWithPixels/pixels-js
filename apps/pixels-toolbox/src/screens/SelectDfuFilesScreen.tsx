import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { Button, Card, Switch, Text, useTheme } from "react-native-paper";

import { useAppDispatch } from "~/app/hooks";
import { store } from "~/app/store";
import { AppPage } from "~/components/AppPage";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import useAppDfuFilesBundles from "~/features/hooks/useAppDfuFilesBundles";
import {
  addImportedDfuBundle,
  setSelectedDfuBundle,
} from "~/features/store/dfuBundlesSlice";
import toLocaleDateTimeString from "~/features/toLocaleDateTimeString";
import { SelectDfuFilesScreenProps } from "~/navigation";
import gs from "~/styles";

async function importDfuFile() {
  const file = await DocumentPicker.getDocumentAsync({
    type: "application/zip",
    copyToCacheDirectory: true,
  });
  if (file.type === "success") {
    const pathname = FileSystem.cacheDirectory + file.name;
    await FileSystem.deleteAsync(pathname, { idempotent: true });
    await FileSystem.moveAsync({
      from: file.uri,
      to: pathname,
    });
    store.dispatch(addImportedDfuBundle([pathname]));
  }
}

function getDescription(bundle: DfuFilesBundle): string | undefined {
  switch (bundle.kind) {
    case "factory":
      return "(*) Used In Validation";
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
  const theme = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        selectedCard: {
          borderColor: theme.colors.primary,
          borderWidth: 2,
        },
      }),
    [theme.colors.primary]
  );
  const renderItem = React.useCallback(
    ({ item: bundle }: { item: DfuFilesBundle; index: number }) => {
      const comment = bundle.main.comment;
      const desc = getDescription(bundle);
      return (
        <Pressable
          key={bundle?.bootloader?.pathname ?? bundle?.firmware?.pathname}
          style={gs.flex}
          onPress={() => {
            appDispatch(setSelectedDfuBundle(availableBundles.indexOf(bundle)));
            navigation.goBack();
          }}
        >
          <Card
            style={bundle === selectedBundle ? styles.selectedCard : undefined}
          >
            <Card.Title title={`📅 ${toLocaleDateTimeString(bundle.date)}`} />
            <Card.Content>
              <Text style={gs.bold}>{`Type: ${bundle.items
                .map((i) => i.type)
                .join(", ")}`}</Text>
              {desc && <Text>{`Remark: ${desc}`}</Text>}
              {(comment?.length ?? 0) > 0 && (
                <Text>{`Comment: ${comment}`}</Text>
              )}
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
    <FastVStack gap={8} alignItems="center">
      <Button mode="contained-tonal" onPress={importDfuFile}>
        Import A DFU Zip File
      </Button>
      {bundles.length ? (
        <>
          <FastHStack alignItems="center">
            <Text>Hide Standalone Bootloaders</Text>
            <Switch
              onValueChange={setHideBootloaders}
              value={hideBootloaders}
            />
          </FastHStack>
          <Text>Select Firmware:</Text>
          <FlatList
            style={gs.fullWidth}
            data={bundles}
            renderItem={renderItem}
            contentContainerStyle={gs.listContentContainer}
          />
        </>
      ) : (
        <Text style={gs.bold}>{`${bundlesError ?? "No DFU files!"}`}</Text>
      )}
    </FastVStack>
  );
}

export default function (props: SelectDfuFilesScreenProps) {
  return (
    <AppPage>
      <SelectDfuFilePage {...props} />
    </AppPage>
  );
}

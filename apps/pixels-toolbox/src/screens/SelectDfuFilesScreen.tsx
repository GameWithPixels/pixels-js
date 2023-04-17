import {
  FastBox,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlatList, Pressable } from "react-native";
import { Card, Switch, Text } from "react-native-paper";

import { useAppDispatch } from "~/app/hooks";
import useAppDfuFilesBundles from "~/app/useAppDfuFilesBundles";
import { AppPage } from "~/components/AppPage";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { setSelectedDfuBundle } from "~/features/store/dfuBundlesSlice";
import { SelectDfuFilesProps } from "~/navigation";
import gs from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function SelectDfuFilePage({ navigation }: SelectDfuFilesProps) {
  const appDispatch = useAppDispatch();

  // DFU files bundles are loaded asynchronously
  const [_, availableBundles, bundlesError] = useAppDfuFilesBundles();

  // Files to show
  const [showBootloaders, setShowBootloaders] = React.useState(false);
  const bundles = React.useMemo(
    () => availableBundles.filter((b) => showBootloaders || !!b.firmware),
    [availableBundles, showBootloaders]
  );

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: bundle, index }: { item: DfuFilesBundle; index: number }) => (
      <Pressable
        key={bundle?.bootloader?.pathname ?? bundle?.firmware?.pathname}
        onPress={() => {
          appDispatch(setSelectedDfuBundle(index));
          navigation.goBack();
        }}
      >
        <Card>
          <Card.Title title={`📅 ${toLocaleDateTimeString(bundle.date)}`} />
          <Card.Content>
            <Text>{`Type: ${bundle.types.join(", ")}`}</Text>
          </Card.Content>
        </Card>
      </Pressable>
    ),
    [appDispatch, navigation]
  );

  return (
    <FastBox gap={8} alignItems="center">
      {bundles.length ? (
        <>
          <FastHStack alignItems="center">
            <Text>Show Standalone Bootloaders</Text>
            <Switch
              onValueChange={setShowBootloaders}
              value={showBootloaders}
            />
          </FastHStack>
          <Text style={gs.bold}>Select Firmware:</Text>
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
    </FastBox>
  );
}

export default function (props: SelectDfuFilesProps) {
  return (
    <AppPage>
      <SelectDfuFilePage {...props} />
    </AppPage>
  );
}

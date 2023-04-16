import {
  FastBox,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import { useAssets } from "expo-asset";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { FlatList, Pressable } from "react-native";
import { Card, Switch, Text } from "react-native-paper";

import dfuFilesZip from "!/dfu-files.zip";
import { useAppDispatch } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import getDfuFileInfo, { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import unzipDfuFiles from "~/features/dfu/unzipDfuFiles";
import { setDfuFiles } from "~/features/store/dfuFilesSlice";
import { SelectDfuFilesProps } from "~/navigation";
import gs from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function SelectDfuFilePage({ navigation }: SelectDfuFilesProps) {
  const errorHandler = useErrorHandler();
  const [assets, assetsError] = useAssets([dfuFilesZip]);
  const [allDfuFiles, setAllDfuFiles] = React.useState<DfuFileInfo[][]>();
  const appDispatch = useAppDispatch();
  //const { dfuFiles } = useAppSelector((state) => state.dfuFiles);

  React.useEffect(() => {
    if (assets) {
      if (assets.length) {
        const extractFirmwareFiles = async () => {
          const files = await unzipDfuFiles(assets[0]);
          const filesInfo = files.sort().map(getDfuFileInfo);
          // Group files with same date
          const filesByDate = new Map<number, DfuFileInfo[]>();
          filesInfo.forEach((i) => {
            const ts = i.date?.getTime();
            if (ts) {
              const files = filesByDate.get(ts) ?? [];
              files.push(i);
              filesByDate.set(ts, files);
            } else {
              console.log(
                "Couldn't read firmware date on DFU file: " + i.pathname
              );
            }
          });
          setAllDfuFiles(
            [...filesByDate.values()].sort(
              (a, b) =>
                (b[0].date?.getTime() ?? 0) - (a[0].date?.getTime() ?? 0)
            )
          );
        };
        extractFirmwareFiles().catch(errorHandler);
      } else {
        errorHandler(new Error("Got no asset for firmware file(s)"));
      }
    } else if (assetsError) {
      errorHandler(assetsError);
    }
  }, [assets, assetsError, errorHandler]);

  // Files to show
  const [showBootloaders, setShowBootloaders] = React.useState(false);
  const dfuFiles = React.useMemo(() => {
    if (!allDfuFiles || showBootloaders) {
      return allDfuFiles;
    } else {
      return allDfuFiles.filter(
        (filesInfo) => filesInfo.length > 1 || filesInfo[0]?.type === "firmware"
      );
    }
  }, [allDfuFiles, showBootloaders]);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: filesInfo }: { item: DfuFileInfo[] }) => (
      <Pressable
        key={filesInfo[0].pathname}
        onPress={() => {
          appDispatch(setDfuFiles(filesInfo.map((i) => i.pathname)));
          navigation.goBack();
        }}
      >
        <Card>
          <Card.Title
            title={`📅 ${toLocaleDateTimeString(
              filesInfo[0].date ?? new Date(0)
            )}`}
          />
          <Card.Content>
            <Text>
              Type: {filesInfo.map((i) => i.type ?? "unknown").join(", ")}
            </Text>
          </Card.Content>
        </Card>
      </Pressable>
    ),
    [appDispatch, navigation]
  );

  return (
    <FastBox gap={8} alignItems="center">
      {!dfuFiles ? (
        <Text style={gs.italic}>Reading DFU files...</Text>
      ) : dfuFiles.length ? (
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
            data={dfuFiles}
            renderItem={renderItem}
            contentContainerStyle={gs.listContentContainer}
          />
        </>
      ) : (
        <Text style={gs.bold}>No files found in assets/dfu-files.zip!</Text>
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

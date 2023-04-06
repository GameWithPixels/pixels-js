import {
  FastBox,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import { useAssets } from "expo-asset";
import { Pressable, Switch, Text, VStack } from "native-base";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import { FlatList } from "react-native";

import dfuFilesZip from "!/dfu-files.zip";
import { useAppDispatch } from "~/app/hooks";
import AppPage from "~/components/AppPage";
import getDfuFileInfo, { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import unzipDfuFiles from "~/features/dfu/unzipDfuFiles";
import { setDfuFiles } from "~/features/store/dfuFilesSlice";
import { SelectDfuFilesProps } from "~/navigation";
import styles from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function keyExtractor(files: DfuFileInfo[]) {
  return files[0].pathname;
}

function Separator() {
  return <FastBox h={2} />;
}

function SelectDfuFilePage({ navigation }: SelectDfuFilesProps) {
  const errorHandler = useErrorHandler();
  const [assets, assetsError] = useAssets([dfuFilesZip]);
  const [allDfuFiles, setAllDfuFiles] = useState<DfuFileInfo[][]>();
  const appDispatch = useAppDispatch();
  //const { dfuFiles } = useAppSelector((state) => state.dfuFiles);

  useEffect(() => {
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
  const [showBootloaders, setShowBootloaders] = useState(false);
  const dfuFiles = useMemo(() => {
    if (!allDfuFiles || showBootloaders) {
      return allDfuFiles;
    } else {
      return allDfuFiles.filter(
        (filesInfo) => filesInfo.length > 1 || filesInfo[0]?.type === "firmware"
      );
    }
  }, [allDfuFiles, showBootloaders]);

  // FlatList item rendering
  const renderItem = useCallback(
    ({ item: filesInfo }: { item: DfuFileInfo[] }) => (
      <Pressable
        onPress={() => {
          appDispatch(setDfuFiles(filesInfo.map((i) => i.pathname)));
          navigation.goBack();
        }}
      >
        <VStack
          variant="cardWithBorder"
          width="100%"
          alignItems="center"
          space={1}
          py={2}
          my={1}
        >
          <Text variant="h2">
            {`📅 ${toLocaleDateTimeString(filesInfo[0].date ?? new Date(0))}`}
          </Text>
          <Text>
            Type: {filesInfo.map((i) => i.type ?? "unknown").join(", ")}
          </Text>
        </VStack>
      </Pressable>
    ),
    [appDispatch, navigation]
  );

  return (
    <FastBox flex={1} alignItems="center" px={3}>
      {!dfuFiles ? (
        <Text italic my={3}>
          Reading DFU files...
        </Text>
      ) : dfuFiles.length ? (
        <>
          <FastHStack my={2} alignItems="center">
            <Text>Show Standalone Bootloaders</Text>
            <Switch onToggle={setShowBootloaders} value={showBootloaders} />
          </FastHStack>
          <Text bold my={2}>
            Select Firmware:
          </Text>
          <FlatList
            style={styles.containerFullWidth}
            data={dfuFiles}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={Separator}
          />
        </>
      ) : (
        <Text bold>No files found in assets/dfu-files.zip!</Text>
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

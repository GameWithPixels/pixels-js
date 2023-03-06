import { useAssets } from "expo-asset";
import { Box, Center, FlatList, Pressable, Text, VStack } from "native-base";
import { useCallback, useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
// eslint-disable-next-line import/namespace
import { ListRenderItemInfo } from "react-native";

import dfuFilesZip from "!/dfu-files.zip";
import { useAppDispatch } from "~/app/hooks";
import AppPage from "~/components/AppPage";
import getDfuFileInfo, { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import unzipDfuFiles from "~/features/dfu/unzipDfuFiles";
import { setDfuFiles } from "~/features/store/dfuFilesSlice";
import { SelectDfuFilesProps } from "~/navigation";
import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function SelectDfuFilePage({ navigation }: SelectDfuFilesProps) {
  const errorHandler = useErrorHandler();
  const [assets, assetsError] = useAssets([dfuFilesZip]);
  const [dfuFilesByDate, setDfuFilesByDate] = useState<DfuFileInfo[][]>();
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
          setDfuFilesByDate(
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

  // FlatList components
  const Separator = useCallback(() => <Box h={sr(8)} />, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DfuFileInfo[]>) => (
      <Pressable
        onPress={() => {
          appDispatch(setDfuFiles(item.map((i) => i.pathname)));
          navigation.goBack();
        }}
      >
        <VStack
          variant="cardWithBorder"
          width="100%"
          alignItems="center"
          space={sr(5)}
          py={sr(8)}
        >
          <Text variant="h2">
            {`📅 ${toLocaleDateTimeString(item[0].date ?? new Date(0))}`}
          </Text>
          <Text>Type: {item.map((i) => i.type ?? "unknown").join(", ")}</Text>
        </VStack>
      </Pressable>
    ),
    [appDispatch, navigation]
  );

  return (
    <Center left="2%" width="96%">
      {!dfuFilesByDate ? (
        <Text italic my={sr(5)}>
          Reading DFU files...
        </Text>
      ) : dfuFilesByDate.length ? (
        <>
          <Text italic my={sr(5)}>
            Tap On Bootloader/Firmware To Select:
          </Text>
          <FlatList
            width="100%"
            data={dfuFilesByDate}
            keyExtractor={(files) => files[0].pathname}
            renderItem={renderItem}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </>
      ) : (
        <Text bold>No files found in assets/dfu-files.zip!</Text>
      )}
    </Center>
  );
}

export default function (props: SelectDfuFilesProps) {
  return (
    <AppPage>
      <SelectDfuFilePage {...props} />
    </AppPage>
  );
}

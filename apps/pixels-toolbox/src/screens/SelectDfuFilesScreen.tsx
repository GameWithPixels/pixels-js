import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAssets } from "expo-asset";
import { Box, Button, Center, FlatList, Text } from "native-base";
import { useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";

import dfuFilesZip from "~/../assets/dfu-files.zip";
import { useAppDispatch } from "~/app/hooks";
import AppPage from "~/components/AppPage";
import getDfuFileInfo, { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import unzipDfuFiles from "~/features/dfu/unzipDfuFiles";
import { setDfuFiles } from "~/features/store/dfuFilesSlice";
import { type RootStackParamList } from "~/navigation";
import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function SelectDfuFilePage() {
  const errorHandler = useErrorHandler();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "SelectDfuFiles">>();
  useEffect(() => {
    navigation.setOptions({
      title: "Select Firmware:",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
          setDfuFilesByDate([...filesByDate.values()]);
        };
        extractFirmwareFiles().catch(errorHandler);
      } else {
        errorHandler(new Error("Got no asset for firmware file(s)"));
      }
    } else if (assetsError) {
      errorHandler(assetsError);
    }
  }, [assets, assetsError, errorHandler]);

  return (
    <Center left="2%" width="96%">
      {!dfuFilesByDate ? (
        <Text italic>Reading DFU files...</Text>
      ) : dfuFilesByDate.length ? (
        <FlatList
          width="100%"
          ItemSeparatorComponent={() => <Box h={sr(8)} />}
          data={dfuFilesByDate}
          renderItem={(itemInfo) => (
            <Center variant="cardWithBorder" width="100%">
              <Text variant="h2">
                {`📅 ${toLocaleDateTimeString(
                  itemInfo.item[0].date ?? new Date(0)
                )}`}
              </Text>
              <Text>
                Type: {itemInfo.item.map((i) => i.type ?? "unknown").join(", ")}
              </Text>
              <Button
                marginY={sr(5)}
                onPress={() => {
                  appDispatch(
                    setDfuFiles(itemInfo.item.map((i) => i.pathname))
                  );
                  navigation.goBack();
                }}
              >
                Select
              </Button>
            </Center>
          )}
          keyExtractor={(files) => files[0].pathname}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : (
        <Text bold>No files found in assets/dfu-files.zip!</Text>
      )}
    </Center>
  );
}

export default function () {
  return (
    <AppPage>
      <SelectDfuFilePage />
    </AppPage>
  );
}

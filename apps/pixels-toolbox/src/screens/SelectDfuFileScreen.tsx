import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAssets } from "expo-asset";
import { Box, Button, Center, FlatList, Text } from "native-base";
import { useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";

import dfuFiles from "~/../assets/dfu-files.zip";
import AppPage from "~/components/AppPage";
import DfuFile from "~/components/DfuFile";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import unzipDfuFiles from "~/features/dfu/unzipDfuFiles";
import {
  SelectDfuFileScreenProps,
  type RootStackParamList,
} from "~/navigation";
import { sr } from "~/styles";

function SelectDfuFilePage({ route }: SelectDfuFileScreenProps) {
  const errorHandler = useErrorHandler();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "SelectDfuFile">>();
  const [assets, assetsError] = useAssets([dfuFiles]);
  const [firmwareFiles, setFirmwareFiles] = useState<string[]>([]);

  useEffect(() => {
    if (assets) {
      if (assets.length) {
        const extractFirmwareFiles = async () => {
          const files = await unzipDfuFiles(assets[0]);
          setFirmwareFiles(files.sort());
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
      <Text variant="h2">Select File for DFU:</Text>
      {firmwareFiles.length ? (
        <FlatList
          ItemSeparatorComponent={() => <Box h={sr(8)} />}
          data={firmwareFiles}
          renderItem={(i) => (
            <Center>
              <DfuFile fileInfo={getDfuFileInfo(i.item)} />
              <Button
                onPress={() => {
                  route.params.onDfuFileSelected(i.item);
                  navigation.goBack();
                }}
              >
                Select
              </Button>
            </Center>
          )}
          keyExtractor={(f) => f}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : (
        <Text bold>No files found in assets/dfu-files.zip!</Text>
      )}
    </Center>
  );
}

export default function (props: SelectDfuFileScreenProps) {
  return (
    <AppPage>
      <SelectDfuFilePage {...props} />
    </AppPage>
  );
}

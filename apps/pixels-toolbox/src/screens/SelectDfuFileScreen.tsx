import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAssets } from "expo-asset";
import React, { useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  ListRenderItemInfo,
  // eslint-disable-next-line import/namespace
} from "react-native";

import dfuFiles from "~/../assets/dfu-files.zip";
import AppPage from "~/components/AppPage";
import DfuFile from "~/components/DfuFile";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import unzipDfuFiles from "~/features/dfu/unzipDfuFiles";
import { type RootStackParamList } from "~/navigation";
import globalStyles, { sr } from "~/styles";

function SelectDfuFilePage() {
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

  const selectDfuFile = (dfuFilePath: string) => {
    navigation.navigate("Dfu", { dfuFilePath });
  };

  const renderDfuFile = (itemInfo: ListRenderItemInfo<string>) => {
    const dfuFilePath = itemInfo.item;
    return (
      <View style={styles.box} key={dfuFilePath}>
        <DfuFile fileInfo={getDfuFileInfo(dfuFilePath)} />
        <Spacer />
        <Button onPress={() => selectDfuFile(dfuFilePath)} title="Select" />
        <Spacer />
      </View>
    );
  };

  return (
    <>
      <Text style={styles.textBold}>Select File for DFU:</Text>
      <Spacer />
      {firmwareFiles.length ? (
        <View style={styles.containerScanList}>
          <FlatList
            ItemSeparatorComponent={Spacer}
            data={firmwareFiles}
            renderItem={renderDfuFile}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
      ) : (
        <Text style={styles.text}>No files found in assets/dfu-files.zip</Text>
      )}
    </>
  );
}

export default function () {
  return (
    <AppPage style={styles.container}>
      <SelectDfuFilePage />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  containerScanList: {
    alignItems: "center",
    justifyContent: "flex-start",
    margin: sr(10),
    flex: 1,
    flexGrow: 1,
  },
});

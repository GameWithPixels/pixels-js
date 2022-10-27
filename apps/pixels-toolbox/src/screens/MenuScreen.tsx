import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Constants from "expo-constants";
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  Platform,
  useWindowDimensions,
  // eslint-disable-next-line import/namespace
} from "react-native";

import AppPage from "~/components/AppPage";
import PixelInfoBox from "~/components/PixelInfoBox";
import Spacer from "~/components/Spacer";
import { type RootStackParamList } from "~/navigation";
import globalStyles, { sr } from "~/styles";
import usePixelScannerWithFocus from "~/usePixelScannerWithFocus";

function MenuPage() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Menu">>();
  const window = useWindowDimensions();
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus({
    sortedByName: true,
  });

  return (
    <>
      <Spacer />
      <View style={styles.box}>
        <Text
          style={styles.textBold}
        >{`Toolbox v${Constants.manifest?.version}`}</Text>
        <Spacer />
        <Button
          onPress={() => navigation.navigate("Connect")}
          title="Go to Connect"
        />
        <Spacer />
        <Button
          onPress={() => navigation.navigate("SelectDfuFile")}
          title="Go to DFU"
        />
        <Spacer />
        <Button
          onPress={() => navigation.navigate("Animations")}
          title="Go to Animations"
        />
        <Spacer />
        <Button
          onPress={() => navigation.navigate("Validation")}
          title="Go to Validation"
        />
        <Spacer />
        <Button
          onPress={() => navigation.navigate("Stats")}
          title="Go to Stats"
        />
        <Spacer />
        <Button onPress={() => navigation.navigate("Test")} title="TEST" />
        <Spacer />
      </View>
      <View style={styles.containerScanHeader}>
        <Text
          style={styles.textBold}
        >{`Scanned Pixels (${scannedPixels.length}):`}</Text>
        <Spacer />
        <Button
          onPress={() => scannerDispatch("clear")}
          title="Clear Scan List"
        />
      </View>
      <View style={styles.containerScanList}>
        {scannedPixels.length ? (
          <FlatList
            ItemSeparatorComponent={Spacer}
            data={scannedPixels}
            renderItem={(itemInfo) => (
              <View style={styles.box}>
                <PixelInfoBox pixel={itemInfo.item} />
              </View>
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        ) : (
          <Text style={styles.text}>No Pixel found so far...</Text>
        )}
      </View>
      {/* Footer showing app and system info */}
      <View style={styles.containerFooter}>
        <Text style={styles.textItalic}>
          {`Screen: ${Math.round(window.width)}` +
            `x${Math.round(window.height)} - ` +
            `OS: ${Platform.OS} ${Platform.Version}`}
        </Text>
      </View>
    </>
  );
}

export default function () {
  return (
    <AppPage style={styles.container}>
      <MenuPage />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  containerScanHeader: {
    margin: sr(20),
  },
  containerScanList: {
    alignItems: "center",
    justifyContent: "flex-start",
    margin: sr(10),
    flex: 1,
    flexGrow: 1,
  },
});

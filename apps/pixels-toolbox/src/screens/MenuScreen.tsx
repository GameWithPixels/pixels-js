import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Constants from "expo-constants";
import {
  IButtonProps,
  Box,
  Button,
  Center,
  FlatList,
  HStack,
  Text,
} from "native-base";
import { useState, useEffect } from "react";
import {
  Platform,
  useWindowDimensions,
  // eslint-disable-next-line import/namespace
} from "react-native";

import AppPage from "~/components/AppPage";
import PixelInfoBox from "~/components/PixelInfoBox";
import usePixelScannerWithFocus from "~/features/pixels/hooks/usePixelScannerWithFocus";
import { type RootStackParamList } from "~/navigation";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

const fwDate = new Date();

function EmojiButton(props: IButtonProps) {
  return (
    <Button
      size="xs"
      _text={{ fontSize: "xl" }}
      p="1%"
      variant="emoji"
      {...props}
    />
  );
}

function MenuPage() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Menu">>();
  useEffect(() => {
    navigation.setOptions({ title: `Toolbox v${Constants.manifest?.version}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const window = useWindowDimensions();
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus({
    sortedByName: true,
  });
  const [showInfo, setShowInfo] = useState(false);
  return (
    <>
      {/* Takes all available space except for footer (see after this Box) */}
      <Box flex={1} alignItems="center">
        <Button
          variant="solid"
          onPress={() => navigation.navigate("Validation")}
        >
          Go To Validation
        </Button>
        <Center flexDirection="row" mb="3%">
          <Text>Selected firmware:</Text>
          <Text italic>{toLocaleDateTimeString(fwDate)}</Text>
          <SmallButton
            ml="3%"
            onPress={() => navigation.navigate("SelectDfuFile")}
          >
            📂
          </SmallButton>
        </Center>
        <Center flexDirection="row" mb="3%">
          <Text
            variant="h2"
            mt="3%"
          >{`Scanned Pixels (${scannedPixels.length}):`}</Text>
          <SmallButton ml="3%" onPress={() => scannerDispatch("clear")}>
            🔄
          </SmallButton>
          <SmallButton ml="3%" onPress={() => setShowInfo((b) => !b)}>
            ℹ️
          </SmallButton>
        </Center>
        {scannedPixels.length ? (
          <FlatList
            w="90%"
            data={Array(10)
              .fill(scannedPixels[0])
              .map((p, i) => {
                return { ...p, pixelId: i.toString() };
              })}
            renderItem={(itemInfo) => (
              <PixelInfoBox
                pixel={itemInfo.item}
                showInfo={showInfo}
                onConnectPressed={() => {}}
                onDfuPressed={() => {}}
              />
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            ItemSeparatorComponent={() => <Box h="2%" />}
          />
        ) : (
          <Text italic>No Pixel found so far...</Text>
        )}
      </Box>
      {/* Footer showing app and system info */}
      <Center mt="2%">
        <Text italic>
          {`Screen: ${Math.round(window.width)}` +
            `x${Math.round(window.height)} - ` +
            `OS: ${Platform.OS} ${Platform.Version}`}
        </Text>
      </Center>
    </>
  );
}

export default function () {
  return (
    <AppPage>
      <MenuPage />
    </AppPage>
  );
}

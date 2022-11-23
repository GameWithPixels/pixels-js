import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Constants from "expo-constants";
import {
  Actionsheet,
  Box,
  Button,
  Center,
  FlatList,
  HamburgerIcon,
  HStack,
  Menu,
  Pressable,
  Text,
  useDisclose,
} from "native-base";
import { useState, useEffect } from "react";
import {
  Platform,
  RefreshControl,
  useWindowDimensions,
  // eslint-disable-next-line import/namespace
} from "react-native";

import { useAppSelector } from "~/app/hooks";
import AppPage from "~/components/AppPage";
import EmojiButton from "~/components/EmojiButton";
import PixelConnectCard from "~/components/PixelConnectCard";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import usePixelScannerWithFocus from "~/features/pixels/hooks/useFocusPixelScannerAsync";
import { type RootStackParamList } from "~/navigation";
import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function HeaderComponent({ title }: { title: string }) {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Home">>();
  return (
    <HStack width="100%" height="100%" alignItems="center">
      <Center position="absolute" top={0} width={sr(40)} height={sr(40)}>
        <Menu
          // TODO see variant "cardWithBorder"
          borderRadius="xl"
          borderWidth="1"
          _dark={{
            backgroundColor: "coolGray.800",
            borderColor: "warmGray.500",
          }}
          _light={{
            backgroundColor: "warmGray.100",
            borderColor: "coolGray.400",
          }}
          trigger={(triggerProps) => {
            return (
              <Pressable
                accessibilityLabel="More options menu"
                width="100%"
                height="100%"
                {...triggerProps}
              >
                <Center width="100%" height="100%">
                  <HamburgerIcon />
                </Center>
              </Pressable>
            );
          }}
        >
          <Menu.Item onPress={() => navigation.navigate("Validation")}>
            Factory Validation
          </Menu.Item>
          {/* TODO <Menu.Item onPress={() => navigation.navigate("Roll")}>
            Roll Screen
          </Menu.Item> */}
        </Menu>
      </Center>
      <Center width="100%" height="100%">
        <Text variant="h2">{title}</Text>
      </Center>
    </HStack>
  );
}

function HomePage() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Home">>();
  useEffect(() => {
    navigation.setOptions({
      title: `Toolbox v${Constants.manifest?.version}`,
      headerTitle: ({ children }) => <HeaderComponent title={children} />,
      headerStyle: {
        height: sr(40) + Constants.statusBarHeight,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const window = useWindowDimensions();
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus({
    sortedByName: true,
  });
  const [showInfo, setShowInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { dfuFiles } = useAppSelector((state) => state.dfuFiles);
  const applyAllActionSheet = useDisclose();
  return (
    <>
      {/* Takes all available space except for footer (see footer below this Box) */}
      <Box flex={1} alignItems="center" left="2%" width="96%">
        <Button
          py={sr(10)}
          size="lg"
          _text={{
            fontSize: "2xl",
            fontWeight: "bold",
          }}
          onPress={() => navigation.navigate("Validation")}
        >
          Validation
        </Button>
        <Box width="100%" alignItems="center" flexDir="row">
          <EmojiButton
            mr={sr(5)}
            onPress={() => navigation.navigate("SelectDfuFiles")}
          >
            📁
          </EmojiButton>
          <Center width="100%" alignItems="baseline">
            <Text>
              <Text>Selected Firmware: </Text>
              <Text italic>
                {dfuFiles
                  ? dfuFiles
                      .map((p) => getDfuFileInfo(p).type ?? "unknown")
                      .join(", ")
                  : "unavailable"}
              </Text>
            </Text>
            {dfuFiles?.length > 0 && (
              <Text>
                {toLocaleDateTimeString(
                  getDfuFileInfo(dfuFiles[0]).date ?? new Date(0)
                )}
              </Text>
            )}
          </Center>
        </Box>
        <Center flexDir="row" my={sr(8)} width="100%" alignItems="baseline">
          <EmojiButton onPress={() => setShowInfo((b) => !b)}>ℹ️</EmojiButton>
          <Center flex={1}>
            <Text variant="h2">{`${scannedPixels.length} Pixels`}</Text>
          </Center>
          <EmojiButton onPress={applyAllActionSheet.onOpen}>⚙️</EmojiButton>
        </Center>
        {scannedPixels.length ? (
          <FlatList
            width="100%"
            data={scannedPixels}
            renderItem={(itemInfo) => (
              <PixelConnectCard
                scannedPixel={itemInfo.item}
                showInfo={showInfo}
              />
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            ItemSeparatorComponent={() => <Box h={sr(8)} />}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  scannerDispatch("clear");
                  setTimeout(() => {
                    // Wait of 1 second before stopping the refresh animation
                    setRefreshing(false);
                  }, 1000);
                }}
              />
            }
          />
        ) : (
          <Text italic>No Pixel found so far...</Text>
        )}
      </Box>
      {/* Footer showing app and system info */}
      <Center mt={sr(8)}>
        <Text italic>
          {`Screen: ${Math.round(window.width)}` +
            `x${Math.round(window.height)} - ` +
            `OS: ${Platform.OS} ${Platform.Version}`}
        </Text>
      </Center>
      {/* Action sheet with list of operations to run on all Pixels */}
      <Actionsheet
        isOpen={applyAllActionSheet.isOpen}
        onClose={applyAllActionSheet.onClose}
      >
        <Actionsheet.Content>
          <Text variant="h3">Run On All Pixels:</Text>
          <Actionsheet.Item>Connect</Actionsheet.Item>
          <Actionsheet.Item>Disconnect</Actionsheet.Item>
          <Actionsheet.Item>Update Profile</Actionsheet.Item>
          <Actionsheet.Item>Update Bootloader & Firmware</Actionsheet.Item>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

export default function () {
  return (
    <AppPage>
      <HomePage />
    </AppPage>
  );
}

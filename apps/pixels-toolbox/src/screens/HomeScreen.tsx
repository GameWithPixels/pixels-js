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
  Link,
  Menu,
  Pressable,
  Text,
  useDisclose,
} from "native-base";
import { useState, useEffect, useCallback } from "react";
import {
  Platform,
  RefreshControl,
  useWindowDimensions,
  // eslint-disable-next-line import/namespace
} from "react-native";

import { useAppSelector } from "~/app/hooks";
import AppPage from "~/components/AppPage";
import EmojiButton from "~/components/EmojiButton";
import PixelSwipeableCard from "~/components/PixelSwipeableCard";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import PixelDispatcher, {
  PixelDispatcherAction,
} from "~/features/pixels/PixelDispatcher";
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
                  <HamburgerIcon size="100%" />
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
  const [pixelsMap, setPixelsMap] = useState(
    () => new Map<number, PixelDispatcher>()
  );
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { dfuFiles } = useAppSelector((state) => state.dfuFiles);
  const applyAllDisclose = useDisclose();
  useEffect(() => {
    setPixelsMap((pixelsMap) => {
      const newMap = new Map<number, PixelDispatcher>();
      scannedPixels.forEach((p) => {
        const pd = pixelsMap.get(p.pixelId);
        pd?.updateScannedPixel(p);
        newMap.set(p.pixelId, pd ?? new PixelDispatcher(p));
      });
      return newMap;
    });
  }, [scannedPixels]);
  const dispatchAll = useCallback(
    (action: PixelDispatcherAction) =>
      pixelsMap.forEach((pd) => pd.dispatch(action)),
    [pixelsMap]
  );
  return (
    <>
      {/* Takes all available space except for footer (see footer below this Box) */}
      <Box flex={1} alignItems="center" left="2%" width="96%">
        <Button
          mt={sr(5)}
          mb={sr(20)}
          size="lg"
          _text={{
            fontSize: "xl",
          }}
          onPress={() => navigation.navigate("Validation")}
        >
          Validation
        </Button>
        <Link onPress={() => navigation.navigate("SelectDfuFiles")}>
          {dfuFiles?.length
            ? `${dfuFiles
                .map((p) => getDfuFileInfo(p).type ?? "unknown")
                .join(", ")}: ${toLocaleDateTimeString(
                getDfuFileInfo(dfuFiles[0]).date ?? new Date(0)
              )}`
            : "Select firmware"}
        </Link>
        <Center flexDir="row" my={sr(8)} width="100%" alignItems="baseline">
          <EmojiButton onPress={() => setShowMoreInfo((b) => !b)}>
            ℹ️
          </EmojiButton>
          <Center flex={1}>
            <Text variant="h2">{`${pixelsMap.size} Pixels`}</Text>
          </Center>
          <EmojiButton onPress={applyAllDisclose.onOpen}>⚙️</EmojiButton>
        </Center>
        {pixelsMap.size ? (
          <FlatList
            width="100%"
            data={[...pixelsMap.values()].sort((p) => p.pixelId)}
            renderItem={(itemInfo) => (
              <PixelSwipeableCard
                pixelDispatcher={itemInfo.item}
                moreInfo={showMoreInfo}
                swipeableItemsWidth={sr("25%")}
              />
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            ItemSeparatorComponent={() => <Box height={sr(8)} />}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  setPixelsMap((pixelsMap) => {
                    const connected = [...pixelsMap.entries()].filter(
                      (e) => e[1].status !== "disconnected"
                    );
                    return new Map(connected);
                  });
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
        isOpen={applyAllDisclose.isOpen}
        onClose={applyAllDisclose.onClose}
      >
        <Actionsheet.Content>
          <Text variant="h3">Run On All Pixels:</Text>
          <Actionsheet.Item
            onPress={() => {
              dispatchAll("connect");
              applyAllDisclose.onClose();
            }}
          >
            Connect
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              dispatchAll("disconnect");
              applyAllDisclose.onClose();
            }}
          >
            Disconnect
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              dispatchAll("blink");
              applyAllDisclose.onClose();
            }}
          >
            Blink
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              dispatchAll("updateProfile");
              applyAllDisclose.onClose();
            }}
          >
            Update Profile
          </Actionsheet.Item>
          {/* <Actionsheet.Item
            onPress={() => {
              dispatchAll("updateFirmware");
              applyAllActionSheet.onClose();
            }}
          >
            Update Bootloader & Firmware
          </Actionsheet.Item> */}
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

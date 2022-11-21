import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Constants from "expo-constants";
import {
  Actionsheet,
  Box,
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

import AppPage from "~/components/AppPage";
import EmojiButton from "~/components/EmojiButton";
import PixelConnectCard from "~/components/PixelConnectCard";
import usePixelScannerWithFocus from "~/features/pixels/hooks/useFocusPixelScannerAsync";
import { type RootStackParamList } from "~/navigation";
import { sr } from "~/styles";

function HeaderComponent({ title }: { title: string }) {
  return (
    <HStack width="100%" height="100%" alignItems="center">
      <Center position="absolute" top={0} height="100%">
        <Menu
          trigger={(triggerProps) => {
            return (
              <Pressable
                accessibilityLabel="More options menu"
                {...triggerProps}
              >
                <HamburgerIcon />
              </Pressable>
            );
          }}
        >
          <Menu.Item onPress={() => console.log("Validation!")}>
            Validation
          </Menu.Item>
          <Menu.Item onPress={() => console.log("Roll!")}>
            Roll Screen
          </Menu.Item>
          <Menu.Item onPress={() => console.log("Firmware!")}>
            Select Firmware
          </Menu.Item>
        </Menu>
      </Center>
      <Center width="100%" height="100%">
        <Text variant="h2">{title}</Text>
      </Center>
    </HStack>
  );
}

function MenuPage() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Menu">>();
  useEffect(() => {
    navigation.setOptions({
      title: `Toolbox v${Constants.manifest?.version}`,
      headerTitle: ({ children }) => <HeaderComponent title={children} />,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const window = useWindowDimensions();
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus({
    sortedByName: true,
  });
  const [showInfo, setShowInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const applyAllActionSheet = useDisclose();
  return (
    <>
      {/* Takes all available space except for footer (see footer below this Box) */}
      <Box flex={1} alignItems="center" left="2%" width="96%">
        <Center flexDir="row" mb={sr(8)} width="100%" alignItems="baseline">
          <EmojiButton onPress={() => setShowInfo((b) => !b)}>ℹ️</EmojiButton>
          <Center flex={1}>
            <Text variant="h2">{`${scannedPixels.length} Pixels`}</Text>
          </Center>
          <EmojiButton onPress={applyAllActionSheet.onOpen}>⚙️</EmojiButton>
        </Center>
        {scannedPixels.length ? (
          <FlatList
            width="100%"
            data={Array(10)
              .fill(scannedPixels[0])
              .map((p, i) => {
                return { ...p, pixelId: i.toString() };
              })}
            renderItem={(itemInfo) => (
              <PixelConnectCard pixel={itemInfo.item} showInfo={showInfo} />
            )}
            keyExtractor={(p) => p.pixelId.toString()}
            ItemSeparatorComponent={() => <Box h={sr(8)} />}
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
      <Actionsheet
        isOpen={applyAllActionSheet.isOpen}
        onClose={applyAllActionSheet.onClose}
      >
        <Actionsheet.Content>
          <Text variant="h3">Operation To Run On All Pixels</Text>
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
      <MenuPage />
    </AppPage>
  );
}

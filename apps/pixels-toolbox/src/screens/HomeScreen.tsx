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
  Link,
  Menu,
  Pressable,
  Text,
  useDisclose,
} from "native-base";
import { useState, useEffect, useCallback, memo } from "react";
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
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import { PixelDispatcherAction } from "~/features/pixels/PixelDispatcher";
import useFocusPixelDispatcherScanner from "~/features/pixels/hooks/useFocusPixelDispatcherScanner";
import { type RootStackParamList } from "~/navigation";
import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

function Header({ title }: { title: string }) {
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

function PixelsList() {
  // Scanning
  const [pixelDispatchers, scannerDispatch, lastError] =
    useFocusPixelDispatcherScanner();
  useErrorWithHandler(lastError);

  // Actions dispatched to all Pixels
  const dispatchAllDisclose = useDisclose();
  const dispatchAll = useCallback(
    (action: PixelDispatcherAction) =>
      pixelDispatchers.forEach((pd) => pd.dispatch(action)),
    [pixelDispatchers]
  );

  // Values for UI
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  return (
    <>
      <Center flexDir="row" my={sr(8)} width="100%" alignItems="baseline">
        <EmojiButton onPress={() => setShowMoreInfo((b) => !b)}>ℹ️</EmojiButton>
        <Center flex={1}>
          <Text variant="h2">{`${pixelDispatchers.length} Pixels`}</Text>
        </Center>
        <EmojiButton onPress={dispatchAllDisclose.onOpen}>⚙️</EmojiButton>
      </Center>
      {pixelDispatchers.length ? (
        <FlatList
          width="100%"
          data={pixelDispatchers}
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
        <Text italic>No Pixels found so far...</Text>
      )}
      <DispatchAllActionsheetMemo
        dispatch={dispatchAll}
        isOpen={dispatchAllDisclose.isOpen}
        onClose={dispatchAllDisclose.onClose}
      />
    </>
  );
}

// Action sheet with list of operations to dispatch to all Pixels
function DispatchAllActionsheet({
  dispatch,
  isOpen,
  onClose,
}: {
  dispatch: (action: PixelDispatcherAction) => void;
  isOpen: boolean;
  onClose?: () => void;
}) {
  const apply = useCallback(
    (action: PixelDispatcherAction) => {
      dispatch(action);
      onClose?.();
    },
    [dispatch, onClose]
  );
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <Actionsheet.Content>
        <Text variant="h3">Run On All Pixels:</Text>
        <Actionsheet.Item onPress={() => apply("connect")}>
          Connect
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("disconnect")}>
          Disconnect
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("blink")}>
          Blink
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("updateProfile")}>
          Update Profile
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("queueFirmwareUpdate")}>
          Update Bootloader & Firmware
        </Actionsheet.Item>
      </Actionsheet.Content>
    </Actionsheet>
  );
}

const HeaderMemo = memo(Header);
const DispatchAllActionsheetMemo = memo(DispatchAllActionsheet);

function HomePage() {
  // Setup page options
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Home">>();
  useEffect(() => {
    navigation.setOptions({
      title: `Toolbox v${Constants.manifest?.version}`,
      headerTitle: ({ children }) => <HeaderMemo title={children} />,
      headerStyle: {
        height: sr(40) + Constants.statusBarHeight,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DFU file
  const { dfuFiles } = useAppSelector((state) => state.dfuFiles);
  const [selectedFwLabel, setSelectedFwLabel] = useState<string>();
  useEffect(() => {
    if (dfuFiles?.length) {
      setSelectedFwLabel(
        `${dfuFiles
          .map((p) => getDfuFileInfo(p).type ?? "unknown")
          .join(", ")}: ${toLocaleDateTimeString(
          getDfuFileInfo(dfuFiles[0]).date ?? new Date(0)
        )}`
      );
    } else {
      setSelectedFwLabel(undefined);
    }
  }, [dfuFiles]);

  // Values for UI
  const window = useWindowDimensions();
  return (
    <>
      {/* Takes all available space except for footer (see footer below this Box) */}
      <Box flex={1} alignItems="center" left="2%" width="96%">
        <Text pl="7%" mb={sr(10)} alignSelf="flex-start">
          ↖️
          <Text italic> Open Menu To Go To Validation</Text>
        </Text>
        <Link onPress={() => navigation.navigate("SelectDfuFiles")}>
          {selectedFwLabel ?? "Tap To Select firmware"}
        </Link>
        <PixelsList />
      </Box>
      {/* Footer showing app and system info */}
      <Center mt={sr(8)}>
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
      <HomePage />
    </AppPage>
  );
}

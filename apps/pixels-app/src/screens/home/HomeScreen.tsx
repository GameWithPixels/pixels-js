import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  PixelAppPage,
  Toggle,
  PairedPixelInfoComponent,
  ScannedPixelInfoComponent,
  SquarePairedPixelInfo,
  sr,
} from "@systemic-games/react-native-pixels-components";
import {
  ScannedPixel,
  usePixelScanner,
} from "@systemic-games/react-native-pixels-connect";
import {
  Box,
  Center,
  HStack,
  ScrollView,
  Spacer,
  Text,
  VStack,
} from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { RefreshControl } from "react-native";

import {
  useAppPairedDice,
  useAppProfiles,
  useAppUpdatePairedDie,
} from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";
import { HomeScreenProps } from "~/navigation";

function PairedPixelList({
  navigation,
  pairedPixels,
}: {
  navigation: HomeScreenProps["navigation"];
  pairedPixels: ScannedPixel[];
}) {
  const pairedDice = useAppPairedDice();
  const profiles = useAppProfiles();
  const onPress = React.useCallback(
    (pixel: ScannedPixel) => {
      navigation.navigate("PixelDetails", { systemId: pixel.systemId });
    },
    [navigation]
  );
  const [pixelsDisplay, switchPixelsDisplay] = React.useState(false);
  return (
    <Center width="100%">
      <VStack space={2} w="100%">
        <HStack alignItems="center">
          <Box paddingLeft={2} paddingRight={2} roundedTop="lg">
            <Text bold fontSize="md" letterSpacing="xl">
              Paired Dice:
            </Text>
          </Box>
          <Spacer />
          {/* Switch scanned display toggle */}
          <Toggle
            space={0}
            onValueChange={() => {
              switchPixelsDisplay(!pixelsDisplay);
            }}
            isChecked={pixelsDisplay}
            icon={<AntDesign name="bars" size={24} color="white" />}
          />
          <AntDesign name="appstore-o" size={22} color="white" />
        </HStack>
        <Box rounded="md" p={2} bg="gray.700" width="100%">
          {!pairedPixels.length ? (
            <Text>No dice paired yet!</Text>
          ) : pixelsDisplay === false ? (
            <VStack w="100%">
              {pairedPixels.map((pixel) => {
                const uuid = pairedDice.find(
                  (d) => d.systemId === pixel.systemId
                )?.profileUuid;
                const profile = profiles.find((p) => p.uuid === uuid);
                return (
                  <Box p={1} key={pixel.pixelId} width="100%">
                    <PairedPixelInfoComponent
                      pixel={pixel}
                      profileName={profile?.name}
                      onPress={() => onPress(pixel)}
                      dieRenderer={() => {
                        return (
                          <DieRenderer
                            renderData={
                              profile ? getCachedDataSet(profile) : undefined
                            }
                          />
                        );
                      }}
                    />
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <Center>
              <HStack flexWrap="wrap" justifyContent="flex-start" px={4}>
                {pairedPixels.map((pixel) => (
                  <Box p={1} alignSelf="center" key={pixel.pixelId} w="50%">
                    <SquarePairedPixelInfo
                      w="100%"
                      h={sr(200)}
                      pixel={pixel}
                      onPress={() => onPress(pixel)}
                      dieRenderer={() => <DieRenderer />}
                    />
                  </Box>
                ))}
              </HStack>
            </Center>
          )}
        </Box>
      </VStack>
    </Center>
  );
}

function NearbyPixelsList({
  unpairedPixels,
}: {
  unpairedPixels: ScannedPixel[];
}) {
  const [hideNearbyPixels, setHideNearbyPixels] = React.useState(false);
  const updatePairedDie = useAppUpdatePairedDie();
  return (
    <Center>
      <VStack space={2} w="100%">
        <HStack alignItems="center">
          <Box paddingLeft={2} paddingRight={2} roundedTop="lg">
            <Text bold fontSize="md" letterSpacing="xl">
              Nearby Dice:
            </Text>
          </Box>
          <Spacer />
          {/* Hide nearby Pixels toggle */}
          <HStack space={1} alignItems="center">
            <Toggle
              title="Show"
              onValueChange={() => {
                setHideNearbyPixels(!hideNearbyPixels);
              }}
              isChecked={hideNearbyPixels}
              value={hideNearbyPixels}
            />
            <Text>Hide</Text>
          </HStack>
        </HStack>

        <Box rounded="md" p={2} bg="gray.700" alignItems="center" w="100%">
          {!hideNearbyPixels && (
            <VStack w="100%">
              {unpairedPixels.map((pixel) => (
                <Box p={1} key={pixel.pixelId} w="100%">
                  <ScannedPixelInfoComponent
                    pixel={pixel}
                    onPress={() =>
                      updatePairedDie({ systemId: pixel.systemId })
                    }
                    dieRenderer={() => <DieRenderer />}
                  />
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Center>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [scannedPixels, scannerDispatch] = usePixelScanner();

  useFocusEffect(
    React.useCallback(() => {
      setTimeout(() => scannerDispatch("start"), 1000); //TODO remove this delay
      return () => {
        scannerDispatch("stop");
      };
    }, [scannerDispatch])
  );

  const pairedDice = useAppPairedDice();
  const unpairedPixels = React.useMemo(
    () =>
      scannedPixels.filter((p) =>
        pairedDice.every((d) => d.systemId !== p.systemId)
      ),
    [pairedDice, scannedPixels]
  );
  const pairedPixels = React.useMemo(
    () =>
      scannedPixels.filter(
        (p) => pairedDice.findIndex((d) => d.systemId === p.systemId) >= 0
      ),
    [pairedDice, scannedPixels]
  );

  const [refreshing, setRefreshing] = React.useState(false);

  // Example to use and see the refresh function
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <PixelAppPage>
      <ScrollView
        height="100%"
        width="100%"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack space={4}>
          <PairedPixelList
            navigation={navigation}
            pairedPixels={pairedPixels}
          />
          <NearbyPixelsList unpairedPixels={unpairedPixels} />
        </VStack>
      </ScrollView>
    </PixelAppPage>
  );
}

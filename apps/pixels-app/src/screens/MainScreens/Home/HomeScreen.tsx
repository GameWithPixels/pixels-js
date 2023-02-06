import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  PixelAppPage,
  Toggle,
  PairedPixelInfoComponent,
  ScannedPixelInfoComponent,
  SquarePairedPixelInfo,
} from "@systemic-games/react-native-pixels-components";
import {
  AnimationPreset,
  ScannedPixel,
  usePixelScanner,
  AnimationBits,
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

import { sr } from "~/Utils";
import DieRenderer from "~/features/render3d/DieRenderer";
import { DiceListScreenProps } from "~/navigation";

interface PairedPixelListProps {
  pairedPixels: ScannedPixel[];
  onPress: (pixel: ScannedPixel) => void;
  dieRenderer: (anim: AnimationPreset, bits: AnimationBits) => React.ReactNode;
}

function PairedPixelList({
  pairedPixels,
  onPress,
  dieRenderer,
}: PairedPixelListProps) {
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
              {pairedPixels.map((pixel) => (
                <Box p={1} key={pixel.pixelId} width="100%">
                  <PairedPixelInfoComponent
                    pixel={pixel}
                    onPress={() => onPress(pixel)}
                    dieRenderer={dieRenderer}
                  />
                </Box>
              ))}
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
                      dieRenderer={dieRenderer}
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

interface NearbyPixelListProps {
  scannedPixels: ScannedPixel[];
  pairedPixels: ScannedPixel[];
  onPixelPaired: (pixel: ScannedPixel) => void;
  dieRenderer: (anim: AnimationPreset, bits: AnimationBits) => React.ReactNode;
}

function NearbyPixelsList({
  scannedPixels,
  pairedPixels,
  onPixelPaired,
  dieRenderer,
}: NearbyPixelListProps) {
  const [hideNearbyPixels, setHideNearbyPixels] = React.useState(false);
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
              {scannedPixels
                .filter((p) =>
                  pairedPixels.every((pp) => pp.pixelId !== p.pixelId)
                )
                .map((pixel) => (
                  <Box p={1} key={pixel.pixelId} w="100%">
                    <ScannedPixelInfoComponent
                      pixel={pixel}
                      onPress={() => onPixelPaired(pixel)}
                      dieRenderer={dieRenderer}
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

export default function HomeScreen({ navigation }: DiceListScreenProps) {
  const [scannedPixels, scannerDispatch] = usePixelScanner();

  useFocusEffect(
    React.useCallback(() => {
      setTimeout(() => scannerDispatch("start"), 1000);
      return () => {
        scannerDispatch("stop");
      };
    }, [scannerDispatch])
  );

  const [pairedPixels, setPairedPixels] = React.useState<ScannedPixel[]>([]);
  const addPairedPixel = React.useCallback(
    (pixel: ScannedPixel) =>
      setPairedPixels((pairedPixels) => {
        if (pairedPixels.every((pp) => pp.pixelId !== pixel.pixelId)) {
          return [...pairedPixels, pixel];
        } else {
          return pairedPixels;
        }
      }),
    []
  );

  const dieRenderer = React.useCallback(
    (animation: AnimationPreset, bits: AnimationBits) => {
      return (
        <DieRenderer
          animationData={{ animations: animation, animationBits: bits }}
        />
      );
    },
    []
  );

  const [refreshing, setRefreshing] = React.useState(false);

  //Example to use and see the refresh function
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
          {/* Paired pixels list */}
          <PairedPixelList
            pairedPixels={pairedPixels}
            onPress={(pixel) => {
              navigation.navigate("PixelDetails", { systemId: pixel.systemId });
            }}
            dieRenderer={dieRenderer}
          />
          {/* Nearby pixels list */}
          <NearbyPixelsList
            pairedPixels={pairedPixels}
            scannedPixels={scannedPixels}
            onPixelPaired={addPairedPixel}
            dieRenderer={dieRenderer}
          />
        </VStack>
      </ScrollView>
    </PixelAppPage>
  );
}

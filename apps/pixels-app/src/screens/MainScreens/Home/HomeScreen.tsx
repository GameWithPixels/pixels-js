import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  AnimationRainbow,
  Constants,
} from "@systemic-games/pixels-core-animation";
import {
  PxAppPage,
  PixelTheme,
  Toggle,
  createPixelTheme,
  PairedPixelInfoComponent,
  ScannedPixelInfoComponent,
  SquarePairedPixelInfo,
} from "@systemic-games/react-native-pixels-components";
import {
  ScannedPixel,
  initializeBle,
  shutdownBle,
  usePixelScanner,
} from "@systemic-games/react-native-pixels-connect";
import { Box, Center, HStack, Spacer, Text, VStack } from "native-base";
import React, { useEffect } from "react";

import { HomeScreenStackParamList } from "~/Navigation";
import { sr } from "~/Utils";
import DieRenderer from "~/features/render3d/DieRenderer";

// import { useAppDispatch, useAppSelector } from "~/app/hooks";
// import { setDarkMode, setLightMode } from "~/features/themeModeSlice";

// function ReduxExample() {
//   const appDispatch = useAppDispatch();
//   const { themeMode } = useAppSelector((state) => state.themeMode);
//   return (
//     <HStack>
//       <Text>{themeMode}</Text>
//       <Button onPress={() => appDispatch(setLightMode())}>Light</Button>
//       <Button onPress={() => appDispatch(setDarkMode())}>Dark</Button>
//     </HStack>
//   );
// }

const paleBluePixelThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#1b94ff",
    "100": "#0081f2",
    "200": "#006cca",
    "300": "#0256a0",
    "400": "#024178",
    "500": "#04345e",
    "600": "#062846",
    "700": "#051b2e",
    "800": "#040f18",
    "900": "#010204",
  },
};

const pairedPixelsinfo: ScannedPixel[] = [];
/*const date = new Date();
const scannedPixelsinfo: ScannedPixel[] = [
  {
    name: "John",
    rssi: -60,
    batteryLevel: 0.85,
    ledCount: 20,
    firmwareDate: date.toDateString(),
    profileName: "Rainbow",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
    pixelId: 123364872364,
  },
  {
    name: "Franck",
    rssi: -54,
    batteryLevel: 0.49,
    ledCount: 8,
    firmwareDate: date.toDateString(),
    profileName: "Custom",
    imageRequirePath: require("~/../assets/YellowDice.png"),
    pixelId: 198273918,
  },
  {
    name: "Julie",
    rssi: -45,
    batteryLevel: 0.15,
    ledCount: 12,
    firmwareDate: date.toDateString(),
    profileName: "Speak Numbers 123412341234",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
    pixelId: 983479238,
  },
  {
    name: "Alice",
    rssi: -25,
    batteryLevel: 0.9,
    ledCount: 10,
    firmwareDate: date.toDateString(),
    profileName: "Red To Blue",
    imageRequirePath: require("~/../assets/BlueDice.png"),
    pixelId: 73647812634,
  },
];*/

interface PairedPixelListProps {
  pairedPixels: ScannedPixel[];
  navigation: any;
}
function PairedPixelList({ pairedPixels, navigation }: PairedPixelListProps) {
  const [PixelsDisplay, SwitchPixelsDisplay] = React.useState(false);
  const [anim] = React.useState(() => {
    const anim = new AnimationRainbow();
    anim.duration = 10000;
    anim.count = 1;
    anim.traveling = true;
    anim.faceMask = Constants.faceMaskAllLEDs;
    return anim;
  });
  return (
    <Center width="100%">
      <VStack space={2} w="100%">
        <Box h={300} w={300}>
          <DieRenderer animation={anim} />
        </Box>
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
            onToggle={() => {
              SwitchPixelsDisplay(!PixelsDisplay);
            }}
            isChecked={PixelsDisplay}
            icon={<AntDesign name="bars" size={24} color="white" />}
          />
          <AntDesign name="appstore-o" size={22} color="white" />
        </HStack>
        <Box rounded="md" p={2} bg="gray.700" width="100%">
          {pairedPixels.length < 1 ? (
            <Text> No dice paired yet!</Text>
          ) : PixelsDisplay === false ? (
            <VStack w="100%">
              {pairedPixels.map((pixelInfo) => (
                <Box p={1} key={pixelInfo.pixelId} width="100%">
                  <PairedPixelInfoComponent pixel={pixelInfo} />
                </Box>
              ))}
            </VStack>
          ) : (
            <Center>
              <HStack flexWrap="wrap" justifyContent="flex-start" px={4}>
                {pairedPixels.map((pixelInfo) => (
                  <Box p={1} alignSelf="center" key={pixelInfo.pixelId} w="50%">
                    <SquarePairedPixelInfo
                      w="100%"
                      h={sr(200)}
                      pixel={pixelInfo}
                      onPress={() => {
                        navigation.navigate("Pixel Details", pixelInfo);
                      }}
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
  setPairedPixels: (pixels: ScannedPixel[]) => void;
  // onPress?: (() => void) | null | undefined; // any function to execute when pressing a pixel info
}

function NearbyPixelsList({
  scannedPixels,
  pairedPixels,
  setPairedPixels,
}: NearbyPixelListProps) {
  const [hideNearbyPixels, SetHideNearbyPixels] = React.useState(false);
  function addToPaired(pixelToAdd: ScannedPixel) {
    const pixelName = pixelToAdd.name;
    scannedPixels.splice(
      scannedPixels.findIndex((pixel) => {
        return pixel.name === pixelName;
      }),
      1
    );
    setPairedPixels([...pairedPixels, pixelToAdd]);
  }
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
              onToggle={() => {
                SetHideNearbyPixels(!hideNearbyPixels);
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
              {scannedPixels.map((pixelInfo) => (
                <Box p={1} key={pixelInfo.pixelId} w="100%">
                  <ScannedPixelInfoComponent
                    pixel={pixelInfo}
                    onPress={() => {
                      addToPaired(pixelInfo);
                    }}
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

const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);
export default function HomeScreen() {
  const [pairedPixels, SetPairedPixels] = React.useState(pairedPixelsinfo);
  const [scannedPixels, scannerDispatch] = usePixelScanner();
  const navigation =
    useNavigation<StackNavigationProp<HomeScreenStackParamList>>();

  useEffect(() => {
    console.log("GOOOOO");
    initializeBle().catch(console.error);
    scannerDispatch("start");
    return () => {
      shutdownBle().catch(console.error);
    };
  }, [scannerDispatch]);

  return (
    <PxAppPage theme={paleBluePixelTheme} scrollable>
      {/* //Paired pixels list */}
      <VStack space={4}>
        <PairedPixelList pairedPixels={pairedPixels} navigation={navigation} />
        {/* //Nearby pixels list */}
        <NearbyPixelsList
          pairedPixels={pairedPixels}
          scannedPixels={scannedPixels}
          setPairedPixels={SetPairedPixels}
        />
        {/* <FaceMask diceFaces={20} />
        <ReduxExample />
        <ReduxExample />
        <LightingStyleSelection /> */}
      </VStack>
    </PxAppPage>
  );
}

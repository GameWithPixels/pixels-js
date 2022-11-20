import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  PxAppPage,
  PixelTheme,
  Toggle,
  createPixelTheme,
  PairedPixelInfoComponent,
  PixelInfo,
  ScannedPixelInfoComponent,
  SquarePairedPixelInfo,
} from "@systemic-games/react-native-pixels-components";
import { Box, Center, HStack, Spacer, Text, VStack } from "native-base";
import React from "react";

import { HomeScreenStackParamList } from "~/Navigation";
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

const pairedPixelsinfo: PixelInfo[] = [
  // {
  //   name: "Bob",
  //   rssi: -60,
  //   batteryLevel: 0.85,
  //   ledCount: 20,
  //   firmwareDate: new Date(),
  //   profileName: "Rainbow",
  // },
  // {
  //   name: "Sarah",
  //   rssi: -54,
  //   batteryLevel: 0.49,
  //   ledCount: 8,
  //   firmwareDate: new Date(),
  //   profileName: "Custom",
  // },
  // {
  //   name: "Luke",
  //   rssi: -45,
  //   batteryLevel: 0.15,
  //   ledCount: 12,
  //   firmwareDate: new Date(),
  //   profileName: "Speak Numbers",
  // },
  // {
  //   name: "Henry",
  //   rssi: -25,
  //   batteryLevel: 0.9,
  //   ledCount: 10,
  //   firmwareDate: new Date(),
  //   profileName: "Speak Numbers",
  // },
];

const scannedPixelsinfo: PixelInfo[] = [
  {
    name: "John",
    rssi: -60,
    batteryLevel: 0.85,
    ledCount: 20,
    firmwareDate: new Date(),
    profileName: "Rainbow",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
    pixelId: 123364872364,
  },
  {
    name: "Franck",
    rssi: -54,
    batteryLevel: 0.49,
    ledCount: 8,
    firmwareDate: new Date(),
    profileName: "Custom",
    imageRequirePath: require("~/../assets/YellowDice.png"),
    pixelId: 198273918,
  },
  {
    name: "Julie",
    rssi: -45,
    batteryLevel: 0.15,
    ledCount: 12,
    firmwareDate: new Date(),
    profileName: "Speak Numbers 123412341234",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
    pixelId: 983479238,
  },
  {
    name: "Alice",
    rssi: -25,
    batteryLevel: 0.9,
    ledCount: 10,
    firmwareDate: new Date(),
    profileName: "Red To Blue",
    imageRequirePath: require("~/../assets/BlueDice.png"),
    pixelId: 73647812634,
  },
];

// const enum ScannedPixelsDisplay {
//   FLATLIST,
//   SQUARELIST,
// }

interface PairedPixelListProps {
  pairedPixels: PixelInfo[];
  navigation: any;
}
function PairedPixelList({ pairedPixels, navigation }: PairedPixelListProps) {
  const [PixelsDisplay, SwitchPixelsDisplay] = React.useState(false);
  return (
    <Center>
      <VStack space={2} w="100%">
        <HStack alignItems="center">
          <Box paddingLeft={2} paddingRight={2} roundedTop="lg">
            <Text bold fontSize="md" letterSpacing="xl">
              Paired Pixels :
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
            Icon={
              <MaterialIcons
                name="panorama-horizontal"
                size={24}
                color="white"
              />
            }
            //value={scannedPixelsDisplay}
          />
          <MaterialIcons name="panorama-vertical" size={22} color="white" />
        </HStack>
        <Box rounded="md" p={2} bg="gray.700">
          {pairedPixels.length < 1 ? (
            <Text> No PIXEL paired yet !</Text>
          ) : PixelsDisplay === false ? (
            <HStack flexWrap="wrap">
              {pairedPixels.map((pixelInfo) => (
                <Box p={1} key={pixelInfo.pixelId}>
                  <PairedPixelInfoComponent pixel={pixelInfo} />
                </Box>
              ))}
            </HStack>
          ) : (
            <Center>
              <HStack flexWrap="wrap" justifyContent="flex-start" px={4}>
                {pairedPixels.map((pixelInfo) => (
                  <Box p={1} alignSelf="center" key={pixelInfo.pixelId}>
                    <SquarePairedPixelInfo
                      pixel={pixelInfo}
                      onPress={() => {
                        navigation.navigate("Pixel Details", {
                          pixelName: pixelInfo.name,
                        });
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
  scannedPixels: PixelInfo[];
  pairedPixels: PixelInfo[];
  setPairedPixels: React.Dispatch<React.SetStateAction<PixelInfo[]>>;
  onPress?: (() => void) | null | undefined;
}
function NearbyPixelsList({
  scannedPixels,
  pairedPixels,
  setPairedPixels,
  onPress, // any function to execute when pressing a pixel info
}: NearbyPixelListProps) {
  const [hideNearbyPixels, SetHideNearbyPixels] = React.useState(false);
  function addToPaired(pixelToAdd: PixelInfo) {
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
              Nearby pixels :
            </Text>
          </Box>
          <Spacer />
          {/* Hide nearby Pixels toggle */}
          <Toggle
            text="Hide"
            onToggle={() => {
              SetHideNearbyPixels(!hideNearbyPixels);
            }}
            isChecked={hideNearbyPixels}
            value={hideNearbyPixels}
          />
        </HStack>

        <Box rounded="md" p={2} bg="gray.700">
          {!hideNearbyPixels && (
            <HStack flexWrap="wrap">
              {scannedPixels.map((pixelInfo) => (
                <Box p={1} key={pixelInfo.pixelId}>
                  <ScannedPixelInfoComponent
                    pixel={pixelInfo}
                    onPress={() => {
                      if (onPress) onPress();
                      addToPaired(pixelInfo);
                    }}
                  />
                </Box>
              ))}
            </HStack>
          )}
        </Box>
      </VStack>
    </Center>
  );
}

const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);
export default function HomeScreen() {
  const [pairedPixels, SetPairedPixels] = React.useState(pairedPixelsinfo);
  const [scannedPixels] = React.useState(scannedPixelsinfo);
  const navigation =
    useNavigation<StackNavigationProp<HomeScreenStackParamList>>();
  return (
    <PxAppPage theme={paleBluePixelTheme}>
      <Box p={4}>
        <Text bold fontSize="2xl" letterSpacing="xl">
          PIXELS
        </Text>
      </Box>

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

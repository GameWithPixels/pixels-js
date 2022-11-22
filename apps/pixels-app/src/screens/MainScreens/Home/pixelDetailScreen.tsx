import {
  FontAwesome5,
  AntDesign,
  MaterialCommunityIcons,
  Ionicons,
  Octicons,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  BatteryLevel,
  Card,
  createPixelTheme,
  LoadingPopup,
  PixelTheme,
  ProfilesScrollList,
  PxAppPage,
  RSSIStrength,
  Toggle,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  Center,
  Text,
  VStack,
  Image,
  HStack,
  Input,
  Spacer,
  Divider,
  Button,
  ChevronRightIcon,
  Pressable,
} from "native-base";
import React from "react";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import {
  PixelDetailScreenParamList,
  PixelDetailScreenRouteProp,
} from "~/Navigation";

interface HistogramProps {
  rolls: number[];
  viewRatio: number;
}

function Histogram({ rolls }: HistogramProps) {
  const [size, setSize] = React.useState({ w: 100, h: 100 });
  const fontSize = 4;
  const numGradValues = 5;
  const gradCellWidth = 10;
  const barCellWidth = (size.w - gradCellWidth) / rolls.length;
  const barWidthRatio = 0.9;
  const barsMaxHeight = size.h - 6;
  return (
    <Box
      style={{ width: "100%", height: "100%" }}
      onLayout={(event) => {
        const l = event.nativeEvent.layout;
        setSize({ w: 100, h: (100 / l.width) * l.height });
      }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`}>
        {rolls.map((r, i) => {
          const h = (barsMaxHeight * r) / Math.max(...rolls);
          return (
            <Rect
              key={i}
              x={gradCellWidth + i * barCellWidth}
              y={barsMaxHeight - h}
              width={barCellWidth * barWidthRatio}
              height={h}
              fill="white"
            />
          );
        })}
        {rolls.map((_, i) => (
          /* @ts-expect-error*/
          <SvgText
            key={i}
            transform={`translate(${
              (i + 0.5 - (0.3 * fontSize) / barCellWidth) * barCellWidth +
              gradCellWidth
            },${size.h - 3}) rotate(90)`}
            fill="white"
            fontSize={fontSize}
            fontWeight="bold"
            textAnchor="middle"
          >
            {i + 1}
          </SvgText>
        ))}
        {[...Array(numGradValues).keys()].map((i) => (
          /* @ts-expect-error */
          <SvgText
            key={i}
            x={gradCellWidth / 2}
            y={
              0.8 * fontSize +
              ((barsMaxHeight - 0.5 * fontSize) * i) / (numGradValues - 1)
            }
            fill="white"
            fontSize={fontSize}
            fontWeight="bold"
            textAnchor="middle"
          >
            {Math.round(
              (Math.max(...rolls) * (numGradValues - 1 - i)) /
                (numGradValues - 1)
            )}
          </SvgText>
        ))}
      </Svg>
    </Box>
  );
}

// function DiceRolls() {
//   return (
//     <Card
//       minW={10}
//       w="180px"
//       maxW="200px"
//       verticalSpace={2}
//       alignItems="center"
//       bg="primary.300"
//     >
//       <HStack alignItems="center" space={3}>
//         <FontAwesome5 name="dice" size={24} color="black" />
//         <Text bold fontSize="xl">
//           Rolls
//         </Text>
//       </HStack>
//       <HStack space={2} alignItems="center" p={2}>
//         <Box w="50%">
//           <Text>Session</Text>
//           <Divider bg="white" />
//           <Text fontSize="xl">26</Text>
//         </Box>
//         <Box w="50%">
//           <Text>Lifetime</Text>
//           <Divider bg="white" />
//           <Text isTruncated fontSize="xl">
//             285
//           </Text>
//         </Box>
//       </HStack>
//     </Card>
//   );
// }
// function DiceUseTime() {
//   return (
//     <Card
//       minW={10}
//       w="180px"
//       maxW="200px"
//       verticalSpace={2}
//       alignItems="center"
//       bg="primary.300"
//     >
//       <HStack alignItems="center" space={3}>
//         <MaterialCommunityIcons name="clock" size={24} color="black" />
//         <Text bold fontSize="xl">
//           Use Time
//         </Text>
//       </HStack>
//       <HStack space={2} alignItems="center" p={2}>
//         <Box w="50%">
//           <Text>Session</Text>
//           <Divider bg="white" />
//           <HStack alignItems="baseline">
//             <Text fontSize="xl">32 </Text>
//             <Text>min</Text>
//           </HStack>
//         </Box>
//         <Box w="50%">
//           <Text>Lifetime</Text>
//           <Divider bg="white" />
//           <HStack alignItems="baseline">
//             <Text fontSize="xl">3.5 </Text>
//             <Text>h</Text>
//           </HStack>
//         </Box>
//       </HStack>
//     </Card>
//   );
// }

function DiceStats() {
  const [showSessionStats, SetShowSessionStats] = React.useState(true);
  return (
    <Box>
      <HStack alignItems="center" space={2}>
        <Octicons name="graph" size={24} color="white" />
        <Text bold>Dice Stats</Text>
        <Spacer />
        <HStack alignItems="center" space={1}>
          <Toggle
            textSize="xs"
            text="Lifetime"
            onToggle={() => {
              SetShowSessionStats(!showSessionStats);
            }}
            isChecked={showSessionStats}
          />
          <Text fontSize="xs">Session</Text>
        </HStack>
      </HStack>
      {/* {DiceStats} */}
      <Box rounded="md" bg="pixelColors.highlightGray" minH="20px">
        <VStack p={2} space={4}>
          <Center width="100%" maxW="100%" h="150px">
            <HStack space={4}>
              {/* {DiceRolls()} */}

              <Card
                minW={10}
                w="180px"
                maxW="200px"
                verticalSpace={2}
                alignItems="center"
                bg="primary.300"
              >
                <HStack alignItems="center" space={3}>
                  <FontAwesome5 name="dice" size={24} color="black" />
                  <Text bold fontSize="xl">
                    Rolls
                  </Text>
                </HStack>
                <HStack space={2} alignItems="center" p={2}>
                  {showSessionStats ? (
                    <Box w="100%">
                      <Text>Session</Text>
                      <Divider bg="white" />
                      <Text fontSize="xl">26</Text>
                    </Box>
                  ) : (
                    <Box w="100%">
                      <Text>Lifetime</Text>
                      <Divider bg="white" />
                      <Text isTruncated fontSize="xl">
                        285
                      </Text>
                    </Box>
                  )}
                </HStack>
              </Card>

              {/* {DiceUseTime()} */}

              <Card
                minW={10}
                w="180px"
                maxW="200px"
                verticalSpace={2}
                alignItems="center"
                bg="primary.300"
              >
                <HStack alignItems="center" space={3}>
                  <MaterialCommunityIcons
                    name="clock"
                    size={24}
                    color="black"
                  />
                  <Text bold fontSize="xl">
                    Use Time
                  </Text>
                </HStack>
                <HStack space={2} alignItems="center" p={2}>
                  {showSessionStats ? (
                    <Box w="100%">
                      <Text>Session</Text>
                      <Divider bg="white" />
                      <HStack alignItems="baseline">
                        <Text fontSize="xl">32 </Text>
                        <Text>min</Text>
                      </HStack>
                    </Box>
                  ) : (
                    <Box w="100%">
                      <Text>Lifetime</Text>
                      <Divider bg="white" />
                      <HStack alignItems="baseline">
                        <Text fontSize="xl">3.5 </Text>
                        <Text>h</Text>
                      </HStack>
                    </Box>
                  )}
                </HStack>
              </Card>
            </HStack>
          </Center>
          <Card bg="primary.300" verticalSpace={4}>
            <HStack space={3} alignItems="baseline">
              <Ionicons name="stats-chart" size={30} color="black" />
              <Text bold fontSize="xl">
                Lifetime rolls per face
              </Text>
            </HStack>
            <Center width="300" h="150" alignSelf="center">
              <Histogram
                viewRatio={2}
                rolls={[
                  30, 25, 21, 42, 32, 65, 78, 88, 98, 83, 51, 32, 94, 93, 45,
                  91, 12, 56, 35, 45,
                ]}
              />
            </Center>
          </Card>
        </VStack>
      </Box>
    </Box>
  );
}

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
const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);

export default function PixelDetailScreen() {
  //Will be used when the correct nested screen are in place
  const navigation =
    useNavigation<StackNavigationProp<PixelDetailScreenParamList>>();
  const route = useRoute<PixelDetailScreenRouteProp>();
  const pixelInfo = route.params;
  const [showLoadingPopup, SetShowLoadingPopup] = React.useState(false);
  return (
    <PxAppPage theme={paleBluePixelTheme}>
      <VStack space={6} width="100%" maxW="100%">
        <Center bg="white" rounded="lg" px={2}>
          <Input
            InputRightElement={
              <FontAwesome5 name="pen" size={20} color="black" />
            }
            size="2xl"
            variant="unstyled"
            placeholder={pixelInfo.name}
            color="black"
          />
        </Center>
        <Center w="100%">
          <HStack space={0} alignItems="center" paddingLeft={5}>
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Box flex={2.5} paddingLeft={0}>
              <Image
                size={180}
                // source={require("~/../assets/RainbowDice.png")}
                source={pixelInfo.imageRequirePath}
                alt="placeHolder"
              />
            </Box>
            <Spacer />
            <VStack flex={2} space={3} p={2} rounded="md" w="40%">
              <Button>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={24}
                  color="white"
                />
              </Button>
              <VStack bg="pixelColors.highlightGray" rounded="md">
                <BatteryLevel
                  iconSize="50"
                  textSize="lg"
                  percentage={pixelInfo.batteryLevel}
                />
                <RSSIStrength
                  iconSize="50"
                  textSize="lg"
                  percentage={pixelInfo.rssi}
                />
              </VStack>
              <Box bg="pixelColors.highlightGray" rounded="md" p={2}>
                <VStack space={2}>
                  <HStack>
                    <Text bold>Face up : </Text>
                    <Spacer />
                    <Text bold color="green.500" fontSize="md">
                      10
                    </Text>
                  </HStack>
                  {/* <HStack>
                    <Text bold>Status : </Text>
                    <Spacer />
                    <Text bold color="green.500">
                      On Face
                    </Text>
                  </HStack> */}
                </VStack>
              </Box>
            </VStack>
          </HStack>
        </Center>

        {/* {Profiles horizontal scroll list} */}
        <Box>
          <HStack alignItems="center" space={2} paddingBottom={2}>
            <AntDesign name="profile" size={24} color="white" />
            <Text bold>Recent profiles :</Text>
          </HStack>
          <ProfilesScrollList
            onPress={() => {
              SetShowLoadingPopup(true);
            }}
            availableProfiles={[
              {
                profileName: "Rainbow",
                imageRequirePath: require("~/../assets/RainbowDice.png"),
              },
              {
                profileName: "Waterfall",
                imageRequirePath: require("~/../assets/BlueDice.png"),
              },
              {
                profileName: "Red to Blue",
                imageRequirePath: require("~/../assets/DieImageTransparent.png"),
              },
              {
                profileName: "Speak Numbers",
                imageRequirePath: require("~/../assets/DieImageTransparent.png"),
              },
              {
                profileName: "Custom Profile",
                imageRequirePath: require("~/../assets/RainbowDice.png"),
              },
              {
                profileName: "Flashy",
                imageRequirePath: require("~/../assets/YellowDice.png"),
              },
              {
                profileName: "Explosion",
                imageRequirePath: require("~/../assets/YellowDice.png"),
              },
            ]}
          />
        </Box>

        {/* Dice Stats is used without params until we switch to real data */}
        {DiceStats()}
        {/* {Advanced Settings infos} */}
        <Divider bg="primary.200" width="90%" alignSelf="center" />
        <Pressable
          onPress={() => {
            navigation.navigate("PixelAdvancedSettingsScreen");
          }}
        >
          <HStack
            alignItems="center"
            bg="primary.500"
            p={3}
            rounded="md"
            w="100%"
            alignSelf="center"
          >
            <Text bold>Advanced Settings</Text>
            <Spacer />
            <ChevronRightIcon />
          </HStack>
        </Pressable>

        <Divider bg="primary.200" width="90%" alignSelf="center" />
        <Button
          leftIcon={<AntDesign name="disconnect" size={24} color="white" />}
          w="100%"
          alignSelf="center"
        >
          <Text bold>Unpair Dice</Text>
        </Button>
        <LoadingPopup title="Loading" progress={20} isOpen={showLoadingPopup} />
      </VStack>
    </PxAppPage>
  );
}

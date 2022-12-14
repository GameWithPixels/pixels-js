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
  ProfilesScrollView,
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
// eslint-disable-next-line import/namespace
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import {
  PixelDetailScreenParamList,
  PixelDetailScreenRouteProp,
} from "~/Navigation";
import { sr } from "~/Utils";

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

function DieStats() {
  const [showSessionStats, setShowSessionStats] = React.useState(true);
  const lifetimeHistogramRolls = [
    30, 25, 21, 42, 32, 65, 78, 88, 98, 83, 51, 32, 94, 93, 45, 91, 12, 56, 35,
    45,
  ];
  const sessionHistogramRolls = [
    1, 2, 9, 6, 3, 2, 5, 8, 8, 9, 10, 4, 5, 7, 2, 11, 3, 7, 9, 4,
  ];
  const sessionRolls = sessionHistogramRolls.reduce(
    (sessionHistogramRolls, v) => sessionHistogramRolls + v,
    0
  );
  const lifetimeRolls = lifetimeHistogramRolls.reduce(
    (lifetimeHistogramRolls, v) => lifetimeHistogramRolls + v,
    0
  );
  return (
    <Box>
      <HStack alignItems="center" space={2}>
        <Octicons name="graph" size={24} color="white" />
        <Text bold>Die Stats</Text>
        <Spacer />
        <HStack alignItems="center" space={1}>
          <Toggle
            textSize="xs"
            text="Lifetime"
            onToggle={() => {
              setShowSessionStats(!showSessionStats);
            }}
            isChecked={showSessionStats}
          />
          <Text fontSize="xs">Session</Text>
        </HStack>
      </HStack>
      {/* {DiceStats} */}
      <Box rounded="md" bg="pixelColors.highlightGray" minH="20px">
        <VStack p={sr(8)} space={sr(9)}>
          <Center width="100%" maxW="100%" h={sr(150)}>
            <HStack space={sr(11)}>
              {/* {DiceRolls()} */}

              <Card
                minW={10}
                w={sr(170)}
                h={sr(140)}
                maxW="100%"
                verticalSpace={2}
                alignItems="center"
                bg="primary.300"
              >
                <HStack alignItems="center" space={3}>
                  <FontAwesome5 name="dice" size={sr(24)} color="black" />
                  <Text bold fontSize="xl">
                    Rolls
                  </Text>
                </HStack>
                <HStack space={2} alignItems="center" p={2}>
                  {showSessionStats ? (
                    <Box w="100%">
                      <Text>Session</Text>
                      <Divider bg="white" />
                      <Text fontSize="xl">{sessionRolls}</Text>
                    </Box>
                  ) : (
                    <Box w="100%">
                      <Text>Lifetime</Text>
                      <Divider bg="white" />
                      <Text isTruncated fontSize="xl">
                        {lifetimeRolls}
                      </Text>
                    </Box>
                  )}
                </HStack>
              </Card>

              {/* {DiceUseTime()} */}

              <Card
                minW={10}
                w={sr(170)}
                h={sr(140)}
                maxW="100%"
                verticalSpace={2}
                alignItems="center"
                bg="primary.300"
              >
                <HStack alignItems="center" space={3}>
                  <MaterialCommunityIcons
                    name="clock"
                    size={sr(24)}
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
                        <Text fontSize="xl">52 </Text>
                        <Text>min</Text>
                      </HStack>
                    </Box>
                  ) : (
                    <Box w="100%">
                      <Text>Lifetime</Text>
                      <Divider bg="white" />
                      <HStack alignItems="baseline">
                        <Text fontSize="xl">12.5 </Text>
                        <Text>h</Text>
                      </HStack>
                    </Box>
                  )}
                </HStack>
              </Card>
            </HStack>
          </Center>
          {!showSessionStats ? (
            //Lifetime histogram
            <Card w={sr(350)} bg="primary.300" verticalSpace={sr(4)}>
              <HStack space={sr(3)} alignItems="baseline">
                <Ionicons name="stats-chart" size={30} color="black" />
                <Text bold fontSize="xl">
                  Lifetime Rolls Per Face
                </Text>
              </HStack>
              <Center width={sr(320)} h={sr(150)} alignSelf="center">
                <Histogram viewRatio={2} rolls={lifetimeHistogramRolls} />
              </Center>
            </Card>
          ) : (
            //Session histogram
            <Card w={sr(350)} bg="primary.300" verticalSpace={sr(4)}>
              <HStack space={3} alignItems="baseline">
                <Ionicons name="stats-chart" size={30} color="black" />
                <Text bold fontSize="xl">
                  Session Rolls Per Face
                </Text>
              </HStack>
              <Center width={sr(320)} h={sr(150)} alignSelf="center">
                <Histogram viewRatio={2} rolls={sessionHistogramRolls} />
              </Center>
            </Card>
          )}
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
  const navigation =
    useNavigation<StackNavigationProp<PixelDetailScreenParamList>>();
  const route = useRoute<PixelDetailScreenRouteProp>();
  const pixelInfo = route.params;
  const [showLoadingPopup, setShowLoadingPopup] = React.useState(false);
  return (
    <PxAppPage theme={paleBluePixelTheme}>
      <LoadingPopup
        title="Uploading profile..."
        isOpen={showLoadingPopup}
        onProgressEnd={() => setShowLoadingPopup(false)}
      />
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
            <Box w="50%" paddingLeft={0}>
              <Image
                size={sr(200)}
                source={pixelInfo.imageRequirePath}
                alt="placeHolder"
              />
            </Box>
            <Spacer />
            <VStack flex={2} space={sr(11)} p={2} rounded="md" w="40%">
              <Button>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={24}
                  color="white"
                />
              </Button>
              <VStack bg="pixelColors.highlightGray" rounded="md" p={2}>
                <BatteryLevel size="xl" percentage={pixelInfo.batteryLevel} />
                <RSSIStrength percentage={pixelInfo.rssi} size="xl" />
              </VStack>
              <Box bg="pixelColors.highlightGray" rounded="md" p={2}>
                <VStack space={2}>
                  <HStack>
                    <Text bold>Face Up: </Text>
                    <Spacer />
                    <Text bold color="green.500" fontSize="md">
                      10
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </HStack>
        </Center>

        {/* {Profiles horizontal scroll list} */}
        <Box>
          <HStack alignItems="center" space={2} paddingBottom={2}>
            <AntDesign name="profile" size={24} color="white" />
            <Text bold>Recent Profiles:</Text>
          </HStack>
          <ProfilesScrollView
            onPress={() => {
              console.log(showLoadingPopup);
              setShowLoadingPopup(true);
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
                profileName: "Speak",
                imageRequirePath: require("~/../assets/DieImageTransparent.png"),
              },
              {
                profileName: "Custom",
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
        {DieStats()}
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
          <Text bold>Unpair Die</Text>
        </Button>
      </VStack>
    </PxAppPage>
  );
}

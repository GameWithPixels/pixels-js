import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
  Octicons,
} from "@expo/vector-icons";
import {
  Card,
  Histogram,
  Toggle,
  sr,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  Center,
  Text,
  VStack,
  HStack,
  Spacer,
  Divider,
} from "native-base";
import React from "react";

export default function DieStatistics() {
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
            title="Lifetime"
            onValueChange={() => {
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

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

export default function DieStatistics({
  sessionRolls,
  lifetimeRolls,
}: {
  sessionRolls: number[];
  lifetimeRolls: number[];
}) {
  const [showSessionStats, setShowSessionStats] = React.useState(true);
  const sessionRollsCount = React.useMemo(
    () => sessionRolls.reduce((sum, v) => sum + v, 0),
    [sessionRolls]
  );
  const lifetimeRollsCount = React.useMemo(
    () => lifetimeRolls.reduce((sum, v) => sum + v, 0),
    [lifetimeRolls]
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
                alignItems="center"
                bg="primary.300"
              >
                <HStack alignItems="center" space={3}>
                  <FontAwesome5 name="dice" size={sr(24)} color="black" />
                  <Text bold fontSize="xl">
                    Rolls
                  </Text>
                </HStack>
                <HStack mt={2} space={2} alignItems="center" p={2}>
                  {showSessionStats ? (
                    <Box w="100%">
                      <Text>Session</Text>
                      <Divider bg="white" />
                      <Text fontSize="xl">{sessionRollsCount}</Text>
                    </Box>
                  ) : (
                    <Box w="100%">
                      <Text>Lifetime</Text>
                      <Divider bg="white" />
                      <Text isTruncated fontSize="xl">
                        {lifetimeRollsCount}
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
                <HStack mt={2} space={2} alignItems="center" p={2}>
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
            <Card w={sr(350)} bg="primary.300">
              <HStack space={sr(3)} alignItems="baseline">
                <Ionicons name="stats-chart" size={30} color="black" />
                <Text bold fontSize="xl">
                  Lifetime Rolls Per Face
                </Text>
              </HStack>
              <Center mt={sr(4)} width={sr(320)} h={sr(150)} alignSelf="center">
                <Histogram viewRatio={2} rolls={lifetimeRolls} />
              </Center>
            </Card>
          ) : (
            //Session histogram
            <Card w={sr(350)} bg="primary.300">
              <HStack space={3} alignItems="baseline">
                <Ionicons name="stats-chart" size={30} color="black" />
                <Text bold fontSize="xl">
                  Session Rolls Per Face
                </Text>
              </HStack>
              <Center mt={sr(4)} width={sr(320)} h={sr(150)} alignSelf="center">
                <Histogram viewRatio={2} rolls={sessionRolls} />
              </Center>
            </Card>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
  Octicons,
} from "@expo/vector-icons";
import {
  Card,
  FastBox,
  FastHStack,
  Histogram,
  Toggle,
} from "@systemic-games/react-native-pixels-components";
import { Text, Spacer, Divider, Box } from "native-base";
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
    <>
      <FastHStack w="100%" alignItems="center">
        <Octicons name="graph" size={24} color="white" />
        <Text ml={2} bold>
          Die Stats
        </Text>
        <Spacer />
        <FastHStack alignItems="center">
          <Toggle
            fontSize="xs"
            title="Lifetime"
            space={0}
            onValueChange={() => {
              setShowSessionStats(!showSessionStats);
            }}
            isChecked={showSessionStats}
          />
          <Text ml={1} fontSize="xs">
            Session
          </Text>{" "}
        </FastHStack>
      </FastHStack>
      {/* DiceStats */}
      <Box w="100%" p={2} rounded="md" bg="pixelColors.highlightGray">
        <FastHStack width="100%">
          {/* DiceRolls */}
          <Card flex={1} alignItems="center" bg="primary.300">
            <FastHStack alignItems="center">
              <FontAwesome5 name="dice" size={24} color="black" />
              <Text ml={3} bold fontSize="xl">
                Rolls
              </Text>
            </FastHStack>
            {showSessionStats ? (
              <FastBox w="100%" mt={2} p={2}>
                <Text>Session</Text>
                <Divider bg="white" />
                <Text fontSize="xl">{sessionRollsCount}</Text>
              </FastBox>
            ) : (
              <FastBox w="100%" mt={2} p={2}>
                <Text>Lifetime</Text>
                <Divider bg="white" />
                <Text isTruncated fontSize="xl">
                  {lifetimeRollsCount}
                </Text>
              </FastBox>
            )}
          </Card>
          {/* DiceUseTime */}
          <Card flex={1} ml={2} alignItems="center" bg="primary.300">
            <FastHStack alignItems="center">
              <MaterialCommunityIcons name="clock" size={24} color="black" />
              <Text ml={3} bold fontSize="xl">
                Use Time
              </Text>
            </FastHStack>
            {showSessionStats ? (
              <FastBox w="100%" mt={2} p={2}>
                <Text>Session</Text>
                <Divider bg="white" />
                <FastHStack alignItems="baseline">
                  <Text fontSize="xl">52 </Text>
                  <Text>min</Text>
                </FastHStack>
              </FastBox>
            ) : (
              <FastBox w="100%" mt={2} p={2}>
                <Text>Lifetime</Text>
                <Divider bg="white" />
                <FastHStack alignItems="baseline">
                  <Text fontSize="xl">12.5 </Text>
                  <Text>h</Text>
                </FastHStack>
              </FastBox>
            )}
          </Card>
        </FastHStack>
        {!showSessionStats ? (
          // Lifetime histogram
          <Card mt={2} bg="primary.300">
            <FastHStack alignItems="baseline">
              <Ionicons name="stats-chart" size={30} color="black" />
              <Text ml={3} bold fontSize="xl">
                Lifetime Rolls Per Face
              </Text>
            </FastHStack>
            <FastBox mt={4} width={320} h={150} alignSelf="center">
              <Histogram viewRatio={2} rolls={lifetimeRolls} />
            </FastBox>
          </Card>
        ) : (
          // Session histogram
          <Card mt={2} bg="primary.300">
            <FastHStack alignItems="baseline">
              <Ionicons name="stats-chart" size={30} color="black" />
              <Text ml={3} bold fontSize="xl">
                Session Rolls Per Face
              </Text>
            </FastHStack>
            <FastBox mt={4} width={320} h={150} alignSelf="center">
              <Histogram viewRatio={2} rolls={sessionRolls} />
            </FastBox>
          </Card>
        )}
      </Box>
    </>
  );
}

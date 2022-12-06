import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  PatternCard,
  PatternInfo,
  PxAppPage,
  PixelTheme,
  createPixelTheme,
} from "@systemic-games/react-native-pixels-components";
import { Box, Center, HStack } from "native-base";
import React from "react";

import { PatternsScreenStackParamList } from "~/Navigation";

const patterns: PatternInfo[] = [
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
  {
    name: "Red To Blue",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
  },
];

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
export default function PatternsScreen() {
  const navigation =
    useNavigation<StackNavigationProp<PatternsScreenStackParamList>>();
  const [selectedPattern, setSelectedPattern] = React.useState<number>();
  return (
    <PxAppPage theme={paleBluePixelTheme} scrollable>
      {/* TODO try to replace with flatlist and disable scroll in page */}
      <Center>
        <HStack flexWrap="wrap" justifyContent="flex-start">
          {patterns.map((patternInfo, key) => (
            <Box key={key} alignSelf="center" p={1} w="50%">
              <PatternCard
                onPress={() => {
                  //@ts-expect-error error from pattern info type not being accepted while still working fine
                  navigation.navigate("AnimationSettingsScreen", patternInfo);
                }}
                w="90%"
                verticalSpace={2}
                imageSize={100}
                p={2}
                borderWidth={1}
                selectable
                selectedPatternIndex={selectedPattern}
                onSelected={setSelectedPattern}
                patternIndexInList={key}
                patternInfo={patternInfo}
              />
            </Box>
          ))}
        </HStack>
      </Center>
    </PxAppPage>
  );
}

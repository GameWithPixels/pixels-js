import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import {
  PxAppPage,
  PixelTheme,
  createPixelTheme,
  LightingPatternsCard,
  LightingPatternsInfo,
} from "@systemic-games/react-native-pixels-components";
import { Box, Center, HStack } from "native-base";
import React, { useEffect } from "react";

import { PatternsScreenStackParamList } from "~/Navigation";
import StandardProfiles from "~/features/StandardProfile";
export let lastSelectedLightingPattern: EditAnimation;

const standardLightingPatterns = [...StandardProfiles.animations];

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
  // const [selectedLightingPattern, setSelectedLightingPattern] =
  //   React.useState<EditAnimation>();

  const [patternList, _setPatternsList] = React.useState<EditAnimation[]>(
    standardLightingPatterns
  );
  const [lightingPatternInfoList, setLightingPatternInfoList] = React.useState<
    LightingPatternsInfo[]
  >([]);

  useEffect(() => {
    const infos: LightingPatternsInfo[] = [];
    patternList.map((lightingPattern) =>
      infos.push({
        editAnimation: lightingPattern,
        // Remove me!
        imageRequirePath: require("!/favicon.png"),
      })
    );
    setLightingPatternInfoList(infos);
  }, [patternList]);
  return (
    <PxAppPage theme={paleBluePixelTheme} scrollable>
      {/* TODO try to replace with flatlist and disable scroll in page */}
      <Center>
        <HStack flexWrap="wrap" justifyContent="flex-start">
          {lightingPatternInfoList.map((lightingPatternInfo, key) => (
            <Box key={key} alignSelf="center" p={1} w="50%">
              <LightingPatternsCard
                onPress={() => {
                  navigation.navigate("AnimationSettingsScreen");
                  lastSelectedLightingPattern =
                    lightingPatternInfo.editAnimation;
                }}
                w="90%"
                verticalSpace={2}
                imageSize={70}
                p={2}
                borderWidth={1}
                lightingPatternInfo={lightingPatternInfo}
              />
            </Box>
          ))}
        </HStack>
      </Center>
    </PxAppPage>
  );
}

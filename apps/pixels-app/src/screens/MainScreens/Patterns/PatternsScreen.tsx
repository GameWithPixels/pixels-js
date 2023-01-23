import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import {
  PxAppPage,
  PixelTheme,
  createPixelTheme,
  LightingPatternsCard,
  LightingPatternsInfo,
  createSwipeableSideButton,
} from "@systemic-games/react-native-pixels-components";
import { Box, Center, VStack } from "native-base";
import React, { useEffect } from "react";
import { Swipeable } from "react-native-gesture-handler";

import { PatternsScreenStackParamList } from "~/Navigation";
import EditableStore from "~/features/EditableStore";
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
        imageRequirePath: require("../../../../assets/BlueDice.png"),
      })
    );
    setLightingPatternInfoList(infos);
  }, [patternList]);

  /**
   * Duplicate an existing profile by updating the profileList.
   * @param patternToDuplicate Profile infos of the profile to duplicate.
   * @param index Index of the profile to duplicate.
   */
  function duplicatePattern(patternToDuplicate: EditAnimation, index: number) {
    // Copy the profile that needs to be duplicated
    patternToDuplicate.name = patternToDuplicate.name + " COPY";
    const duplicatedPattern = patternToDuplicate.duplicate();

    // Duplicate the profile in the UI list
    patternList.splice(index + 1, 0, duplicatedPattern);
    _setPatternsList([...patternList]);
  }

  function deletePattern(patternToDelete: EditAnimation) {
    console.log("delete pattern");
    const patternToDeleteKey = EditableStore.getKey(patternToDelete);
    patternList.splice(
      patternList.findIndex((patternToDelete) => {
        return EditableStore.getKey(patternToDelete) === patternToDeleteKey;
      }),
      1
    );
    _setPatternsList([...patternList]);
    EditableStore.unregister(patternToDelete);
  }

  return (
    <PxAppPage theme={paleBluePixelTheme} scrollable>
      <Center>
        <VStack w="100%">
          {lightingPatternInfoList.map((lightingPatternInfo, i) => (
            // <Box key={key} alignSelf="center" p={1} w="50%">
            // <LightingPatternsCard
            //   onPress={() => {
            //     navigation.navigate("AnimationSettingsScreen");
            //     lastSelectedLightingPattern =
            //       lightingPatternInfo.editAnimation;
            //   }}
            //   w="90%"
            //   verticalSpace={2}
            //   imageSize={70}
            //   p={2}
            //   borderWidth={1}
            //   lightingPatternInfo={lightingPatternInfo}
            // />
            // </Box>
            <Box p={1} key={EditableStore.getKey(lightingPatternInfo)}>
              <Swipeable
                renderLeftActions={createSwipeableSideButton({
                  w: 85,
                  buttons: [
                    {
                      //onPress: () => removeFromFavorites(profile),
                      bg: "purple.500",
                      // icon: (
                      //   <MaterialCommunityIcons
                      //     name="bookmark-remove-outline"
                      //     size={30}
                      //     color="white"
                      //   />
                      // ),
                    },
                  ],
                })}
                renderRightActions={createSwipeableSideButton({
                  w: 195,
                  buttons: [
                    {
                      onPress: () =>
                        duplicatePattern(lightingPatternInfo.editAnimation, i),
                      bg: "blue.500",
                      // icon: (
                      //   <MaterialIcons
                      //     name="content-copy"
                      //     size={24}
                      //     color="white"
                      //   />
                      // ),
                    },
                    {
                      // onPress: () => openExportSheet(profile),
                      bg: "amber.500",
                      // icon: (
                      //   <MaterialCommunityIcons
                      //     name="export-variant"
                      //     size={24}
                      //     color="white"
                      //   />
                      // ),
                    },
                    {
                      onPress: () =>
                        deletePattern(lightingPatternInfo.editAnimation),

                      bg: "red.500",
                      // icon: (
                      //   <MaterialIcons
                      //     name="delete-outline"
                      //     size={24}
                      //     color="white"
                      //   />
                      // ),
                    },
                  ],
                })}
              >
                <LightingPatternsCard
                  onPress={() => {
                    navigation.navigate("AnimationSettingsScreen");
                    lastSelectedLightingPattern =
                      lightingPatternInfo.editAnimation;
                  }}
                  lightingPatternInfo={lightingPatternInfo}
                  w="100%"
                  imageSize={70}
                />
              </Swipeable>
            </Box>
          ))}
        </VStack>
      </Center>
    </PxAppPage>
  );
}

import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import {
  PxAppPage,
  PixelTheme,
  createPixelTheme,
  LightingPatternsCard,
  createSwipeableSideButton,
  Card,
  LightingPatternCardProps,
} from "@systemic-games/react-native-pixels-components";
import {
  Actionsheet,
  Box,
  Center,
  HStack,
  VStack,
  Text,
  useDisclose,
  Pressable,
} from "native-base";
import React from "react";
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

/**
 * Custom profile card widget for the option to create a new profile.
 * @param props See {@link ProfileCardProps} for props parameters.
 */
function CreatePatternWidget(props: LightingPatternCardProps) {
  return (
    <Pressable
      onPress={() => {
        props.onPress?.();
      }}
    >
      <Card
        bg={null}
        p={props.p}
        minW="100%"
        minH="50px"
        w={props.w}
        h={props.h}
        verticalSpace={props.verticalSpace}
        borderWidth={props.borderWidth}
      >
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text isTruncated fontSize={props.textSize} bold>
          ADD NEW PATTERN
        </Text>
      </Card>
    </Pressable>
  );
}

const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);
export default function PatternsScreen() {
  const navigation =
    useNavigation<StackNavigationProp<PatternsScreenStackParamList>>();

  const [patternList, setPatternsList] = React.useState<EditAnimation[]>(
    standardLightingPatterns
  );

  /**
   * Duplicate an existing pattern by updating the profileList.
   * @param patternToDuplicate Pattern infos of the pattern to duplicate.
   * @param index Index of the pattern to duplicate.
   */
  function duplicatePattern(patternToDuplicate: EditAnimation, index: number) {
    // Copy the pattern that needs to be duplicated
    const duplicatedPattern = patternToDuplicate.duplicate();
    duplicatedPattern.name = patternToDuplicate.name + " COPY";
    // Duplicate the pattern in the UI list
    patternList.splice(index + 1, 0, duplicatedPattern);
    setPatternsList([...patternList]);
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

    setPatternsList([...patternList]);
    EditableStore.unregister(patternToDelete);
  }
  const { isOpen, onOpen, onClose } = useDisclose();
  function openExportSheet(_patternToExport: EditAnimation) {
    onOpen();
    //DO OTHER THINGS
  }

  function addPattern() {
    const newPattern = standardLightingPatterns[0].duplicate();
    newPattern.name = "NEW Pattern";
    setPatternsList([...patternList, newPattern]);
  }

  return (
    <>
      <PxAppPage theme={paleBluePixelTheme} scrollable>
        <Center>
          <VStack w="100%" bg="gray.700" rounded="lg" p={2}>
            {patternList.map((patternInfo, i) => (
              <Box p={1} key={EditableStore.getKey(patternInfo)}>
                <Swipeable
                  renderRightActions={createSwipeableSideButton({
                    w: 195,
                    buttons: [
                      {
                        onPress: () => duplicatePattern(patternInfo, i),
                        bg: "blue.500",
                        icon: (
                          <MaterialIcons
                            name="content-copy"
                            size={24}
                            color="white"
                          />
                        ),
                      },
                      {
                        onPress: () => openExportSheet(patternInfo),
                        bg: "amber.500",
                        icon: (
                          <MaterialCommunityIcons
                            name="export-variant"
                            size={24}
                            color="white"
                          />
                        ),
                      },
                      {
                        onPress: () => deletePattern(patternInfo),

                        bg: "red.500",
                        icon: (
                          <MaterialIcons
                            name="delete-outline"
                            size={24}
                            color="white"
                          />
                        ),
                      },
                    ],
                  })}
                >
                  <LightingPatternsCard
                    onPress={() => {
                      navigation.navigate("AnimationSettingsScreen");
                      lastSelectedLightingPattern = patternInfo;
                    }}
                    patternInfo={patternInfo}
                    w="100%"
                    imageSize={70}
                    borderWidth={1}
                  />
                </Swipeable>
              </Box>
            ))}
          </VStack>
          <CreatePatternWidget
            onPress={() => {
              addPattern();
            }}
          />
        </Center>
      </PxAppPage>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content h={180} maxW="100%" w="100%">
          <VStack space={1} w="100%">
            <Actionsheet.Item maxW="100%" w="100%" bg="gray.500" rounded="md">
              <HStack w="100%" h={30} space={3}>
                <Box>
                  <Text fontSize="lg">Copy</Text>
                </Box>
                <Box>
                  <MaterialIcons name="content-copy" size={24} color="white" />
                </Box>
              </HStack>
            </Actionsheet.Item>
            <Actionsheet.Item maxW="100%" w="100%" bg="gray.500" rounded="md">
              <HStack h={30} space={3}>
                <Box>
                  <Text fontSize="lg">Save as JSON</Text>
                </Box>
                <Box>
                  <MaterialCommunityIcons
                    name="code-json"
                    size={24}
                    color="white"
                  />
                </Box>
              </HStack>
            </Actionsheet.Item>
          </VStack>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

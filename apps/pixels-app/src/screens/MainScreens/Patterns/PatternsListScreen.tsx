import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import {
  AnimationBits,
  AnimationPreset,
  EditAnimation,
  EditDataSet,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelAppPage,
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
  ScrollView,
} from "native-base";
import React from "react";
import { Swipeable } from "react-native-gesture-handler";

import EditableStore from "~/features/EditableStore";
import { MyAppDataSet } from "~/features/profiles";
import DieRenderer from "~/features/render3d/DieRenderer";
import { PatternsListScreenProps } from "~/navigation";

const standardLightingPatterns = [...MyAppDataSet.animations];

const animDataMap = new Map<
  EditAnimation,
  {
    animations: AnimationPreset;
    animationBits: AnimationBits;
  }
>();

function getAnimData(anim: EditAnimation) {
  let data = animDataMap.get(anim);
  if (!data) {
    const animationBits = new AnimationBits();
    data = {
      animationBits,
      animations: anim.toAnimation(new EditDataSet(), animationBits),
    };
    animDataMap.set(anim, data);
  }
  return data;
}

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

export default function PatternsListScreen({
  navigation,
}: PatternsListScreenProps) {
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
    const patterns = [...patternList];
    patterns.splice(index + 1, 0, duplicatedPattern);
    setPatternsList(patterns);
  }

  function deletePattern(patternToDelete: EditAnimation) {
    console.log("delete pattern");
    const patternToDeleteKey = EditableStore.getKey(patternToDelete);
    const patterns = [...patternList];
    patterns.splice(
      patterns.findIndex((patternToDelete) => {
        return EditableStore.getKey(patternToDelete) === patternToDeleteKey;
      }),
      1
    );

    setPatternsList(patterns);
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
      <PixelAppPage>
        <ScrollView height="100%" width="100%">
          <Center>
            <VStack w="100%" bg="gray.700" rounded="lg" p={2}>
              {patternList.map((anim, i) => (
                <Box p={1} key={EditableStore.getKey(anim)}>
                  <Swipeable
                    renderRightActions={createSwipeableSideButton({
                      w: 195,
                      buttons: [
                        {
                          onPress: () => duplicatePattern(anim, i),
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
                          onPress: () => openExportSheet(anim),
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
                          onPress: () => deletePattern(anim),

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
                      onPress={() =>
                        navigation.navigate("AnimationSettings", {
                          animationId: EditableStore.getKey(anim),
                        })
                      }
                      name={anim.name}
                      animationType={anim.type}
                      dieRenderer={() => (
                        <DieRenderer animationData={getAnimData(anim)} />
                      )}
                      w="100%"
                      h={100}
                      imageSize={70}
                      p={1.5}
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
        </ScrollView>
      </PixelAppPage>

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

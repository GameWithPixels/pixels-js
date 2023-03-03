import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import {
  EditAnimation,
  EditAnimationSimple,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelAppPage,
  LightingPatternCard,
  createSwipeableSideButton,
  Card,
  LightingPatternCardProps,
  getAnimationTitle,
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

import {
  useAppAddAnimation,
  useAppAnimations,
  useAppRemoveAnimation,
} from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import generateUuid from "~/features/generateUuid";
import DieRenderer from "~/features/render3d/DieRenderer";
import { AnimationsListScreenProps } from "~/navigation";

/**
 * Custom profile card widget for the option to create a new profile.
 * @param props See {@link ProfileCardProps} for props parameters.
 */
function CreatePatternWidget(props: Omit<LightingPatternCardProps, "title">) {
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
        space={props.verticalSpace}
        borderWidth={props.borderWidth}
      >
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text isTruncated fontSize={props.textSize} bold>
          ADD NEW LIGHTING PATTERN
        </Text>
      </Card>
    </Pressable>
  );
}

export default function AnimationsListScreen({
  navigation,
}: AnimationsListScreenProps) {
  const animations = useAppAnimations();
  const addAnimation = useAppAddAnimation();
  const removeAnimation = useAppRemoveAnimation();

  const duplicateAnimation = React.useCallback(
    (anim: Readonly<EditAnimation>) => {
      // Copy the animation that needs to be duplicated
      const dupAnim = anim.duplicate(generateUuid());
      dupAnim.name += " copy";
      // Insert in list after the original animation
      addAnimation(dupAnim, animations.indexOf(anim) + 1);
    },
    [addAnimation, animations]
  );

  // Action sheet
  const { isOpen, onOpen, onClose } = useDisclose();

  return (
    <>
      <PixelAppPage>
        <ScrollView height="100%" width="100%">
          <Center>
            <VStack w="100%" bg="gray.700" rounded="lg" p={2}>
              {animations.map((anim) => (
                <Box p={1} key={anim.uuid}>
                  <Swipeable
                    renderRightActions={createSwipeableSideButton({
                      w: 195,
                      buttons: [
                        {
                          onPress: () => duplicateAnimation(anim),
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
                          onPress: () => onOpen(),
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
                          onPress: () => removeAnimation(anim),

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
                    <LightingPatternCard
                      onPress={() =>
                        navigation.navigate("AnimationEdit", {
                          animationUuid: anim.uuid,
                        })
                      }
                      name={anim.name}
                      title={getAnimationTitle(anim.type)}
                      dieRenderer={() => (
                        <DieRenderer renderData={getCachedDataSet(anim)} />
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
              onPress={() =>
                addAnimation(
                  new EditAnimationSimple({
                    uuid: generateUuid(),
                    name: "New Animation",
                  })
                )
              }
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

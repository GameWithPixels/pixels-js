import {
  EditAnimation,
  EditAnimationSimple,
} from "@systemic-games/pixels-edit-animation";
import {
  useDisclose,
  FastButton,
  FastHStack,
  BaseStyles,
} from "@systemic-games/react-native-pixels-components";
import React from "react";
import { ScrollView } from "react-native";
import { useTheme } from "react-native-paper";

import { AnimationSwipeableCard } from "./AnimationSwipeableCard";

import AppStyles from "~/AppStyles";
import {
  useAppAddAnimation,
  useAppAnimations,
  useAppRemoveAnimation,
} from "~/app/hooks";
import { ExportEntityActionsheet } from "~/components/ExportEntityActionsheet";
import IconButton from "~/components/IconButton";
import generateUuid from "~/features/generateUuid";
import { AnimationsListScreenProps } from "~/navigation";

export function AnimationsList({
  navigation,
}: Pick<AnimationsListScreenProps, "navigation">) {
  const addAnimation = useAppAddAnimation();
  const createAnimation = React.useCallback(
    () =>
      addAnimation(
        new EditAnimationSimple({
          uuid: generateUuid(),
          name: "Empty Animation",
        })
      ),
    [addAnimation]
  );

  const animations = useAppAnimations();
  const add = useAppAddAnimation();
  const remove = useAppRemoveAnimation();

  const duplicate = React.useCallback(
    (anim: Readonly<EditAnimation>) => {
      // Copy the animation that needs to be duplicated
      const dupAnim = anim.duplicate(generateUuid());
      dupAnim.name += " copy";
      // Insert in list after the original animation
      add(dupAnim, anim);
    },
    [add]
  );

  const edit = React.useCallback(
    (anim: Readonly<EditAnimation>) =>
      navigation.navigate("AnimationEdit", {
        animationUuid: anim.uuid,
      }),
    [navigation]
  );

  // Export action sheet
  const { isOpen, onOpen, onClose } = useDisclose();

  // Animation card
  const theme = useTheme();
  const renderItem = React.useCallback(
    ({ item: anim }: { item: Readonly<EditAnimation> }) => (
      <AnimationSwipeableCard
        key={anim.uuid}
        w="100%"
        h={100}
        borderRadius={(theme.isV3 ? 5 : 1) * theme.roundness}
        borderWidth={1}
        borderColor={theme.colors.primary}
        bg={theme.colors.background}
        animation={anim}
        onPress={edit}
        onDuplicate={duplicate}
        onRemove={remove}
        onExport={onOpen}
      />
    ),
    [duplicate, edit, onOpen, remove, theme]
  );

  return (
    <>
      {/* TODO GLView is crashing when used in FlatList */}
      {/* <FlatList
        style={gs.fullWidth}
        bg="gray"
        rounded="lg"
        p={2}
        data={animations}
        renderItem={renderItem}
        initialNumToRender={8}
        windowSize={11}
      /> */}
      <ScrollView
        style={BaseStyles.fullSizeFlex}
        contentContainerStyle={AppStyles.listContentContainer}
        stickyHeaderIndices={[0]}
      >
        <FastHStack alignItems="center" justifyContent="space-between">
          <FastButton>Sort</FastButton>
          <IconButton icon="add" onPress={createAnimation} />
        </FastHStack>
        {animations.map((anim) => renderItem({ item: anim }))}
      </ScrollView>

      {/* Action sheet for exporting an animation */}
      <ExportEntityActionsheet isOpen={isOpen} onClose={onClose} />
    </>
  );
}

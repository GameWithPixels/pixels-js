import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  EditAnimation,
  EditAnimationSimple,
} from "@systemic-games/pixels-edit-animation";
import {
  getAnimationTitle,
  useDisclose,
  AnimationCard,
  PixelAppPage,
  SwipeableButtons,
} from "@systemic-games/react-native-pixels-components";
import { ScrollView } from "native-base";
import React from "react";
import { Swipeable } from "react-native-gesture-handler";

import {
  useAppAddAnimation,
  useAppAnimations,
  useAppRemoveAnimation,
} from "~/app/hooks";
import CreateEntityButton from "~/components/CreateEntityButton";
import { ExportEntityActionsheet } from "~/components/ExportEntityActionsheet";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import generateUuid from "~/features/generateUuid";
import DieRenderer from "~/features/render3d/DieRenderer";
import { AnimationsListScreenProps } from "~/navigation";

interface AnimationSwipeableCardProps {
  animation: Readonly<EditAnimation>;
  onPress: (anim: Readonly<EditAnimation>) => void;
  onRemove: (anim: Readonly<EditAnimation>) => void;
  onDuplicate: (anim: Readonly<EditAnimation>) => void;
  onExport: (anim: Readonly<EditAnimation>) => void;
}

const AnimationSwipeableCard = React.memo(function ({
  animation,
  onPress,
  onRemove,
  onDuplicate,
  onExport,
}: AnimationSwipeableCardProps) {
  const onPressMemo = React.useMemo(
    () => () => onPress(animation),
    [animation, onPress]
  );
  const title = React.useMemo(
    () => getAnimationTitle(animation.type),
    [animation.type]
  );

  // Swipeable right buttons
  const buttons = React.useMemo(
    () => [
      {
        onPress: () => onDuplicate(animation),
        bg: "blue.500",
        children: <MaterialIcons name="content-copy" size={24} color="white" />,
      },
      {
        onPress: () => onExport(animation),
        bg: "amber.500",
        children: (
          <MaterialCommunityIcons
            name="export-variant"
            size={24}
            color="white"
          />
        ),
      },
      {
        onPress: () => onRemove(animation),
        bg: "red.500",
        children: (
          <MaterialIcons name="delete-outline" size={24} color="white" />
        ),
      },
    ],
    [animation, onDuplicate, onExport, onRemove]
  );
  const renderActions = React.useCallback(
    () => <SwipeableButtons width={195} buttons={buttons} />,
    [buttons]
  );

  // Die render
  const dieRenderer = React.useCallback(
    () => <DieRenderer renderData={getCachedDataSet(animation)} />,
    [animation]
  );

  const containerStyle = React.useMemo(() => ({ marginVertical: 4 }), []);

  return (
    <Swipeable
      containerStyle={containerStyle}
      renderRightActions={renderActions}
    >
      <AnimationCard
        onPress={onPressMemo}
        name={animation.name}
        title={title}
        dieRenderer={dieRenderer}
        w="100%"
        h={100}
        imageSize={90}
        borderWidth={1}
      />
    </Swipeable>
  );
});

function AnimationsList({
  navigation,
}: {
  navigation: AnimationsListScreenProps["navigation"];
}) {
  const animations = useAppAnimations();
  const addAnimation = useAppAddAnimation();
  const removeAnimation = useAppRemoveAnimation();

  const duplicateAnimation = React.useCallback(
    (anim: Readonly<EditAnimation>) => {
      // Copy the animation that needs to be duplicated
      const dupAnim = anim.duplicate(generateUuid());
      dupAnim.name += " copy";
      // Insert in list after the original animation
      addAnimation(dupAnim, anim);
    },
    [addAnimation]
  );

  const editAnimation = React.useCallback(
    (anim: Readonly<EditAnimation>) =>
      navigation.navigate("AnimationEdit", {
        animationUuid: anim.uuid,
      }),
    [navigation]
  );

  // Export action sheet
  const { isOpen, onOpen, onClose } = useDisclose();

  const renderItem = React.useCallback(
    ({ item: anim }: { item: Readonly<EditAnimation> }) => (
      <AnimationSwipeableCard
        key={anim.uuid}
        animation={anim}
        onPress={editAnimation}
        onDuplicate={duplicateAnimation}
        onRemove={removeAnimation}
        onExport={onOpen}
      />
    ),
    [duplicateAnimation, editAnimation, onOpen, removeAnimation]
  );

  return (
    <>
      {/* TODO GLView is crashing when used in FlatList */}
      {/* <FlatList
        data={animations}
        renderItem={renderItem}
        initialNumToRender={8}
        windowSize={11}
        w="100%"
        bg="gray.700"
        rounded="lg"
        p={2}
      /> */}
      <ScrollView w="100%" bg="gray.700" rounded="lg" p={2}>
        {animations.map((anim) => renderItem({ item: anim }))}
      </ScrollView>
      {/* Action sheet for exporting an animation */}
      <ExportEntityActionsheet isOpen={isOpen} onClose={onClose} />
    </>
  );
}

export default function AnimationsListScreen({
  navigation,
}: AnimationsListScreenProps) {
  const addAnimation = useAppAddAnimation();
  const createAnimation = React.useCallback(
    () =>
      addAnimation(
        new EditAnimationSimple({
          uuid: generateUuid(),
          name: "New Animation",
        })
      ),
    [addAnimation]
  );

  return (
    <PixelAppPage>
      <CreateEntityButton onPress={createAnimation}>
        ADD NEW LIGHTING PATTERN
      </CreateEntityButton>
      <AnimationsList navigation={navigation} />
    </PixelAppPage>
  );
}

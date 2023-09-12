import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import {
  getAnimationTitle,
  AnimationCard,
  SwipeableButtons,
  BaseBoxProps,
} from "@systemic-games/react-native-pixels-components";
import React from "react";
import { Swipeable } from "react-native-gesture-handler";

import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";

export interface AnimationSwipeableCardProps extends BaseBoxProps {
  animation: Readonly<EditAnimation>;
  onPress: (anim: Readonly<EditAnimation>) => void;
  onRemove: (anim: Readonly<EditAnimation>) => void;
  onDuplicate: (anim: Readonly<EditAnimation>) => void;
  onExport: (anim: Readonly<EditAnimation>) => void;
}

export function AnimationSwipeableCard({
  animation,
  onPress,
  onRemove,
  onDuplicate,
  onExport,
  ...props
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
        bg: "blue",
        children: <MaterialIcons name="content-copy" size={24} color="white" />,
      },
      {
        onPress: () => onExport(animation),
        bg: "amber",
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
        bg: "red",
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

  return (
    <Swipeable renderRightActions={renderActions}>
      <AnimationCard
        onPress={onPressMemo}
        name={animation.name}
        title={title}
        dieRenderer={dieRenderer}
        {...props}
      />
    </Swipeable>
  );
}

import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  SwipeableButtons,
  FastBoxProps,
  ProfileCard,
} from "@systemic-games/react-native-pixels-components";
import React from "react";
import { Swipeable } from "react-native-gesture-handler";

import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";

export interface ProfileSwipeableCardProps extends FastBoxProps {
  profile: Readonly<EditProfile>;
  onPress: (profile: Readonly<EditProfile>) => void;
  onFavoriteAddOrRemove: (profile: Readonly<EditProfile>) => void;
  favoriteAction: "add" | "remove";
  onRemove: (profile: Readonly<EditProfile>) => void;
  onDuplicate: (profile: Readonly<EditProfile>) => void;
  onExport: (profile: Readonly<EditProfile>) => void;
}

export function ProfileSwipeableCard({
  profile,
  onPress,
  onFavoriteAddOrRemove,
  favoriteAction,
  onRemove,
  onDuplicate,
  onExport,
  ...props
}: ProfileSwipeableCardProps) {
  const onPressMemo = React.useMemo(
    () => () => onPress(profile),
    [profile, onPress]
  );

  // Swipeable left buttons
  const leftButtons = React.useMemo(
    () => [
      {
        onPress: () => onFavoriteAddOrRemove(profile),
        bg: "purple",
        children: (
          <MaterialCommunityIcons
            name={
              favoriteAction === "add"
                ? "bookmark-plus-outline"
                : "bookmark-remove-outline"
            }
            size={30}
            color="white"
          />
        ),
      },
    ],
    [favoriteAction, onFavoriteAddOrRemove, profile]
  );
  const renderLeftActions = React.useCallback(
    () => <SwipeableButtons width={85} buttons={leftButtons} />,
    [leftButtons]
  );

  // Swipeable right buttons
  const rightButtons = React.useMemo(
    () => [
      {
        onPress: () => onDuplicate(profile),
        bg: "blue",
        children: <MaterialIcons name="content-copy" size={24} color="white" />,
      },
      {
        onPress: () => onExport(profile),
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
        onPress: () => onRemove(profile),
        bg: "red",
        children: (
          <MaterialIcons name="delete-outline" size={24} color="white" />
        ),
      },
    ],
    [onDuplicate, onExport, onRemove, profile]
  );
  const renderRightActions = React.useCallback(
    () => <SwipeableButtons width={195} buttons={rightButtons} />,
    [rightButtons]
  );

  // Die render
  const dieRenderer = React.useCallback(
    () => <DieRenderer renderData={getCachedDataSet(profile)} />,
    [profile]
  );

  const hasSound = React.useMemo(() => profile.hasSound, [profile]);
  const hasWebRequest = React.useMemo(() => profile.hasWebRequest, [profile]);

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <ProfileCard
        onPress={onPressMemo}
        name={profile.name}
        description={profile.description}
        dieRenderer={dieRenderer}
        dieViewSize="100%"
        flexDir="row"
        hasSound={hasSound}
        hasWebRequest={hasWebRequest}
        {...props}
      />
    </Swipeable>
  );
}

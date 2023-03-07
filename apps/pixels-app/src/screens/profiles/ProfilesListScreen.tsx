import {
  MaterialIcons,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  PixelAppPage,
  useDisclose,
  FastHStack,
  SwipeableButtons,
  DetailedProfileCard,
} from "@systemic-games/react-native-pixels-components";
import { Text, ScrollView, View } from "native-base";
import React from "react";
import { Swipeable } from "react-native-gesture-handler";

import {
  useAppAddProfile,
  useAppProfiles,
  useAppRemoveProfile,
} from "~/app/hooks";
import CreateEntityButton from "~/components/CreateEntityButton";
import { ExportEntityActionsheet } from "~/components/ExportEntityActionsheet";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import generateUuid from "~/features/generateUuid";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfilesListScreenProps } from "~/navigation";

interface ProfileSwipeableCardProps {
  profile: Readonly<EditProfile>;
  onPress: (profile: Readonly<EditProfile>) => void;
  onFavoriteAddOrRemove: (profile: Readonly<EditProfile>) => void;
  favoriteAction: "add" | "remove";
  onRemove: (profile: Readonly<EditProfile>) => void;
  onDuplicate: (profile: Readonly<EditProfile>) => void;
  onExport: (profile: Readonly<EditProfile>) => void;
}

function ProfileSwipeableCard({
  profile,
  onPress,
  onFavoriteAddOrRemove,
  favoriteAction,
  onRemove,
  onDuplicate,
  onExport,
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
        bg: "purple.500",
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
        bg: "blue.500",
        children: <MaterialIcons name="content-copy" size={24} color="white" />,
      },
      {
        onPress: () => onExport(profile),
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
        onPress: () => onRemove(profile),
        bg: "red.500",
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

  const containerStyle = React.useMemo(() => ({ marginVertical: 4 }), []);

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      containerStyle={containerStyle}
    >
      <DetailedProfileCard
        onPress={onPressMemo}
        name={profile.name}
        description={profile.description}
        dieRenderer={dieRenderer}
        hasSound={false}
        w="100%"
        h={100}
        imageSize={70}
        borderWidth={1}
      />
    </Swipeable>
  );
}

function ProfilesList({
  navigation,
}: {
  navigation: ProfilesListScreenProps["navigation"];
}) {
  const profiles = useAppProfiles();
  const addProfile = useAppAddProfile();
  const removeProfile = useAppRemoveProfile();

  const editProfile = React.useCallback(
    (profile: Readonly<EditProfile>) =>
      navigation.navigate("ProfileRules", {
        profileUuid: profile.uuid,
      }),
    [navigation]
  );

  // List of favorite profiles
  const [favoriteProfilesList, _setFavoritesProfileList] = React.useState<
    EditProfile[]
  >([]);

  const duplicateProfile = React.useCallback(
    (profile: Readonly<EditProfile>) => {
      // Copy the profile that needs to be duplicated
      const dupProfile = profile.duplicate(generateUuid());
      dupProfile.name += " copy";
      // Insert in list after the original profile
      addProfile(dupProfile, profile);
    },
    [addProfile]
  );

  const addToFavorites = React.useCallback(
    (_profileToFavorite: Readonly<EditProfile>) => {
      // const favoriteProfile = profileToFavorite;
      // // Remove profile from common list
      // const profileToFavoriteKey = EditableStore.getKey(profileToFavorite);
      // profileList.splice(
      //   profileList.findIndex((profileToFavorite) => {
      //     return EditableStore.getKey(profileToFavorite) === profileToFavoriteKey;
      //   }),
      //   1
      // );
      // // Add profile to favorite list
      // setFavoritesProfileList([...favoriteProfilesList, favoriteProfile]);
    },
    []
  );

  const removeFromFavorites = React.useCallback(
    (_profileToRemove: Readonly<EditProfile>) => {
      // const profileToDeleteKey = EditableStore.getKey(profileToRemove);
      // const profiles = [...favoriteProfilesList];
      // profiles.splice(
      //   profiles.findIndex((profileToDelete) => {
      //     return EditableStore.getKey(profileToDelete) === profileToDeleteKey;
      //   }),
      //   1
      // );
      // setFavoritesProfileList(profiles);
      // setProfileList((profileList) => [...profileList, profileToRemove]);
    },
    []
  );

  // Export action sheet
  const { isOpen, onOpen, onClose } = useDisclose();

  return (
    <>
      <ScrollView>
        <FastHStack my={2} p={2} alignItems="center">
          <AntDesign name="staro" size={24} color="white" />
          <Text ml={3} bold>
            Favorites:
          </Text>
        </FastHStack>

        <View p={2} rounded="lg" bg="gray.700">
          {favoriteProfilesList.map((profile) => (
            <ProfileSwipeableCard
              key={profile.uuid}
              profile={profile}
              onPress={editProfile}
              onFavoriteAddOrRemove={removeFromFavorites}
              favoriteAction="remove"
              onDuplicate={duplicateProfile}
              onRemove={removeProfile}
              onExport={onOpen}
            />
          ))}
        </View>

        <FastHStack my={2} alignItems="center">
          <AntDesign name="profile" size={24} color="white" />
          <Text ml={3} bold>
            Profiles list:
          </Text>
        </FastHStack>

        <View p={2} rounded="lg" bg="gray.700">
          {profiles.map((profile) => (
            <ProfileSwipeableCard
              key={profile.uuid}
              profile={profile}
              onPress={editProfile}
              onFavoriteAddOrRemove={addToFavorites}
              favoriteAction="add"
              onDuplicate={duplicateProfile}
              onRemove={removeProfile}
              onExport={onOpen}
            />
          ))}
        </View>
      </ScrollView>

      {/* Action sheet for exporting a profile */}
      <ExportEntityActionsheet isOpen={isOpen} onClose={onClose} />
    </>
  );
}

export function ProfilesListScreen({ navigation }: ProfilesListScreenProps) {
  const addProfile = useAppAddProfile();
  const createProfile = React.useCallback(
    () =>
      addProfile(
        new EditProfile({
          uuid: generateUuid(),
          name: "New Profile",
        })
      ),
    [addProfile]
  );

  return (
    <PixelAppPage>
      <CreateEntityButton onPress={createProfile}>
        ADD NEW PROFILE
      </CreateEntityButton>
      <ProfilesList navigation={navigation} />
    </PixelAppPage>
  );
}

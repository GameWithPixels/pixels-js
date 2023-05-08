import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  useDisclose,
  FastHStack,
  FastButton,
  BaseStyles,
} from "@systemic-games/react-native-pixels-components";
import React from "react";
import { ScrollView } from "react-native";
import { useTheme } from "react-native-paper";

import { ProfileSwipeableCard } from "./ProfileSwipeableCard";

import AppStyles from "~/AppStyles";
import {
  useAppAddProfile,
  useAppProfiles,
  useAppRemoveProfile,
} from "~/app/hooks";
import { ExportEntityActionsheet } from "~/components/ExportEntityActionsheet";
import IconButton from "~/components/IconButton";
import generateUuid from "~/features/generateUuid";
import { ProfilesListScreenProps } from "~/navigation";

export function ProfilesList({
  navigation,
}: {
  navigation: ProfilesListScreenProps["navigation"];
}) {
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

  const profiles = useAppProfiles();
  const add = useAppAddProfile();
  const remove = useAppRemoveProfile();

  const edit = React.useCallback(
    (profile: Readonly<EditProfile>) =>
      navigation.navigate("ProfileEdit", {
        profileUuid: profile.uuid,
      }),
    [navigation]
  );

  // List of favorite profiles
  const [favoriteProfilesList, _setFavoritesProfileList] = React.useState<
    EditProfile[]
  >([]);

  const duplicate = React.useCallback(
    (profile: Readonly<EditProfile>) => {
      // Copy the profile that needs to be duplicated
      const dupProfile = profile.duplicate(generateUuid());
      dupProfile.name += " copy";
      // Insert in list after the original profile
      add(dupProfile, profile);
    },
    [add]
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

  // Profile card
  const theme = useTheme();
  const renderItem = React.useCallback(
    ({ item: profile }: { item: Readonly<EditProfile> }) => (
      <ProfileSwipeableCard
        key={profile.uuid}
        w="100%"
        h={100}
        borderRadius={(theme.isV3 ? 5 : 1) * theme.roundness}
        borderWidth={1}
        borderColor={theme.colors.primary}
        bg={theme.colors.background}
        profile={profile}
        onPress={edit}
        onFavoriteAddOrRemove={addToFavorites}
        favoriteAction="add"
        onDuplicate={duplicate}
        onRemove={remove}
        onExport={onOpen}
      />
    ),
    [addToFavorites, duplicate, edit, onOpen, remove, theme]
  );

  return (
    <>
      <ScrollView
        style={BaseStyles.fullSizeFlex}
        contentContainerStyle={AppStyles.listContentContainer}
        stickyHeaderIndices={[0]}
      >
        {/* <FastHStack my={1} p={2} alignItems="center" gap={5}>
          <AntDesign name="staro" size={24} color="white" />
          <Text variant="headlineLarge">Favorites:</Text>
        </FastHStack>

        <RoundedBox p={1} mt={2} bg="gray">
          {favoriteProfilesList.map((profile) => (
            <ProfileSwipeableCard
              key={profile.uuid}
              profile={profile}
              onPress={edit}
              onFavoriteAddOrRemove={removeFromFavorites}
              favoriteAction="remove"
              onDuplicate={duplicate}
              onRemove={remove}
              onExport={onOpen}
            />
          ))}
        </RoundedBox>

        <FastHStack my={1} mt={5} alignItems="center" gap={5}>
          <AntDesign name="profile" size={24} color="white" />
          <Text variant="headlineLarge">Profiles list:</Text>
        </FastHStack> */}

        <FastHStack alignItems="center" justifyContent="space-between">
          <FastButton>Sort</FastButton>
          <IconButton icon="add" onPress={createProfile} />
        </FastHStack>
        {profiles.map((profile) => renderItem({ item: profile }))}
      </ScrollView>

      {/* Action sheet for exporting a profile */}
      <ExportEntityActionsheet isOpen={isOpen} onClose={onClose} />
    </>
  );
}

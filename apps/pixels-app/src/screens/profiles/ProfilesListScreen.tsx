import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  Card,
  ProfileCardProps,
  DetailedProfileCard,
  createSwipeableSideButton,
  PixelAppPage,
  useDisclose,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  Center,
  HStack,
  VStack,
  Text,
  Spacer,
  Pressable,
  ScrollView,
  Actionsheet,
} from "native-base";
import React from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";

import {
  useAppAddProfile,
  useAppProfiles,
  useAppRemoveProfile,
} from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import generateUuid from "~/features/generateUuid";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfilesListScreenProps } from "~/navigation";

/**
 * Custom profile card widget for the option to create a new profile.
 * @param props See {@link ProfileCardProps} for props parameters.
 */
function CreateProfileWidget(
  props: Omit<ProfileCardProps, "profileName" | "dieRender">
) {
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
        space={props.space}
        borderWidth={props.borderWidth}
      >
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text isTruncated fontSize={props.textSize} bold>
          ADD NEW PROFILE
        </Text>
      </Card>
    </Pressable>
  );
}

export function ProfilesListScreen({ navigation }: ProfilesListScreenProps) {
  const profiles = useAppProfiles();
  const addProfile = useAppAddProfile();
  const removeProfile = useAppRemoveProfile();

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

  // Action sheet
  const { isOpen, onOpen, onClose } = useDisclose();

  const openExportSheet = React.useCallback(
    (_profileToFavorite: Readonly<EditProfile>) => {
      onOpen();
    },
    [onOpen]
  );

  return (
    <>
      <PixelAppPage>
        <VStack space={3}>
          <HStack alignItems="center" paddingRight={2}>
            <Text bold fontSize="md">
              Profiles :
            </Text>
            <Spacer />
            <Text fontSize="md">Select a profile to edit</Text>
          </HStack>
          <Center
            width="100%"
            h="95%"
            px={1}
            py={1}
            alignSelf="center"
            rounded="lg"
          >
            <Box h="100%">
              <ScrollView>
                <VStack space={2}>
                  <HStack p={1} space={3} alignItems="center">
                    <AntDesign name="staro" size={24} color="white" />
                    <Text bold>Favorites:</Text>
                  </HStack>
                  <VStack p={2} rounded="lg" bg="gray.700">
                    {favoriteProfilesList.map((profile) => (
                      <Box p={1} key={profile.uuid}>
                        <Swipeable
                          renderLeftActions={createSwipeableSideButton({
                            w: 85,
                            buttons: [
                              {
                                onPress: () => removeFromFavorites(profile),
                                bg: "purple.500",
                                icon: (
                                  <MaterialCommunityIcons
                                    name="bookmark-remove-outline"
                                    size={30}
                                    color="white"
                                  />
                                ),
                              },
                            ],
                          })}
                          renderRightActions={createSwipeableSideButton({
                            w: 195,
                            buttons: [
                              {
                                onPress: () => duplicateProfile(profile),
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
                                onPress: () => openExportSheet(profile),
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
                                onPress: () => removeProfile(profile),
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
                          <DetailedProfileCard
                            w="100%"
                            h={110}
                            imageSize={70}
                            dieRender={() => (
                              <DieRenderer
                                renderData={getCachedDataSet(profile)}
                              />
                            )}
                            textSize="md"
                            profileName={profile.name}
                            borderWidth={1}
                            profileWithSound={false}
                            onPress={() => {
                              console.error("PROFILE SELECTED!");
                            }}
                          />
                        </Swipeable>
                      </Box>
                    ))}
                  </VStack>

                  <HStack space={3} alignItems="center">
                    <AntDesign name="profile" size={24} color="white" />
                    <Box paddingTop={2}>
                      <Text bold>Profiles list :</Text>
                    </Box>
                  </HStack>
                  <VStack p={2} rounded="lg" bg="gray.700">
                    {profiles.map((profile) => (
                      <Box p={1} key={profile.uuid}>
                        <Swipeable
                          renderLeftActions={createSwipeableSideButton({
                            w: 85,
                            buttons: [
                              {
                                onPress: () => addToFavorites(profile),
                                bg: "purple.500",
                                icon: (
                                  <MaterialCommunityIcons
                                    name="bookmark-plus-outline"
                                    size={30}
                                    color="white"
                                  />
                                ),
                              },
                            ],
                          })}
                          renderRightActions={createSwipeableSideButton({
                            w: 195,
                            buttons: [
                              {
                                onPress: () => duplicateProfile(profile),
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
                                onPress: () => openExportSheet(profile),
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
                                onPress: () => removeProfile(profile),
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
                          <DetailedProfileCard
                            w="100%"
                            h={110}
                            imageSize={70}
                            dieRender={() => (
                              <DieRenderer
                                renderData={getCachedDataSet(
                                  profile as EditProfile // TODO readonly profile
                                )}
                              />
                            )}
                            textSize="md"
                            profileName={profile.name}
                            borderWidth={1}
                            profileWithSound={false}
                            onPress={() =>
                              navigation.navigate("ProfileRules", {
                                profileUuid: profile.uuid,
                              })
                            }
                          />
                        </Swipeable>
                      </Box>
                    ))}
                  </VStack>
                  <Box p={1}>
                    <CreateProfileWidget
                      onPress={() =>
                        addProfile(
                          new EditProfile({
                            uuid: generateUuid(),
                            name: "New Profile",
                          })
                        )
                      }
                    />
                  </Box>
                </VStack>
              </ScrollView>
            </Box>
          </Center>
        </VStack>
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

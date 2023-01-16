import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  createPixelTheme,
  PixelTheme,
  PxAppPage,
  ProfileInfo,
  Card,
  ProfileCardProps,
  DetailedProfileCard,
  createSwipeableSideButton,
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
  useDisclose,
} from "native-base";
import React from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { ProfilesScreenParamList } from "~/Navigation";

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
const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);

const profiles: ProfileInfo[] = [
  {
    profileName: "Profile 1",
    imageRequirePath: require("../../../../assets/RainbowDice.png"),
    profileKey: 2938792834,
  },
  {
    profileName: "Profile 2",
    imageRequirePath: require("../../../../assets/BlueDice.png"),
    profileWithSound: true,
    profileKey: 2347367,
  },
  {
    profileName: "Profile 3",
    imageRequirePath: require("../../../../assets/YellowDice.png"),
    profileWithSound: true,
    profileKey: 97942039,
  },
];

const defaultProfile: ProfileInfo = {
  profileName: "DEFAULT PROFILE",
  imageRequirePath: require("../../../../assets/UI_Icons/D10.png"),
};

/**
 * Custom profile card widget for the option to create a new profile.
 * @param props See {@link ProfileCardProps} for props parameters.
 */
function CreateProfileWidget(props: ProfileCardProps) {
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
          ADD NEW PROFILE
        </Text>
      </Card>
    </Pressable>
  );
}

export function ProfilesListScreen() {
  const navigation =
    useNavigation<StackNavigationProp<ProfilesScreenParamList>>();

  const [profileList, setProfileList] = React.useState<ProfileInfo[]>(profiles);
  // List of favorite profiles
  const [favoriteProfilesList, setFavoritesProfileList] = React.useState<
    ProfileInfo[]
  >([]);

  function addProfile(profileToAdd: ProfileInfo) {
    const newProfile = { ...profileToAdd };
    const profileKey = Math.random() * 1000;
    newProfile.profileKey = profileKey;
    setProfileList([...profileList, newProfile]);
  }

  /**
   * Duplicate an existing profile by updating the profileList.
   * @param profileToDuplicate Profile infos of the profile to duplicate.
   * @param index Index of the profile to duplicate.
   */
  function duplicateProfile(profileToDuplicate: ProfileInfo, index: number) {
    const duplicateProfile = { ...profileToDuplicate };
    duplicateProfile.profileName = profileToDuplicate.profileName + " (COPY)";
    duplicateProfile.profileKey = Math.random() * 1000;
    profileList.splice(index + 1, 0, duplicateProfile);
    setProfileList([...profileList]);
  }

  function deleteProfile(profileToDelete: ProfileInfo) {
    const profileToDeleteKey = profileToDelete.profileKey;
    profileList.splice(
      profileList.findIndex((profileToDelete) => {
        return profileToDelete.profileKey === profileToDeleteKey;
      }),
      1
    );
    setProfileList([...profileList]);
  }

  function addToFavorites(profileToFavorite: ProfileInfo) {
    console.log("added to favorites");
    const favoriteProfile = { ...profileToFavorite };
    // Remove profile from common list
    const profileToFavoriteKey = profileToFavorite.profileKey;
    profileList.splice(
      profileList.findIndex((profileToFavorite) => {
        return profileToFavorite.profileKey === profileToFavoriteKey;
      }),
      1
    );
    console.log("added to favorites");
    // Add profile to favorite list
    setFavoritesProfileList([...favoriteProfilesList, favoriteProfile]);
  }

  function openExportSheet(_profileToExport: ProfileInfo) {
    onOpen();
    //DO OTHER THINGS
  }

  const { isOpen, onOpen, onClose } = useDisclose();

  return (
    <>
      <PxAppPage theme={paleBluePixelTheme} scrollable={false}>
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
                    <Text bold>Favorites :</Text>
                  </HStack>
                  <VStack p={2} rounded="lg" bg="gray.700">
                    {favoriteProfilesList.map((profile, i) => (
                      <Box p={1} key={profile.profileKey}>
                        <Swipeable
                          renderLeftActions={createSwipeableSideButton({
                            w: 85,
                            buttons: [
                              {
                                onPress: () => addToFavorites(profile),
                                bg: "purple.500",
                                icon: (
                                  <AntDesign
                                    name="staro"
                                    size={24}
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
                                onPress: () => duplicateProfile(profile, i),
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
                                onPress: () => deleteProfile(profile),
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
                            imageRequirePath={profile.imageRequirePath}
                            textSize="md"
                            profileName={profile.profileName}
                            borderWidth={1}
                            profileWithSound={profile.profileWithSound}
                            onPress={() => {
                              // navigation.navigate("ProfileEditRuleScreen");
                              navigation.navigate("ProfileRulesScreen");
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
                    {profileList.map((profile, i) => (
                      <Box p={1} key={profile.profileKey}>
                        <Swipeable
                          renderLeftActions={createSwipeableSideButton({
                            w: 85,
                            buttons: [
                              {
                                onPress: () => addToFavorites(profile),
                                bg: "purple.500",
                                icon: (
                                  <AntDesign
                                    name="staro"
                                    size={24}
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
                                onPress: () => duplicateProfile(profile, i),
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
                                onPress: () => deleteProfile(profile),
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
                            imageRequirePath={profile.imageRequirePath}
                            textSize="md"
                            profileName={profile.profileName}
                            borderWidth={1}
                            profileWithSound={profile.profileWithSound}
                            onPress={() => {
                              // navigation.navigate("ProfileEditRuleScreen");
                              navigation.navigate("ProfileRulesScreen");
                            }}
                          />
                        </Swipeable>
                      </Box>
                    ))}
                  </VStack>
                  <Box p={1}>
                    <CreateProfileWidget
                      onPress={() => {
                        addProfile(defaultProfile);
                      }}
                    />
                  </Box>
                </VStack>
              </ScrollView>
            </Box>
          </Center>
        </VStack>
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

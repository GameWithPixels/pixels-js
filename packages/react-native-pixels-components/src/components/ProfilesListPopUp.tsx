import { Feather } from "@expo/vector-icons";
import { Card } from "@systemic-games/react-native-base-components";
import {
  Actionsheet,
  Box,
  Center,
  HStack,
  Pressable,
  ScrollView,
  Text,
  useDisclose,
} from "native-base";
import React from "react";

import { ProfileCard, ProfileInfo } from "./ProfileCard";

export interface ProfilesPopUpListProps {
  ProfilesInfo?: ProfileInfo[];
}
export function ProfilesListPopUp(props: ProfilesPopUpListProps) {
  const [selectedProfile, SetSelectedProfile] = React.useState<number>();
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <Pressable
        onPress={() => {
          onOpen();
        }}
      >
        <Card
          minW="10px"
          minH="10px"
          w="110px"
          p={1}
          h="90px"
          alignItems="center"
          verticalSpace={1}
        >
          <Center w="90%" flexWrap="wrap">
            <Text bold fontSize="sm" alignSelf="center">
              More
            </Text>
            <Text bold fontSize="sm" alignSelf="center">
              Profiles
            </Text>
          </Center>
          <Center>
            <Feather name="more-horizontal" size={35} color="white" />
          </Center>
        </Card>
      </Pressable>
      {/* <PopUp
        bg="pixelColors.softBlack"
        w="100%"
        title="Available Profiles"
        isOpen={showProfiles}
        buttons={["Apply", "Cancel"]}
        onClose={(result) => {
          SetShowProfiles(false);
          //Here check "result" and use corresponding action
        }}
      >
        <HStack flexWrap="wrap">
          {props.ProfilesInfo?.map((profileInfo, i) => (
            <Box key={i} p={1}>
              <ProfileCard
                w="105px"
                h="130px"
                verticalSpace={1}
                imageSize={70}
                selectable
                profileIndexInList={i}
                selectedProfileIndex={selectedProfile}
                onSelected={SetSelectedProfile}
                profileName={profileInfo.profileName}
                imageRequirePath={profileInfo.imageRequirePath}
              />
            </Box>
          ))}
        </HStack>
      </PopUp> */}

      <Actionsheet isOpen={isOpen} onClose={onClose} alignContent="center">
        <Actionsheet.Content maxH="100%" h="630px">
          <Text bold paddingBottom={5}>
            Available Profiles
          </Text>
          <ScrollView>
            <HStack flexWrap="wrap" w="100%">
              {props.ProfilesInfo?.map((profileInfo, i) => (
                <Box key={i} p={1}>
                  <ProfileCard
                    w="105px"
                    h="130px"
                    verticalSpace={1}
                    imageSize={70}
                    selectable
                    profileIndexInList={i}
                    selectedProfileIndex={selectedProfile}
                    onSelected={SetSelectedProfile}
                    profileName={profileInfo.profileName}
                    imageRequirePath={profileInfo.imageRequirePath}
                  />
                </Box>
              ))}
            </HStack>
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

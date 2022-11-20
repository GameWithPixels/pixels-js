import { Feather } from "@expo/vector-icons";
import { Card, PopUp } from "@systemic-games/react-native-base-components";
import { Box, Center, HStack, Pressable, Text } from "native-base";
import React from "react";

import { ProfileCard, ProfileInfo } from "./ProfileCard";

export interface ProfilesPopUpListProps {
  ProfilesInfo?: ProfileInfo[];
}
export function ProfilesListPopUp(props: ProfilesPopUpListProps) {
  const [selectedProfile, SetSelectedProfile] = React.useState<number>();
  const [showPopUp, SetShowPopUp] = React.useState(false);
  return (
    <>
      {/* <Button
        bg="pixelColors.highlightGray"
        rightIcon={<AddIcon />}
        onPress={() => SetShowPopUp(true)}
      >
        More profiles
      </Button> */}
      <Pressable onPress={() => SetShowPopUp(true)}>
        <Card
          minW="10px"
          minH="10px"
          w="110px"
          h="100px"
          alignItems="center"
          verticalSpace={4}
        >
          <Center>
            <Text bold fontSize="xs">
              More Profiles
            </Text>
          </Center>
          <Center>
            <Feather name="more-horizontal" size={35} color="white" />
          </Center>
        </Card>
      </Pressable>
      <PopUp
        bg="pixelColors.softBlack"
        w="100%"
        title="Available Profiles"
        isOpen={showPopUp}
        buttons={["Apply", "Cancel"]}
        onClose={(result) => {
          SetShowPopUp(false);
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
      </PopUp>
    </>
  );
}

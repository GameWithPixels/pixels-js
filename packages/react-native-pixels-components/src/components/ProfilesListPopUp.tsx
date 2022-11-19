import { PopUp } from "@systemic-games/react-native-base-components";
import { AddIcon, Box, Button, HStack } from "native-base";
import React from "react";

import { ProfileCard, ProfileInfo } from "./ProfilesScrollList";

export interface ProfilesPopUpListProps {
  ProfilesInfo?: ProfileInfo[];
}
export function ProfilesListPopUp(props: ProfilesPopUpListProps) {
  const [selectedProfile, SetSelectedProfile] = React.useState<number>();
  const [showPopUp, SetShowPopUp] = React.useState(false);
  return (
    <>
      <Button
        bg="pixelColors.highlightGray"
        rightIcon={<AddIcon />}
        onPress={() => SetShowPopUp(true)}
      >
        More profiles
      </Button>
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
              />
            </Box>
          ))}
        </HStack>
      </PopUp>
    </>
  );
}

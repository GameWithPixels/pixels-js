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
  console.log(showPopUp);
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
        buttons={["cancel", "apply", "close"]}
        onClose={(result) => {
          SetShowPopUp(false);
          console.log("result :" + result);
          //Here check "result" and use corresponding action
        }}
      >
        <HStack flexWrap="wrap">
          {props.ProfilesInfo?.map((profileInfo, i) => (
            <Box key={i} p={2}>
              <ProfileCard
                w="100px"
                h="130px"
                verticalSpace={0}
                imageSize={20}
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

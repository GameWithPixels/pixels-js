import { EditProfile } from "@systemic-games/pixels-edit-animation";
import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import React from "react";

import { ProfilesList } from "./components/ProfilesList";

import { useAppAddProfile } from "~/app/hooks";
import CreateEntityButton from "~/components/CreateEntityButton";
import generateUuid from "~/features/generateUuid";
import { ProfilesListScreenProps } from "~/navigation";

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

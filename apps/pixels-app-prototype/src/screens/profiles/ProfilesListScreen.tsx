import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import React from "react";

import { ProfilesList } from "./components/ProfilesList";

import { ProfilesListScreenProps } from "~/navigation";

export function ProfilesListScreen({ navigation }: ProfilesListScreenProps) {
  return (
    <PixelAppPage>
      <ProfilesList navigation={navigation} />
    </PixelAppPage>
  );
}

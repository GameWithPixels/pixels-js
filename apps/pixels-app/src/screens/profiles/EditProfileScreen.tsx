import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { IconButton } from "react-native-paper";

import { EditProfile } from "./components/EditProfile";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { getFavoriteIcon } from "~/components/icons";
import { useProfile, useProfiles } from "~/hooks";
import { EditProfileScreenProps, ProfilesStackParamList } from "~/navigation";

function EditProfilePage({
  navigation,
  profileUuid,
}: {
  profileUuid: string;
  navigation: StackNavigationProp<ProfilesStackParamList>;
}) {
  const { profiles, removeProfile } = useProfiles();
  const { name, favorite } = useProfile(profileUuid, profiles);
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  const deleteProfile = React.useCallback(() => {
    removeProfile(profileUuid);
    goBack();
  }, [goBack, profileUuid, removeProfile]);
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        mode="chevron-down"
        title={name}
        onGoBack={goBack}
        rightElement={() => (
          <IconButton
            icon={getFavoriteIcon(favorite)}
            size={20}
            onPress={() => {}}
          />
        )}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile
          profileUuid={profileUuid}
          showActionButtons
          onDelete={deleteProfile}
        />
      </GHScrollView>
    </View>
  );
}

export function EditProfileScreen({
  route: {
    params: { profileUuid },
  },
  navigation,
}: EditProfileScreenProps) {
  return (
    <AppBackground>
      <EditProfilePage profileUuid={profileUuid} navigation={navigation} />
    </AppBackground>
  );
}

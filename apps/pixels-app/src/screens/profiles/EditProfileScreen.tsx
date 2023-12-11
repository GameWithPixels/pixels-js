import { StackNavigationProp } from "@react-navigation/stack";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Button } from "react-native-paper";

import { EditProfile } from "./components/EditProfile";
import { RuleIndex } from "./components/RuleCard";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import {
  discardEditableProfile,
  useCommitEditableProfile,
  useConfirmActionSheet,
  useEditableProfile,
  useEditProfilesList,
} from "~/hooks";
import { EditProfileScreenProps, ProfilesStackParamList } from "~/navigation";

const Header = observer(function ({
  profile,
  commitChanges,
  discardChanges,
}: {
  profile: Profiles.Profile;
  commitChanges: () => void;
  discardChanges: () => void;
}) {
  return (
    <PageHeader
      mode="chevron-down"
      title={profile.name}
      leftElement={() => <Button onPress={commitChanges}>Save</Button>}
      rightElement={() => (
        // <IconButton
        //   icon={getFavoriteIcon(profile.favorite)}
        //   size={20}
        //   onPress={() => {}}
        // />
        <Button onPress={discardChanges}>Discard</Button>
      )}
    />
  );
});

function EditProfilePage({
  profileUuid,
  navigation,
}: {
  profileUuid: string;
  navigation: StackNavigationProp<ProfilesStackParamList>;
}) {
  const profile = useEditableProfile(profileUuid);
  const { removeProfile } = useEditProfilesList();
  const commitProfile = useCommitEditableProfile();
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  const commitChanges = React.useCallback(() => {
    commitProfile(profileUuid);
    goBack();
  }, [commitProfile, goBack, profileUuid]);
  const showConfirmDiscard = useConfirmActionSheet("Discard changes", () => {
    discardEditableProfile(profileUuid);
    goBack();
  });
  const editRule = React.useCallback(
    (ruleIndex: RuleIndex) => {
      if (ruleIndex.conditionType === "rolled") {
        navigation.navigate("editRollRules", ruleIndex);
      } else {
        navigation.navigate("editRule", ruleIndex);
      }
    },
    [navigation]
  );
  const editAdvancedRules = React.useCallback(
    () => navigation.navigate("editAdvancedRules", { profileUuid }),
    [navigation, profileUuid]
  );
  const showConfirmDelete = useConfirmActionSheet("Delete", () => {
    removeProfile(profileUuid);
    goBack();
  });
  return (
    <View style={{ height: "100%" }}>
      <Header
        profile={profile}
        commitChanges={commitChanges}
        discardChanges={() => showConfirmDiscard()}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile
          showActionButtons
          profileUuid={profileUuid}
          onEditRule={editRule}
          onEditAdvancedRules={editAdvancedRules}
          onDelete={() => showConfirmDelete()}
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

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
  useCommitEditableProfile,
  useConfirmActionSheet,
  useEditableProfile,
  useEditProfilesList,
} from "~/hooks";
import { EditProfileScreenProps } from "~/navigation";

const Header = observer(function ({
  profile,
  commitChanges,
  discardChanges,
  confirmDiscard,
}: {
  profile: Profiles.Profile;
  commitChanges: () => void;
  discardChanges?: () => void;
  confirmDiscard?: () => void;
}) {
  const onCancel = profile.isModified ? confirmDiscard : discardChanges;
  return (
    <PageHeader
      mode="chevron-down"
      title={profile.name}
      leftElement={() => onCancel && <Button onPress={onCancel}>Cancel</Button>}
      rightElement={
        profile.isModified
          ? () => (
              // <IconButton
              //   icon={getFavoriteIcon(profile.favorite)}
              //   size={20}
              //   onPress={() => {}}
              // />
              <Button onPress={commitChanges}>Done</Button>
            )
          : undefined
      }
    />
  );
});

function EditProfilePage({
  profileUuid,
  alwaysSave,
  navigation,
}: {
  profileUuid: string;
  alwaysSave?: boolean;
  navigation: EditProfileScreenProps["navigation"];
}) {
  const profile = useEditableProfile(profileUuid);
  const { removeProfile } = useEditProfilesList();
  const { commitProfile, discardProfile } = useCommitEditableProfile();
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  const commitChanges = React.useCallback(() => {
    commitProfile(profileUuid);
    goBack();
  }, [commitProfile, goBack, profileUuid]);
  const discardChanges = React.useCallback(() => {
    discardProfile(profileUuid);
    goBack();
  }, [discardProfile, goBack, profileUuid]);
  const showConfirmDiscard = useConfirmActionSheet(
    "Discard changes",
    discardChanges
  );
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
        discardChanges={alwaysSave ? undefined : discardChanges}
        confirmDiscard={alwaysSave ? undefined : showConfirmDiscard}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile
          showActionButtons
          profileUuid={profileUuid}
          onEditRule={editRule}
        />
      </GHScrollView>
    </View>
  );
}

export function EditProfileScreen({
  route: {
    params: { profileUuid, alwaysSave },
  },
  navigation,
}: EditProfileScreenProps) {
  return (
    <AppBackground>
      <EditProfilePage
        profileUuid={profileUuid}
        alwaysSave={alwaysSave}
        navigation={navigation}
      />
    </AppBackground>
  );
}

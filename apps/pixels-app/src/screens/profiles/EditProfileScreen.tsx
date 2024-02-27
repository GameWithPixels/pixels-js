import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { Platform, Pressable, View, useWindowDimensions } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

import { EditProfile } from "./components/EditProfile";
import { ProfileMenu } from "./components/ProfileMenu";
import { RuleIndex } from "./components/RuleCard";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { makeTransparent } from "~/components/colors";
import { transferProfile } from "~/features/dice";
import {
  useCommitEditableProfile,
  useConfirmActionSheet,
  useEditableProfile,
  useEditProfilesList,
  useProfile,
} from "~/hooks";
import { EditProfileScreenProps } from "~/navigation";

const Header = observer(function Header({
  profile,
  noDiscard,
  onCommitChanges,
  onDiscardChanges,
  onAdvancedOptions,
  onDeleteProfile,
}: {
  profile: Profiles.Profile;
  noDiscard?: boolean;
  onCommitChanges: () => void;
  onDiscardChanges: () => void;
  onAdvancedOptions: () => void;
  onDeleteProfile?: () => void;
}) {
  const [renameVisible, setRenameVisible] = React.useState(false);
  const [editedName, setEditedName] = React.useState("");
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const color = actionsMenuVisible
    ? colors.onSurfaceDisabled
    : colors.onSurface;

  const showConfirmDiscard = useConfirmActionSheet(
    "Discard changes",
    onDiscardChanges
  );

  const initialLastChanged = useProfile(profile.uuid).lastChanged;
  const isModified =
    profile.lastChanged.getTime() !== initialLastChanged.getTime();
  const activatedDiceCount = useAppSelector(
    (state) =>
      state.pairedDice.paired.filter((d) => d.profileUuid === profile.uuid)
        .length
  );

  return (
    <PageHeader
      leftElement={
        noDiscard
          ? undefined
          : () => (
              <Button
                sentry-label="cancel-edit-profile"
                onPress={
                  isModified ? () => showConfirmDiscard() : onDiscardChanges
                }
              >
                Cancel
              </Button>
            )
      }
      rightElement={
        noDiscard ?? isModified
          ? () => (
              <Button
                sentry-label="commit-edit-profile"
                onPress={onCommitChanges}
              >
                Done
              </Button>
            )
          : undefined
      }
    >
      {renameVisible ? (
        <TextInput
          mode="flat"
          dense
          autoFocus
          maxLength={20}
          selectTextOnFocus={Platform.OS !== "android"} // keyboard not appearing on Android
          style={{ marginHorizontal: 60, textAlign: "center" }}
          value={editedName}
          onChangeText={setEditedName}
          onEndEditing={() => {
            const name = editedName.trim();
            if (name.length) {
              runInAction(() => (profile.name = name));
            }
            setRenameVisible(false);
          }}
        />
      ) : (
        <Pressable
          sentry-label="profile-menu"
          style={{
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
          onPress={() => setActionsMenuVisible(true)}
        >
          <Text variant="bodyLarge" style={{ paddingHorizontal: 5, color }}>
            {profile.name}
          </Text>
          <ChevronDownIcon
            size={18}
            color={color}
            backgroundColor={makeTransparent(colors.onBackground, 0.2)}
            style={{ marginBottom: 3 }}
          />
          <ProfileMenu
            visible={actionsMenuVisible}
            anchor={{ x: (windowWidth - 230) / 2, y: 40 }}
            onDismiss={() => setActionsMenuVisible(false)}
            onRename={() => {
              setEditedName(profile.name);
              setRenameVisible(true);
            }}
            onAdvancedOptions={onAdvancedOptions}
            onDelete={onDeleteProfile}
            activatedDiceCount={activatedDiceCount}
          />
        </Pressable>
      )}
    </PageHeader>
  );
});

function EditProfilePage({
  profileUuid,
  noDiscard,
  navigation,
}: {
  profileUuid: string;
  noDiscard?: boolean;
  navigation: EditProfileScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();

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

  const showConfirmDelete = useConfirmActionSheet("Delete", () => {
    // First leave the page so it won't try accessing the profile that's being deleted
    goBack();
    removeProfile(profileUuid);
  });

  return (
    <View style={{ height: "100%" }}>
      <Header
        profile={profile}
        noDiscard={noDiscard}
        onCommitChanges={commitChanges}
        onDiscardChanges={discardChanges}
        onAdvancedOptions={() =>
          navigation.navigate("editAdvancedSettings", { profileUuid })
        }
        onDeleteProfile={showConfirmDelete}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
        automaticallyAdjustKeyboardInsets
      >
        <EditProfile
          profileUuid={profileUuid}
          onEditRule={editRule}
          onTransfer={(pixel) => {
            commitProfile(profileUuid);
            transferProfile(pixel, profile, appDispatch);
          }}
        />
      </GHScrollView>
    </View>
  );
}

export function EditProfileScreen({
  route: {
    params: { profileUuid, noDiscard },
  },
  navigation,
}: EditProfileScreenProps) {
  return (
    <AppBackground>
      <EditProfilePage
        profileUuid={profileUuid}
        noDiscard={noDiscard}
        navigation={navigation}
      />
    </AppBackground>
  );
}

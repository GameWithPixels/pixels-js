import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

import { EditProfile } from "./components/EditProfile";
import { ProfileMenu } from "./components/ProfileMenu";
import { RuleIndex } from "./components/RuleCard";

import { useAppStore } from "~/app/hooks";
import { EditProfileScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { makeTransparent } from "~/components/colors";
import { Library, readProfile } from "~/features/store";
import { isSameBrightness } from "~/hackGetDieBrightness";
import {
  useCommitEditableProfile,
  useConfirmActionSheet,
  useEditableProfile,
  useEditableProfileStore,
  useEditProfilesList,
  useIsEditableProfileModified,
  useUpdateProfiles,
} from "~/hooks";

function saveChangesAlert(args: {
  onSave: () => void;
  onDiscard: () => void;
}): void {
  Alert.alert(
    "Edited Profile",
    "Do you want to save the changes made to this library profile?",
    [
      {
        text: "Yes",
        style: "default",
        onPress: args.onSave,
      },
      {
        text: "No",
        style: "destructive",
        onPress: args.onDiscard,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]
  );
}

function updateDiceAlert(args: {
  diceNames: readonly string[];
  onSave: () => void;
  onDiscard: () => void;
}): void {
  const { diceNames } = args;
  const names =
    diceNames.length === 1
      ? `die ${diceNames[0]}`
      : `dice ${diceNames.join(", ")}`;
  Alert.alert(
    "Modified Profile",
    `This library profile has been modified since it was copied to ${names}.\n\n` +
      `Do you want to copy the changes to ${diceNames.length === 1 ? "this die" : "those dice"}?`,
    [
      {
        text: "Yes",
        style: "default",
        onPress: args.onSave,
      },
      {
        text: "No",
        style: "cancel",
        onPress: args.onDiscard,
      },
    ]
  );
}

const Header = observer(function Header({
  profile,
  onCommitChanges,
  onDiscardChanges,
  onAdvancedOptions,
  onDeleteProfile,
}: {
  profile: Profiles.Profile;
  onCommitChanges: () => void;
  onDiscardChanges?: () => void;
  onAdvancedOptions: () => void;
  onDeleteProfile?: () => void;
}) {
  const isModified = useIsEditableProfileModified(profile.uuid);
  const [renameVisible, setRenameVisible] = React.useState(false);
  const [editedName, setEditedName] = React.useState("");
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const color = actionsMenuVisible
    ? colors.onSurfaceDisabled
    : colors.onSurface;

  const showConfirmDiscard = useConfirmActionSheet(
    "Discard Profile changes",
    onDiscardChanges
  );
  return (
    <PageHeader
      leftElement={
        !onDiscardChanges
          ? undefined
          : () => (
              <Button
                sentry-label="cancel-edit-profile"
                disabled={!isModified}
                onPress={() =>
                  isModified ? showConfirmDiscard() : onDiscardChanges()
                }
              >
                Cancel
              </Button>
            )
      }
      rightElement={() => (
        <Button
          sentry-label="commit-edit-profile"
          onPress={() => onCommitChanges()}
        >
          Done
        </Button>
      )}
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
          />
        </Pressable>
      )}
    </PageHeader>
  );
});

function EditProfilePage({
  profileUuid,
  onCommitChanges,
  onDiscardChanges,
  navigation,
}: {
  profileUuid: string;
  onCommitChanges: (opt?: { stayOnScreen?: boolean }) => void;
  onDiscardChanges?: () => void;
  navigation: EditProfileScreenProps["navigation"];
}) {
  const store = useAppStore();
  const profile = useEditableProfile(profileUuid);
  const { removeProfile } = useEditProfilesList();

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

  const showConfirmDelete = useConfirmActionSheet("Delete Profile", () => {
    // First leave the page so it won't try accessing the profile that's being deleted
    navigation.goBack();
    removeProfile(profileUuid);
  });

  return (
    <View style={{ height: "100%" }}>
      <Header
        profile={profile}
        onCommitChanges={onCommitChanges}
        onDiscardChanges={onDiscardChanges}
        onAdvancedOptions={() =>
          navigation.navigate("editAdvancedSettings", { profileUuid })
        }
        onDeleteProfile={showConfirmDelete}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile
          profileUuid={profileUuid}
          onEditRule={editRule}
          onProgramDie={(pairedDie) => {
            // Save profile
            onCommitChanges({ stayOnScreen: true });
            // Update die profile
            const profileData =
              store.getState().library.profiles.entities[profile.uuid];
            if (profileData) {
              store.dispatch(
                Library.Profiles.update({
                  ...profileData,
                  uuid: pairedDie.profileUuid,
                  sourceUuid: profile.uuid,
                  // It's possible to use a profile from another die type
                  // (ex: D00 & D10 share the same profiles)
                  dieType: pairedDie.dieType,
                })
              );
              // Update profile instance
              readProfile(pairedDie.profileUuid, store.getState().library);
            }
          }}
        />
      </GHScrollView>
    </View>
  );
}

function SaveProfileOnLeave({
  profileUuid,
  navigation,
  noDiscard,
}: {
  profileUuid: string;
  navigation: EditProfileScreenProps["navigation"];
  noDiscard?: boolean;
}) {
  const store = useAppStore();
  const profileStore = useEditableProfileStore(profileUuid);
  const commitProfile = useCommitEditableProfile(profileUuid);
  const updateProfiles = useUpdateProfiles();

  const discardRef = React.useRef(false);
  const discardChanges = React.useCallback(() => {
    // TODO find a better way to tag that we're not saving
    discardRef.current = true;
    navigation.goBack();
  }, [navigation]);
  const commitChanges = React.useCallback(
    (opt?: { stayOnScreen?: boolean }) => {
      commitProfile();
      if (!opt?.stayOnScreen) {
        navigation.goBack();
      }
    },
    [commitProfile, navigation]
  );

  React.useEffect(() => {
    // Ask user if they want to update the source profile
    return navigation.addListener("beforeRemove", (e) => {
      if (discardRef.current) {
        discardRef.current = false;
        return;
      }
      const getUpdateDice = () => {
        const { profiles } = store.getState().library;
        const profileData = profiles.entities[profileUuid];
        const dice = store.getState().pairedDice.paired.filter((d) => {
          const dieProfileData = profiles.entities[d.profileUuid];
          return (
            dieProfileData?.sourceUuid === profileUuid &&
            (dieProfileData.hash !== profileData?.hash ||
              !isSameBrightness(
                dieProfileData.brightness,
                profileData.brightness
              ))
          );
        });
        return profileData && dice.length
          ? () => {
              updateDiceAlert({
                diceNames: dice.map((d) => d.name),
                onSave: () => {
                  updateProfiles(
                    profileData,
                    dice.map((d) => d.profileUuid)
                  );
                  navigation.dispatch(e.data.action);
                },
                onDiscard: () => navigation.dispatch(e.data.action),
              });
              return true;
            }
          : undefined;
      };
      // First check if profile was modified
      if (profileStore.version > 0) {
        e.preventDefault();
        saveChangesAlert({
          onSave: () => {
            commitProfile();
            // Once saved check if dice need to be updated
            const askUpdateDice = getUpdateDice();
            if (askUpdateDice) {
              askUpdateDice();
            } else {
              navigation.dispatch(e.data.action);
            }
          },
          onDiscard: () => navigation.dispatch(e.data.action),
        });
      } else {
        // If unmodified or already saved, check if dice need to be updated
        const askUpdateDice = getUpdateDice();
        if (askUpdateDice) {
          e.preventDefault();
          askUpdateDice();
        }
      }
    });
  }, [
    commitProfile,
    navigation,
    profileStore,
    profileUuid,
    store,
    updateProfiles,
  ]);

  return (
    <EditProfilePage
      profileUuid={profileUuid}
      onCommitChanges={commitChanges}
      onDiscardChanges={noDiscard ? undefined : discardChanges}
      navigation={navigation}
    />
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
      <SaveProfileOnLeave
        profileUuid={profileUuid}
        noDiscard={noDiscard}
        navigation={navigation}
      />
    </AppBackground>
  );
}

import { runInAction } from "mobx";
import React from "react";
import { Alert, Pressable, useWindowDimensions, View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import {
  Button,
  Dialog,
  DialogProps,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { EditProfile } from "../profiles/components/EditProfile";
import { ProfileMenu } from "../profiles/components/ProfileMenu";
import { RuleIndex } from "../profiles/components/RuleCard";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector, useAppStore } from "~/app/hooks";
import { EditDieProfileScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { makeTransparent } from "~/components/colors";
import {
  generateProfileUuid,
  getCompatibleDieTypes,
} from "~/features/profiles";
import { Library, readProfile } from "~/features/store";
import { logError } from "~/features/utils";
import { isSameBrightness } from "~/hackGetDieBrightness";
import {
  commitEditableProfile,
  useEditableProfileStore,
  useSetSelectedPairedDie,
  useUpdateProfiles,
} from "~/hooks";

function updateLibraryAlert(args: {
  profileName: string;
  onSave: () => void;
  onDiscard: () => void;
}): void {
  Alert.alert(
    "Modified Profile",
    `This die profile has been modified since it was copied from ${args.profileName}.\n\n` +
      "Do you want to copy the changes back to the library profile?",
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

function SaveToLibraryDialog({
  profileUuid,
  ...props
}: {
  profileUuid: string;
} & Omit<DialogProps, "children"> &
  Required<Pick<DialogProps, "onDismiss">>) {
  const store = useAppStore();
  const profileStore = useEditableProfileStore(profileUuid);
  const [name, setName] = React.useState("");
  React.useEffect(() => setName(""), [props.visible]);
  return (
    <Portal>
      <Dialog {...props}>
        <Dialog.Title>Save to Library</Dialog.Title>
        <Dialog.Content style={{ gap: 10 }}>
          <Text variant="bodyMedium">
            Enter the name of the profile to create in the library:
          </Text>
          <TextInput
            label="Profile Name"
            value={name}
            onChangeText={(text) => setName(text)}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => props.onDismiss()}>Cancel</Button>
          <Button
            disabled={!name.trim()}
            onPress={() => {
              const { profiles } = store.getState().library;
              const profileName = name.trim();
              const profileData = profiles.entities[profileUuid];
              if (profileData && profileName.length) {
                if (
                  profiles.ids.find(
                    (uuid) => profiles.entities[uuid]?.name === profileName
                  )
                ) {
                  Alert.alert(
                    "Name Not Available",
                    `A profile named "${profileName}" already exists in the library. Please choose a different name.`
                  );
                  return;
                }
                const profile = profileStore.object;
                if (profile) {
                  // Save to library
                  const uuid = generateProfileUuid(store.getState().library);
                  store.dispatch(
                    Library.Profiles.add({
                      ...profileData,
                      uuid,
                      name: profileName,
                      // Make sure we don't reference another profile
                      sourceUuid: undefined,
                      // We don't have d00 and pd6 profiles in the library
                      dieType: getCompatibleDieTypes(profileData.dieType)[0],
                    })
                  );
                  // Create non editable instance of the profile
                  readProfile(uuid, store.getState().library);
                  // Update die profile to use the library profile as its source
                  runInAction(() => (profile.name = profileName));
                  commitEditableProfile(profile, store, uuid);
                } else {
                  logError("No editable profile to assign name and source");
                }
              }
              props.onDismiss();
            }}
          >
            Ok
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function EditDieProfilePage({
  pairedDie,
  navigation,
}: {
  pairedDie: PairedDie;
  navigation: EditDieProfileScreenProps["navigation"];
}) {
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

  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const [saveToLibraryVisible, setSaveToLibraryVisible] = React.useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const color = actionsMenuVisible
    ? colors.onSurfaceDisabled
    : colors.onSurface;
  return (
    <View style={{ height: "100%" }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        <Pressable
          sentry-label="actions-menu"
          style={{
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
          onPress={() => setActionsMenuVisible(true)}
        >
          <Text variant="bodyLarge" style={{ paddingHorizontal: 5, color }}>
            {`${pairedDie.name}'s Profile`}
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
            onSaveToLibrary={() => setSaveToLibraryVisible(true)}
            onAdvancedOptions={() =>
              navigation.navigate("editAdvancedSettings", {
                profileUuid: pairedDie.profileUuid,
              })
            }
          />
        </Pressable>
      </PageHeader>
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile
          profileUuid={pairedDie.profileUuid}
          unnamed
          onEditRule={editRule}
        />
      </GHScrollView>
      <SaveToLibraryDialog
        visible={saveToLibraryVisible}
        onDismiss={() => setSaveToLibraryVisible(false)}
        profileUuid={pairedDie.profileUuid}
      />
    </View>
  );
}

function SaveProfileOnLeave({
  children,
  profileUuid,
  navigation,
}: React.PropsWithChildren<{
  profileUuid: string;
  navigation: EditDieProfileScreenProps["navigation"];
}>) {
  const store = useAppStore();
  const updateProfiles = useUpdateProfiles();
  const sourceUuid = useAppSelector(
    (state) => state.library.profiles.entities[profileUuid]?.sourceUuid
  );
  const profileStore = useEditableProfileStore(profileUuid);
  React.useEffect(() => {
    if (sourceUuid) {
      // When modified, ask user if they want to copy
      // the die profile over to the source profile.
      // Note: it might be unmodified but different from the source
      // profile if previous changes were not copied back.
      return navigation.addListener("beforeRemove", (e) => {
        const { profiles } = store.getState().library;
        const profileData = profiles.entities[profileUuid];
        const dstUuid = profileData?.sourceUuid;
        const dstProfileData = dstUuid && profiles.entities[dstUuid];
        // Ask to copy over source profile
        if (
          dstUuid &&
          dstProfileData &&
          // Check profile was edited
          profileStore.version > 0 &&
          // Check if different than the source profile
          (profileData.hash !== dstProfileData.hash ||
            !isSameBrightness(
              profileData.brightness,
              dstProfileData.brightness
            ))
        ) {
          e.preventDefault();
          updateLibraryAlert({
            profileName: profileData.name,
            onSave: () => {
              updateProfiles(profileData, [dstUuid]);
              navigation.dispatch(e.data.action);
            },
            onDiscard: () => navigation.dispatch(e.data.action),
          });
        }
      });
    }
  }, [
    navigation,
    profileStore,
    profileUuid,
    sourceUuid,
    store,
    updateProfiles,
  ]);
  return <>{children}</>;
}

export function EditDieProfileScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: EditDieProfileScreenProps) {
  const pairedDie = useSetSelectedPairedDie(pixelId);
  React.useEffect(() => {
    if (!pairedDie) {
      navigation.goBack();
    }
  }, [pairedDie, navigation]);
  return !pairedDie ? null : (
    <AppBackground>
      <SaveProfileOnLeave
        profileUuid={pairedDie.profileUuid}
        navigation={navigation}
      >
        <EditDieProfilePage pairedDie={pairedDie} navigation={navigation} />
        <SelectedPixelTransferProgressBar />
      </SaveProfileOnLeave>
    </AppBackground>
  );
}

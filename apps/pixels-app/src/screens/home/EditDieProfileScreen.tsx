import React from "react";
import { Alert, Pressable, useWindowDimensions, View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { EditProfile } from "../profiles/components/EditProfile";
import { ProfileMenu } from "../profiles/components/ProfileMenu";
import { RuleIndex } from "../profiles/components/RuleCard";

import { PairedDie } from "~/app/PairedDie";
import { useAppStore } from "~/app/hooks";
import { EditDieProfileScreenProps } from "~/app/navigation";
import { pairedDiceSelectors } from "~/app/store";
import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { makeTransparent } from "~/components/colors";
import { generateProfileUuid } from "~/features/profiles";
import { Library } from "~/features/store";
import { isSameBrightness } from "~/hackGetDieBrightness";
import {
  usePairedDieProfileUuid,
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

function EditDieProfilePage({
  pairedDie,
  navigation,
}: {
  pairedDie: PairedDie;
  navigation: EditDieProfileScreenProps["navigation"];
}) {
  const store = useAppStore();
  const profileUuid = usePairedDieProfileUuid(pairedDie);

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
  const [name, setName] = React.useState("");

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
            onSaveToLibrary={() => {
              setName("");
              setSaveToLibraryVisible(true);
            }}
            onAdvancedOptions={() =>
              navigation.navigate("editAdvancedSettings", { profileUuid })
            }
          />
        </Pressable>
      </PageHeader>
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
        automaticallyAdjustKeyboardInsets
      >
        <EditProfile profileUuid={profileUuid} unnamed onEditRule={editRule} />
      </GHScrollView>
      <Portal>
        <Dialog
          visible={saveToLibraryVisible}
          onDismiss={() => setSaveToLibraryVisible(false)}
        >
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
            <Button onPress={() => setSaveToLibraryVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                const profileData =
                  store.getState().library.profiles.entities[profileUuid];
                if (profileData) {
                  // Save to library
                  const uuid = generateProfileUuid(store.getState().library);
                  store.dispatch(
                    Library.Profiles.add({
                      ...profileData,
                      uuid,
                      name,
                      // Make sure we don't reference another profile
                      sourceUuid: undefined,
                      // We don't have d00 and pd6 profiles in the library
                      dieType:
                        profileData.dieType === "d00"
                          ? "d10"
                          : profileData.dieType === "d6pipped"
                            ? "d6"
                            : profileData.dieType,
                    })
                  );
                  // Update die profile to use the saved profile as its source
                  store.dispatch(
                    Library.Profiles.update({
                      ...profileData,
                      name,
                      sourceUuid: uuid,
                    })
                  );
                }
                setSaveToLibraryVisible(false);
              }}
            >
              Ok
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

export function EditDieProfileScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: EditDieProfileScreenProps) {
  const store = useAppStore();
  const pairedDie = useSetSelectedPairedDie(pixelId);
  const updateProfiles = useUpdateProfiles();
  React.useEffect(() => {
    if (pairedDie) {
      // Ask user if they want to update the source profile
      return navigation.addListener("beforeRemove", (e) => {
        const die = pairedDiceSelectors.selectByPixelId(
          store.getState(),
          pixelId
        );
        const { profiles } = store.getState().library;
        const profileData = die && profiles.entities[die?.profileUuid];
        const dstUuid = profileData?.sourceUuid;
        const dstProfileData = dstUuid && profiles.entities[dstUuid];
        if (
          die &&
          dstProfileData &&
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
  }, [navigation, pairedDie, pixelId, store, updateProfiles]);
  if (!pairedDie) {
    navigation.goBack();
    return null;
  }
  return (
    <AppBackground>
      <EditDieProfilePage pairedDie={pairedDie} navigation={navigation} />
      <SelectedPixelTransferProgressBar />
    </AppBackground>
  );
}

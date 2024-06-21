import React from "react";
import { Alert, Pressable, useWindowDimensions, View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import {
  Button,
  Checkbox,
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
import { pairedDiceSelectors } from "~/app/store";
import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { makeTransparent } from "~/components/colors";
import { generateProfileUuid } from "~/features/profiles";
import { Library } from "~/features/store";
import {
  usePairedDieProfileUuid,
  useSetSelectedPairedDie,
  useUpdateProfiles,
} from "~/hooks";
import { EditDieProfileScreenProps } from "~/navigation";

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
  const [markAsSource, setMarkAsSource] = React.useState(false);
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
              setMarkAsSource(false);
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
          <Dialog.Content>
            <TextInput
              label="Profile Name"
              value={name}
              onChangeText={(text) => setName(text)}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Checkbox
                status={markAsSource ? "checked" : "unchecked"}
                onPress={() => setMarkAsSource(!markAsSource)}
              />
              <Text>Make it the source profile for the die</Text>
            </View>
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
                      sourceUuid: undefined, // Make sure we don't reference another profile
                    })
                  );
                  if (markAsSource) {
                    // Update die profile to use the saved profile as its source
                    store.dispatch(
                      Library.Profiles.add({
                        ...profileData,
                        sourceUuid: uuid,
                      })
                    );
                  }
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
            profileData.brightness !== dstProfileData.brightness)
        ) {
          e.preventDefault();
          Alert.alert(
            "Copy changes to original profile?",
            `You have made changes to this die profile, do you want to update '${profileData.name}' profile as well?`,
            [
              {
                text: "Yes",
                style: "default",
                onPress: () => {
                  updateProfiles(profileData, [dstUuid]);
                  navigation.dispatch(e.data.action);
                },
              },
              {
                text: "No",
                style: "cancel",
                onPress: () => navigation.dispatch(e.data.action),
              },
            ]
          );
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

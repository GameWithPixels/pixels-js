import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Button, Text, TextInput } from "react-native-paper";

import { useAppStore } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { TabsHeaders } from "~/components/TabsHeaders";
import { GradientChip } from "~/components/buttons";
import { ProfilesGrid } from "~/components/profile";
import {
  createProfileTemplates,
  generateProfileUuid,
  getProfileDieTypeLabel,
  ProfileDieTypes,
} from "~/features/profiles";
import {
  useBottomSheetPadding,
  useEditProfilesList,
  useProfilesList,
} from "~/hooks";
import { CreateProfileScreenProps } from "~/navigation";

const tabsNames = ["Builtin", "Dice", "Library"] as const;

function DieTypesSelector({
  selected,
  onSelect,
}: {
  selected: PixelDieType;
  onSelect: (dieType: PixelDieType) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 10,
        gap: 10,
      }}
    >
      {ProfileDieTypes.map((dieType) => (
        <GradientChip
          key={dieType}
          outline={dieType !== selected}
          style={{ minWidth: 60 }}
          onPress={() => onSelect(dieType)}
        >
          {getProfileDieTypeLabel(dieType)}
        </GradientChip>
      ))}
    </View>
  );
}

function CreateProfilePage({
  navigation,
}: {
  navigation: CreateProfileScreenProps["navigation"];
}) {
  const store = useAppStore();
  const { library: libraryProfiles, dice: diceProfiles } = useProfilesList();
  const { addProfile } = useEditProfilesList();

  const [dieType, setDieType] = React.useState<PixelDieType>("d20");
  const [profileName, setProfileName] = React.useState("");
  const [tab, setTab] = React.useState<(typeof tabsNames)[number]>(
    tabsNames[0]
  );
  const [selectedProfile, setSelectedProfile] =
    React.useState<Readonly<Profiles.Profile>>();

  const templates = React.useMemo(
    () => createProfileTemplates(dieType, store.getState().library),
    [dieType, store]
  );
  const profiles = React.useMemo(
    () =>
      (tab === "Builtin"
        ? templates
        : tab === "Dice"
          ? diceProfiles
          : libraryProfiles
      )
        .filter((p) => p.dieType === "unknown" || p.dieType === dieType)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [diceProfiles, dieType, libraryProfiles, tab, templates]
  );

  const createProfile = () => {
    const profile = selectedProfile ?? profiles[0];
    if (profile) {
      const newProfile = profile.duplicate(
        generateProfileUuid(store.getState().library)
      );
      newProfile.name = profileName.trim();
      newProfile.description = `Based on ${profile.name}`;
      newProfile.dieType = dieType;
      addProfile(newProfile);
      navigation.pop();
      navigation.navigate("editProfileStack", {
        screen: "editProfile",
        params: {
          profileUuid: newProfile.uuid,
          noDiscard: true,
        },
      });
    }
  };

  const paddingBottom = useBottomSheetPadding();
  return (
    <View style={{ height: "100%", paddingHorizontal: 10 }}>
      <PageHeader
        leftElement={() => (
          <Button
            sentry-label="cancel-new-profile"
            onPress={() => navigation.goBack()}
          >
            Cancel
          </Button>
        )}
        rightElement={() => (
          <Button
            disabled={!profileName.trim().length}
            sentry-label="create-profile"
            onPress={createProfile}
          >
            Create
          </Button>
        )}
      />
      <GHScrollView contentContainerStyle={{ paddingBottom, gap: 10 }}>
        <Text variant="titleMedium">Enter a name for your new profile:</Text>
        <TextInput
          mode="outlined"
          dense
          maxLength={20}
          style={{ marginHorizontal: 10 }}
          value={profileName}
          onChangeText={setProfileName}
        />
        <Text variant="titleMedium" style={{ marginTop: 10 }}>
          Select a die type:
        </Text>
        <DieTypesSelector
          selected={dieType}
          onSelect={(dt) => {
            setDieType(dt);
            setSelectedProfile(undefined);
          }}
        />
        <Text variant="titleMedium" style={{ marginTop: 10 }}>
          Select a template or an existing Profile to base your new Profile on:
        </Text>
        <TabsHeaders
          names={tabsNames}
          selected={tab}
          onSelect={(tab) => {
            setTab(tab);
            setSelectedProfile(undefined);
          }}
        />
        <ProfilesGrid
          profiles={profiles}
          selected={selectedProfile ?? profiles[0]}
          onSelectProfile={setSelectedProfile}
        />
      </GHScrollView>
    </View>
  );
}

export function CreateProfileScreen({ navigation }: CreateProfileScreenProps) {
  return (
    <AppBackground>
      <CreateProfilePage navigation={navigation} />
    </AppBackground>
  );
}

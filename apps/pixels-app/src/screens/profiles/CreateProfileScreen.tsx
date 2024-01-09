import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Button, Text, TextInput } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { GradientChip } from "~/components/buttons";
import { ProfilesGrid } from "~/components/profile";
import { getProfileDieTypeLabel } from "~/descriptions";
import { profileDieTypes } from "~/dieTypes";
import { FactoryProfile } from "~/features/FactoryProfile";
import generateUuid from "~/features/generateUuid";
import {
  useBottomSheetPadding,
  useEditProfilesList,
  useProfilesList,
} from "~/hooks";
import { CreateProfileScreenProps } from "~/navigation";

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
      {profileDieTypes.map((dieType) => (
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
  const profiles = useProfilesList();
  const { addProfile } = useEditProfilesList();
  const [dieType, setDieType] = React.useState<PixelDieType>("d20");
  const [profileName, setProfileName] = React.useState("");

  const blankProfile = React.useMemo(
    () =>
      FactoryProfile.addAdvancedRules(
        new Profiles.Profile({
          name: "Blank",
          description: "An empty profile",
          dieType,
        })
      ) as Readonly<Profiles.Profile>,
    [dieType]
  );
  const templates = React.useMemo(
    () =>
      [blankProfile].concat(
        profiles.filter((p) => !p.dieType || p.dieType === dieType)
      ),
    [blankProfile, dieType, profiles]
  );
  const [selectedProfile, setSelectedProfile] = React.useState(templates[0]);

  const createProfile = () => {
    const newProfile = selectedProfile.duplicate(generateUuid());
    newProfile.name = profileName.trim();
    newProfile.description =
      selectedProfile === blankProfile
        ? ""
        : `Based on ${selectedProfile.name}`;
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
  };
  const paddingBottom = useBottomSheetPadding();
  return (
    <View style={{ height: "100%", gap: 10, paddingHorizontal: 10 }}>
      <PageHeader
        leftElement={() => (
          <Button onPress={() => navigation.goBack()}>Cancel</Button>
        )}
        rightElement={() => (
          <Button disabled={!profileName.trim().length} onPress={createProfile}>
            Create
          </Button>
        )}
      />
      {/* <TabsHeaders names={tabsNames} selected={tab} onSelect={setTab} /> */}
      <Text variant="titleMedium">Enter a name for your new profile</Text>
      <TextInput
        mode="outlined"
        dense
        maxLength={20}
        style={{ marginHorizontal: 10 }}
        value={profileName}
        onChangeText={setProfileName}
      />
      <Text variant="titleMedium" style={{ marginTop: 10 }}>
        Select a die type
      </Text>
      <DieTypesSelector
        selected={dieType}
        onSelect={(dt) => {
          setDieType(dt);
          setSelectedProfile(templates[0]);
        }}
      />
      <Text variant="titleMedium" style={{ marginTop: 10 }}>
        Select a Profile to base your new Profile on
      </Text>
      <GHScrollView contentContainerStyle={{ paddingBottom }}>
        <ProfilesGrid
          profiles={templates}
          selected={selectedProfile}
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

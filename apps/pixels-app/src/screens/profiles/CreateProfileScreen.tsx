import { StackNavigationProp } from "@react-navigation/stack";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { TabsHeaders } from "~/components/TabsHeaders";
import { GradientChip, TightTextButton } from "~/components/buttons";
import { ProfilesGrid } from "~/components/profile";
import { getDieTypeLabel } from "~/descriptions";
import { sortedDieTypes } from "~/dieTypes";
import generateUuid from "~/features/generateUuid";
import { useEditProfilesList, useProfilesList } from "~/hooks";
import { CreateProfileScreenProps, ProfilesStackParamList } from "~/navigation";

const blankProfile: Readonly<Profiles.Profile> = new Profiles.Profile({
  uuid: generateUuid(),
  name: "Empty",
  description: "A blank profile",
  group: "template",
});

const tabsNames = ["Templates", "Profiles"];

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
      {sortedDieTypes.map((dieType) => (
        <GradientChip
          key={dieType}
          outline={dieType !== selected}
          style={{ minWidth: 60 }}
          onPress={() => onSelect(dieType)}
        >
          {getDieTypeLabel(dieType)}
        </GradientChip>
      ))}
    </View>
  );
}

function CreateProfilePage({
  navigation,
}: {
  navigation: StackNavigationProp<ProfilesStackParamList>;
}) {
  const profiles = useProfilesList();
  const { addProfile } = useEditProfilesList();
  const [tab, setTab] = React.useState(tabsNames[0]);
  const [dieType, setDieType] = React.useState<PixelDieType>("d20");
  const templates = React.useMemo(
    () => [
      [blankProfile].concat(
        profiles.filter(
          (p) =>
            (!p.dieType || p.dieType === dieType) &&
            p.group === blankProfile.group
        )
      ),
      profiles.filter(
        (p) =>
          (!p.dieType || p.dieType === dieType) &&
          p.group !== blankProfile.group
      ),
    ],
    [dieType, profiles]
  );
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        title="Select Template"
        rightElement={() => (
          <TightTextButton onPress={() => navigation.goBack()}>
            Cancel
          </TightTextButton>
        )}
      />
      <TabsHeaders names={tabsNames} selected={tab} onSelect={setTab} />
      <DieTypesSelector selected={dieType} onSelect={setDieType} />
      <GHScrollView contentContainerStyle={{ gap: 20, paddingBottom: 10 }}>
        <ProfilesGrid
          profiles={templates[tabsNames.indexOf(tab)]}
          onSelectProfile={(p) => {
            const newProfile = p.duplicate(generateUuid());
            newProfile.name = "New Profile";
            newProfile.description =
              p === blankProfile ? "" : `Based on ${p.name}`;
            newProfile.dieType = dieType;
            newProfile.group = "";
            addProfile(newProfile);
            const openEdit = () => {
              navigation.navigate("editProfile", {
                profileUuid: newProfile.uuid,
              });
              navigation.removeListener("focus", openEdit);
            };
            navigation.addListener("transitionEnd", openEdit);
            navigation.goBack();
          }}
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

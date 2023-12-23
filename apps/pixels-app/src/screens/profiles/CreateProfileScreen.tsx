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
import { getProfileDieTypeLabel } from "~/descriptions";
import { profileDieTypes } from "~/dieTypes";
import generateUuid from "~/features/generateUuid";
import { useEditProfilesList, useProfilesList } from "~/hooks";
import { CreateProfileScreenProps } from "~/navigation";

const blankProfile: Readonly<Profiles.Profile> = new Profiles.Profile({
  uuid: generateUuid(),
  name: "Empty",
  description: "A blank profile",
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
  const [tab, setTab] = React.useState(tabsNames[0]);
  const [dieType, setDieType] = React.useState<PixelDieType>("d20");
  const templates = React.useMemo(
    () => [
      [blankProfile].concat(
        profiles.filter((p) => !p.dieType || p.dieType === dieType)
      ),
      //profiles.slice(3).filter((p) => !p.dieType || p.dieType === dieType),
    ],
    [dieType, profiles]
  );
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        leftElement={() => (
          <TightTextButton onPress={() => navigation.goBack()}>
            Cancel
          </TightTextButton>
        )}
      >
        Select Template
      </PageHeader>
      {/* <TabsHeaders names={tabsNames} selected={tab} onSelect={setTab} /> */}
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
            addProfile(newProfile);
            navigation.pop();
            navigation.navigate("editProfileStack", {
              screen: "editProfile",
              params: {
                profileUuid: newProfile.uuid,
                noDiscard: true,
                editName: true,
              },
            });
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

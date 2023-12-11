import { StackNavigationProp } from "@react-navigation/stack";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { GradientButton, TightTextButton } from "~/components/buttons";
import { ProfilesGrid } from "~/components/profile";
import generateUuid from "~/features/generateUuid";
import { useEditProfilesList, useProfilesList } from "~/hooks";
import { CreateProfileScreenProps, ProfilesStackParamList } from "~/navigation";

const emptyProfileUuid = generateUuid();

function CreateProfilePage({
  navigation,
}: {
  navigation: StackNavigationProp<ProfilesStackParamList>;
}) {
  const profiles = useProfilesList();
  const { addProfile } = useEditProfilesList();
  const templates = React.useMemo(
    () => [
      [
        new Profiles.Profile({
          uuid: emptyProfileUuid,
          name: "Empty",
          description: "A blank profile",
        }),
        ...profiles.slice(0, 4),
      ],
      profiles.slice(4),
      profiles.filter((_, i) => i % 3),
    ],
    [profiles]
  );
  const filterNames = ["Templates", "Profiles", "Favorites"];
  const [filter, setFilter] = React.useState("Templates");
  const { roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
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
      <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 10 }}>
        <View
          style={{
            alignSelf: "center",
            flexDirection: "row",
            justifyContent: "flex-start",
          }}
        >
          {filterNames.map((f, i) => {
            return (
              <GradientButton
                key={f}
                style={{
                  borderTopLeftRadius: i === 0 ? borderRadius : 0,
                  borderBottomLeftRadius: i === 0 ? borderRadius : 0,
                  borderTopRightRadius:
                    i === filterNames.length - 1 ? borderRadius : 0,
                  borderBottomRightRadius:
                    i === filterNames.length - 1 ? borderRadius : 0,
                }}
                outline={f !== filter}
                onPress={() => setFilter(f)}
              >
                {f}
              </GradientButton>
            );
          })}
        </View>
        <ProfilesGrid
          profiles={templates[filterNames.indexOf(filter)]}
          onSelectProfile={(p) => {
            const newProfile = p.duplicate(generateUuid());
            newProfile.name = "New Profile";
            newProfile.description =
              p.uuid === emptyProfileUuid ? "" : `Based on ${p.name}`;
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
      </ScrollView>
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

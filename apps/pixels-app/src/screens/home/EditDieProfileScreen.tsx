import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePixelValue } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";

import { EditProfile } from "../profiles/components/EditProfile";
import { RuleIndex } from "../profiles/components/RuleCard";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { useActiveProfile, usePairedPixel } from "~/hooks";
import { EditDieProfileScreenProps, HomeStackParamList } from "~/navigation";

function EditDieProfilePage({
  pixelId,
  navigation,
}: {
  pixelId: number;
  navigation: NativeStackNavigationProp<HomeStackParamList>;
}) {
  const pixel = usePairedPixel(pixelId);
  const pixelName = usePixelValue(pixel, "name");
  const { activeProfile } = useActiveProfile(pixel);
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
  const profileUuid = activeProfile.uuid;
  const editAdvancedRules = React.useCallback(
    () => navigation.navigate("editAdvancedRules", { profileUuid }),
    [navigation, profileUuid]
  );
  if (!activeProfile) {
    // TODO create profile
    navigation.goBack();
    console.warn("No profile found for pixel", pixelId);
    return null;
  }
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        mode="chevron-down"
        title={`${pixelName}'s Profile`}
        onGoBack={() => navigation.goBack()}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile
          profileUuid={profileUuid}
          unnamed
          onEditRule={editRule}
          onEditAdvancedRules={editAdvancedRules}
        />
      </GHScrollView>
    </View>
  );
}

export function EditDieProfileScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: EditDieProfileScreenProps) {
  return (
    <AppBackground>
      <EditDieProfilePage pixelId={pixelId} navigation={navigation} />
    </AppBackground>
  );
}

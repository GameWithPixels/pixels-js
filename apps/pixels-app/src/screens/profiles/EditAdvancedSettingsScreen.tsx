import { observer } from "mobx-react-lite";
import React from "react";
import { View, ScrollView } from "react-native";

import { EditAdvancedRules } from "./components/EditAdvancedRules";
import { EditRuleCallback, SectionTitle } from "./components/RulesSection";

import { EditAdvancedSettingsScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { ProfileUsage as ProfileUsageStatic } from "~/components/ProfileUsage";
import { useEditableProfile } from "~/hooks";

const ProfileUsage = observer(ProfileUsageStatic);

function EditAdvancedSettingsPage({
  profileUuid,
  onEditRule,
  onGoBack,
}: {
  profileUuid: string;
  onEditRule: EditRuleCallback;
  onGoBack: () => void;
}) {
  const profile = useEditableProfile(profileUuid);
  return (
    <View style={{ height: "100%" }}>
      <PageHeader mode="arrow-left" onGoBack={onGoBack}>
        Advanced Settings
      </PageHeader>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 10,
          gap: 10,
        }}
      >
        <EditAdvancedRules profileUuid={profileUuid} onEditRule={onEditRule} />
        <SectionTitle>Information</SectionTitle>
        <ProfileUsage
          profile={profile}
          style={{ paddingLeft: 10, paddingBottom: 10 }}
        />
      </ScrollView>
    </View>
  );
}

export function EditAdvancedSettingsScreen({
  route: {
    params: { profileUuid },
  },
  navigation,
}: EditAdvancedSettingsScreenProps) {
  return (
    <AppBackground>
      <EditAdvancedSettingsPage
        profileUuid={profileUuid}
        onEditRule={(ruleIndex) => navigation.navigate("editRule", ruleIndex)}
        onGoBack={() => navigation.goBack()}
      />
      <SelectedPixelTransferProgressBar />
    </AppBackground>
  );
}

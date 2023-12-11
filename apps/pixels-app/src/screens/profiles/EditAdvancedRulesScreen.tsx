import React from "react";
import { View, ScrollView } from "react-native";

import { EditAdvancedRules } from "./components/EditAdvancedRules";
import { EditRuleCallback } from "./components/RulesSection";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { EditAdvancedRulesScreenProps } from "~/navigation";

function EditAdvancedRulesPage({
  profileUuid,
  onEditRule,
  onGoBack,
}: {
  profileUuid: string;
  onEditRule: EditRuleCallback;
  onGoBack: () => void;
}) {
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        mode="arrow-left"
        title="Advanced Rules"
        onGoBack={onGoBack}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 10,
          gap: 10,
        }}
      >
        <EditAdvancedRules profileUuid={profileUuid} onEditRule={onEditRule} />
      </ScrollView>
    </View>
  );
}

export function EditAdvancedRulesScreen({
  route: {
    params: { profileUuid },
  },
  navigation,
}: EditAdvancedRulesScreenProps) {
  return (
    <AppBackground>
      <EditAdvancedRulesPage
        profileUuid={profileUuid}
        onEditRule={(ruleIndex) => navigation.navigate("editRule", ruleIndex)}
        onGoBack={() => navigation.goBack()}
      />
    </AppBackground>
  );
}

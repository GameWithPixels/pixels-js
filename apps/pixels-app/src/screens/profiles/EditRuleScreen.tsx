import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View, ScrollView } from "react-native";

import { EditActionCard } from "./components/EditActionCard";
import { EditAdvancedRules } from "./components/EditProfile";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { getConditionTypeLabel } from "~/descriptions";
import { useProfiles, useRule } from "~/hooks";
import {
  EditAdvancedRulesScreenProps,
  EditProfileSubStackParamList,
  EditRuleScreenProps,
} from "~/navigation";
import { Action, ActionType, ActionTypeValues } from "~/temp";

function EditRulePage({
  profileUuid,
  ruleIndex,
  navigation,
}: {
  profileUuid: string;
  ruleIndex: number;
  navigation: StackNavigationProp<EditProfileSubStackParamList>;
}) {
  const { profiles } = useProfiles();
  const { condition } = useRule(profileUuid, ruleIndex, profiles);
  const actionTypes = React.useMemo(
    () =>
      (Object.keys(ActionTypeValues) as ActionType[])
        .filter((a) => a !== "none")
        .map((a) => new Action(a)),
    []
  );
  return (
    <>
      <View style={{ height: "100%" }}>
        <PageHeader
          mode="arrow-left"
          title={getConditionTypeLabel(condition.type)}
          onGoBack={() => navigation.goBack()}
        />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            padding: 10,
            paddingHorizontal: 10,
            gap: 20,
          }}
        >
          {actionTypes.map((a) => (
            <EditActionCard
              key={a.type}
              action={a}
              conditionType={condition.type}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

export function EditRuleScreen({
  route: {
    params: { profileUuid, ruleIndex },
  },
  navigation,
}: EditRuleScreenProps) {
  return (
    <AppBackground>
      <EditRulePage
        profileUuid={profileUuid}
        ruleIndex={ruleIndex}
        navigation={navigation}
      />
    </AppBackground>
  );
}

function EditAdvancedRulesPage({
  profileUuid,
  navigation,
}: {
  profileUuid: string;
  navigation: StackNavigationProp<EditProfileSubStackParamList>;
}) {
  return (
    <>
      <View style={{ height: "100%" }}>
        <PageHeader
          mode="arrow-left"
          title="Advanced Rules"
          onGoBack={() => navigation.goBack()}
        />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 10,
            gap: 10,
          }}
        >
          <EditAdvancedRules profileUuid={profileUuid} />
        </ScrollView>
      </View>
    </>
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
        navigation={navigation}
      />
    </AppBackground>
  );
}

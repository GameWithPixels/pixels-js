import { StackNavigationProp } from "@react-navigation/stack";
import { assert } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ScrollView } from "react-native";

import { EditActionCard } from "./components/EditActionCard";
import { RuleIndex } from "./components/RuleCard";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { actionTypes } from "~/components/actions";
import { getConditionTypeLabel } from "~/descriptions";
import { useEditableProfile } from "~/hooks";
import {
  EditProfileSubStackParamList,
  EditRuleScreenProps,
} from "~/navigation";

function EditRulePage({
  profileUuid,
  conditionType,
  option: string,
  navigation,
}: RuleIndex & {
  navigation: StackNavigationProp<EditProfileSubStackParamList>;
}) {
  const profile = useEditableProfile(profileUuid);
  const rule = profile.rules.find((r) => r.condition.type === conditionType);
  assert(rule);
  const actions = React.useMemo(
    () => actionTypes.map((a) => Profiles.createAction(a)),
    []
  );
  return (
    <>
      <View style={{ height: "100%" }}>
        <PageHeader
          mode="arrow-left"
          title={getConditionTypeLabel(rule.condition.type)}
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
          {actions.map((a) => (
            <EditActionCard
              key={a.type}
              action={a}
              conditionType={rule.condition.type}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

export function EditRuleScreen({
  route: {
    params: { profileUuid, conditionType },
  },
  navigation,
}: EditRuleScreenProps) {
  return (
    <AppBackground>
      <EditRulePage
        profileUuid={profileUuid}
        conditionType={conditionType}
        navigation={navigation}
      />
    </AppBackground>
  );
}

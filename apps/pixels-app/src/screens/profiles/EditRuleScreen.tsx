import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { View, ScrollView } from "react-native";

import { EditActionCard } from "./components/EditActionCard";
import { RuleIndex } from "./components/RuleCard";

import { actionTypes } from "~/actionTypes";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { getConditionTypeLabel } from "~/descriptions";
import {
  EditProfileSubStackParamList,
  EditRuleScreenProps,
} from "~/navigation";

function EditRulePage({
  profileUuid,
  conditionType,
  flagName,
  navigation,
}: RuleIndex & {
  navigation: NativeStackNavigationProp<EditProfileSubStackParamList>;
}) {
  return (
    <>
      <View style={{ height: "100%" }}>
        <PageHeader
          mode="arrow-left"
          title={getConditionTypeLabel(conditionType)}
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
          {actionTypes.map((at) => (
            <EditActionCard
              key={at}
              profileUuid={profileUuid}
              conditionType={conditionType}
              actionType={at}
              flagName={flagName}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

export function EditRuleScreen({
  route: {
    params: { profileUuid, conditionType, flagName },
  },
  navigation,
}: EditRuleScreenProps) {
  return (
    <AppBackground>
      <EditRulePage
        profileUuid={profileUuid}
        conditionType={conditionType}
        flagName={flagName}
        navigation={navigation}
      />
    </AppBackground>
  );
}

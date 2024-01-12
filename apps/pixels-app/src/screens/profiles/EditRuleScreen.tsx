import React from "react";
import { View, ScrollView } from "react-native";
import { Text } from "react-native-paper";

import { EditActionCard } from "./components/EditActionCard";
import { RuleIndex } from "./components/RuleCard";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { actionTypes, getConditionTypeLabel } from "~/features/profiles";
import { EditRuleScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";

function EditRulePage({
  profileUuid,
  conditionType,
  flagName,
  navigation,
}: RuleIndex & {
  navigation: EditRuleScreenProps["navigation"];
}) {
  return (
    <>
      <View style={{ height: "100%" }}>
        <PageHeader mode="arrow-left" onGoBack={() => navigation.goBack()}>
          {getConditionTypeLabel(conditionType)}
        </PageHeader>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            padding: 10,
            paddingHorizontal: 10,
            gap: 20,
          }}
        >
          <Text variant="bodyMedium" style={AppStyles.greyedOut}>
            {conditionType === "rolling"
              ? "Play an animation when die is being handled or is rolling."
              : conditionType === "helloGoodbye"
                ? "Play an animation when die turns on (typically when the charger's lid is removed)."
                : ""}
          </Text>
          <Text variant="bodyMedium" style={AppStyles.selfCentered}>
            Web Request and Speak Text to be added soon!
          </Text>
          {actionTypes.slice(0, 1).map((at) => (
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

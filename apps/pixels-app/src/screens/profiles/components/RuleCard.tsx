import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  MD3Theme,
  Text,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";

import { ActionDetails, ConditionDetails } from "./ActionDetails";

import CaretRightIcon from "#/icons/profiles/caret-right";
import { Card } from "~/components/Card";
import { getHighestFace } from "~/features/getHighestFace";
import { useEditableProfile } from "~/hooks";
import { AppStyles } from "~/styles";

export interface RuleIndex {
  profileUuid: string;
  conditionType: Profiles.ConditionType;
  flagName?: string;
}

export interface RuleProp {
  rule: Profiles.Rule;
}

const RuleSummary = observer(function RuleSummary({
  rule,
  colors,
}: {
  rule: Profiles.Rule;
  colors: MD3Theme["colors"];
}) {
  return rule?.actions.length ? (
    <>
      <ConditionDetails condition={rule.condition} />
      {rule.actions.map((action, i) => (
        <ActionDetails
          key={action.type + i} // In case we have multiple of actions of same type
          action={action}
          withIcon
          style={styles.ruleGroup}
        />
      ))}
    </>
  ) : (
    <Text style={{ color: colors.onSurfaceDisabled }}>No action</Text>
  );
});

const RolledRulesSummary = observer(function RolledRulesSummary({
  rules,
  colors,
}: {
  rules: Profiles.Rule[];
  colors: MD3Theme["colors"];
}) {
  return rules.length ? (
    <>
      {rules.slice(0, 4).map((r) => (
        <RuleSummary key={r.uuid} rule={r} colors={colors} />
      ))}
      {rules.length > 4 && <Text style={AppStyles.greyedOut}>And more...</Text>}
    </>
  ) : (
    <Text style={{ color: colors.onSurfaceDisabled }}>No action</Text>
  );
});

export const RuleCard = observer(function RuleCard({
  children,
  profileUuid,
  conditionType,
  flagName,
  ...props
}: React.PropsWithChildren<RuleIndex> &
  Omit<TouchableRippleProps, "children">) {
  const profile = useEditableProfile(profileUuid);
  const rules = profile.rules.filter(
    (r) =>
      r.condition.type === conditionType && r.condition.flagName === flagName
  );
  if (conditionType === "rolled") {
    rules.sort(
      (r1, r2) =>
        getHighestFace((r2.condition as Profiles.ConditionRolled).faces) -
        getHighestFace((r1.condition as Profiles.ConditionRolled).faces)
    );
  }
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <TouchableRipple {...props}>
      <>
        <Card
          noBorder
          frameless
          contentStyle={{
            flexDirection: "row",
            paddingHorizontal: 10,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          <Text style={styles.title} variant="bodyLarge">
            {children}
          </Text>
          <CaretRightIcon size={16} color={colors.onSurface} />
        </Card>
        <View
          style={{
            ...styles.bottomView,
            borderRadius,
            borderColor: colors.outline,
          }}
        >
          {conditionType === "rolled" ? (
            <RolledRulesSummary rules={rules} colors={colors} />
          ) : (
            <RuleSummary rule={rules[0]} colors={colors} />
          )}
        </View>
      </>
    </TouchableRipple>
  );
});

const styles = StyleSheet.create({
  gap5: {
    gap: 5,
  },
  title: {
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "center",
  },
  ruleGroup: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingLeft: 10,
    gap: 5,
  },
  ruleCondition: {
    paddingBottom: 5,
  },
  bottomRightIcon: {
    position: "absolute",
    bottom: -3,
    right: 5,
  },
  bottomView: {
    marginTop: -5,
    paddingTop: 15,
    paddingLeft: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    gap: 5,
    zIndex: -1,
  },
});

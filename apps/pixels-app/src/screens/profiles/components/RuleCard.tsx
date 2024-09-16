import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
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
import { AppStyles } from "~/app/styles";
import { Card } from "~/components/Card";
import { getBorderRadius } from "~/features/getBorderRadius";
import { rolledConditionComparator } from "~/features/profiles";
import { useEditableProfile } from "~/hooks";

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
  dieType,
  colors,
}: {
  rule: Profiles.Rule;
  dieType: PixelDieType;
  colors: MD3Theme["colors"];
}) {
  return rule?.actions.length ? (
    <>
      <ConditionDetails condition={rule.condition} dieType={dieType} />
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
    <Text style={{ color: colors.onSurfaceDisabled }}>No action selected</Text>
  );
});

const RolledRulesSummary = observer(function RolledRulesSummary({
  rules,
  dieType,
  maxRules,
  colors,
}: {
  rules: Profiles.Rule[];
  dieType: PixelDieType;
  maxRules?: number;
  colors: MD3Theme["colors"];
}) {
  return rules.length ? (
    <>
      {rules.slice(0, maxRules).map((r) => (
        <RuleSummary key={r.uuid} rule={r} dieType={dieType} colors={colors} />
      ))}
      {maxRules && rules.length > maxRules && (
        <Text style={AppStyles.greyedOut}>And more...</Text>
      )}
    </>
  ) : (
    <Text style={{ color: colors.onSurfaceDisabled }}>No action selected</Text>
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
    rules.sort(rolledConditionComparator);
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
          <RolledRulesSummary
            rules={rules}
            dieType={profile.dieType}
            colors={colors}
            maxRules={conditionType === "rolled" ? 4 : 2}
          />
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
    paddingLeft: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    gap: 5,
    zIndex: -1,
  },
});

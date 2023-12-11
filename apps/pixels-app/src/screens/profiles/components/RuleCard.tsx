import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { Pressable, StyleSheet, View, ViewProps } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, {
  CurvedTransition,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ActionDetails } from "./ActionDetails";

import CaretRightIcon from "#/icons/profiles/caret-right";
import { TouchableCardProps, TouchableCard } from "~/components/TouchableCard";
import { useEditableProfile } from "~/hooks";
import { AppStyles } from "~/styles";

export interface RuleIndex {
  profileUuid: string;
  conditionType: Profiles.ConditionType;
  flagName?: string;
}

const RuleDetails = observer(function ({
  rule,
  ...props
}: {
  rule?: Profiles.Rule;
} & ViewProps) {
  return (
    <View {...props}>
      {rule?.actions.length ? (
        rule.actions.map((action, i) => (
          <ActionDetails
            key={action.type + i} // In case we have multiple of actions of same type
            action={action}
            style={styles.ruleGroupStyle}
          />
        ))
      ) : (
        <Text style={AppStyles.greyedOut}>No action</Text>
      )}
    </View>
  );
});

const RolledRulesDetails = observer(function ({
  rules,
  colors,
  ...props
}: {
  rules: Profiles.Rule[];
  colors: MD3Theme["colors"];
} & ViewProps) {
  const [expandedToggle, setExpandedToggle] = React.useState(false);
  const expanded = useSharedValue(0);
  const animChevronStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: expanded
            ? withTiming(expanded.value ? "180deg" : "0deg")
            : "0deg",
        },
      ],
    }),
    [expanded]
  );
  const toggleExpand = React.useCallback(() => {
    setExpandedToggle((b) => !b);
    expanded.value = 1 - expanded.value;
  }, [expanded]);
  const canExpand = rules.length > 2;
  return (
    <Animated.View layout={CurvedTransition.duration(300)} {...props}>
      <Pressable
        onPress={canExpand ? toggleExpand : undefined}
        style={styles.gap5}
      >
        <RolledActionDetails rule={rules[0]} />
        {rules[1] && <RolledActionDetails rule={rules[1]} />}
        {expandedToggle && (
          <Animated.View entering={FadeIn.duration(300)}>
            {rules.slice(2).map((rule, i) => (
              <RolledActionDetails key={i} rule={rule} />
            ))}
          </Animated.View>
        )}
        {canExpand && (
          <>
            <Text
              variant="labelSmall"
              style={{ marginTop: 5, color: colors.onSurfaceDisabled }}
            >
              Tap to see {expandedToggle ? "less" : "more"}
            </Text>
            <Animated.View style={[styles.bottomRightIcon, animChevronStyle]}>
              <MaterialCommunityIcons
                name="chevron-down"
                size={24}
                color={colors.onSurface}
              />
            </Animated.View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
});

const RolledActionDetails = observer(function ({
  rule,
}: {
  rule?: Profiles.Rule;
  // colors: MD3Theme["colors"];
}) {
  return (
    <View>
      {rule && (
        <Text style={styles.rolledFacesStyle} variant="bodyMedium">
          On face {(rule.condition as Profiles.ConditionRolled).face}
        </Text>
      )}
      <RuleDetails
        rule={rule}
        style={rule ? styles.rolledRuleGroupStyle : styles.ruleGroupStyle}
      />
    </View>
  );
});

export const RuleCard = observer(function ({
  children,
  profileUuid,
  conditionType,
  flagName,
  style,
  ...props
}: RuleIndex & TouchableCardProps) {
  const profile = useEditableProfile(profileUuid);
  const rules = profile.rules.filter(
    (r) =>
      r.condition.type === conditionType && r.condition.flagName === flagName
  );
  if (conditionType === "rolling") {
  }
  console.log(conditionType + " => rules = " + rules.length);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const bottomViewStyle = {
    ...styles.bottomView,
    borderRadius,
    borderColor: colors.outline,
    gap: 5,
    pointerEvents: "box-none",
  } as const;
  return (
    <>
      <Animated.View layout={CurvedTransition.duration(300)}>
        <TouchableCard
          noBorder
          frameless
          contentStyle={[
            {
              flexDirection: "row",
              paddingHorizontal: 10,
              paddingVertical: 12,
              gap: 5,
            },
            style,
          ]}
          {...props}
        >
          <>
            <Text style={styles.title} variant="bodyLarge">
              {children}
            </Text>
            <CaretRightIcon size={16} color={colors.onSurface} />
          </>
        </TouchableCard>
      </Animated.View>
      {conditionType === "rolled" ? (
        <RolledRulesDetails
          rules={rules}
          style={bottomViewStyle}
          colors={colors}
        />
      ) : (
        <RuleDetails rule={rules[0]} style={bottomViewStyle} />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  gap5: { gap: 5 },
  title: { flexGrow: 1, textAlign: "center" },
  ruleGroupStyle: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 5,
  },
  rolledRuleGroupStyle: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingLeft: 10,
    gap: 5,
  },
  rolledFacesStyle: { paddingBottom: 5 },
  bottomRightIcon: { position: "absolute", bottom: -3, right: 5 },
  bottomView: {
    marginTop: -20,
    marginBottom: 10,
    paddingTop: 20,
    paddingLeft: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

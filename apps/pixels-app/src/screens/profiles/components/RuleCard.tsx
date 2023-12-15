import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, {
  CurvedTransition,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ActionDetails, ConditionDetails } from "./ActionDetails";

import CaretRightIcon from "#/icons/profiles/caret-right";
import { TouchableCardProps, TouchableCard } from "~/components/TouchableCard";
import { useEditableProfile } from "~/hooks";
import { useRolledConditionFaces } from "~/hooks/useRolledConditionFaces";
import { AppStyles } from "~/styles";

export interface RuleIndex {
  profileUuid: string;
  conditionType: Profiles.ConditionType;
  flagName?: string;
}

const RuleSummary = observer(function ({
  rule,
  ...props
}: {
  rule?: Profiles.Rule;
} & ViewProps) {
  return (
    <View {...props}>
      {rule?.actions.length ? (
        <>
          <ConditionDetails condition={rule.condition} />
          {rule.actions.map((action, i) => (
            <ActionDetails
              key={action.type + i} // In case we have multiple of actions of same type
              action={action}
              withIcon
              style={styles.ruleGroupStyle}
            />
          ))}
        </>
      ) : (
        <Text style={AppStyles.greyedOut}>No action</Text>
      )}
    </View>
  );
});

const RolledActionDetails = observer(function ({
  rule,
}: {
  rule: Profiles.Rule;
}) {
  const condition = rule.condition as Profiles.ConditionRolled;
  const faces = useRolledConditionFaces(condition);
  return (
    <View>
      <Text style={styles.rolledFacesStyle} variant="bodyMedium">
        {faces === "all"
          ? "On other faces"
          : faces.length <= 1
            ? `On face ${faces[0].toString() ?? "?"}`
            : `On faces ${[...faces].reverse().join(", ")}`}
      </Text>
      <RuleSummary
        rule={rule}
        style={rule ? styles.rolledRuleGroupStyle : styles.ruleGroupStyle}
      />
    </View>
  );
});

const RolledRulesSummary = observer(function ({
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
        {rules.length ? (
          <>
            <RolledActionDetails rule={rules[0]} />
            {rules[1] && <RolledActionDetails rule={rules[1]} />}
            {expandedToggle && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.gap5}
              >
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
                <Animated.View
                  style={[styles.bottomRightIcon, animChevronStyle]}
                >
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={24}
                    color={colors.onSurface}
                  />
                </Animated.View>
              </>
            )}
          </>
        ) : (
          <Text style={AppStyles.greyedOut}>No action</Text>
        )}
      </Pressable>
    </Animated.View>
  );
});

export const RuleCard = observer(function ({
  children,
  profileUuid,
  conditionType,
  flagName,
  style,
  ...props
}: RuleIndex &
  Omit<TouchableCardProps, "style" | "children"> &
  React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const profile = useEditableProfile(profileUuid);
  const rules = profile.rules
    .filter(
      (r) =>
        r.condition.type === conditionType && r.condition.flagName === flagName
    )
    .sort(
      (r1, r2) =>
        (r2.condition as Profiles.ConditionRolled).face -
        (r1.condition as Profiles.ConditionRolled).face
    );
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
              gap: 10,
            },
            style,
          ]}
          {...props}
        >
          <Text style={styles.title} variant="bodyLarge">
            {children}
          </Text>
          <CaretRightIcon size={16} color={colors.onSurface} />
        </TouchableCard>
      </Animated.View>
      {conditionType === "rolled" ? (
        <RolledRulesSummary
          rules={rules}
          style={bottomViewStyle}
          colors={colors}
        />
      ) : (
        <RuleSummary rule={rules[0]} style={bottomViewStyle} />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  gap5: { gap: 5 },
  title: { flexGrow: 1, flexShrink: 1, textAlign: "center" },
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
    zIndex: -1,
  },
});

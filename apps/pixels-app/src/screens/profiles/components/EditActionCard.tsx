import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { computed, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { Pressable, StyleSheet, TextStyle } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  CurvedTransition,
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ActionDetailsCard } from "./ActionDetails";
import { ConfigureActionBottomSheet } from "./ConfigureActionBottomSheet";
import { RuleIndex } from "./RuleCard";

import { Card } from "~/components/Card";
import { ActionTypeIcon } from "~/components/actions";
import { AnimatedText } from "~/components/animated";
import { getActionTypeLabel } from "~/features/profiles";
import { makeObservable } from "~/features/utils";
import { useEditableProfile } from "~/hooks";
import { withAnimated } from "~/withAnimated";

const AnimatedActionTypeIcon = withAnimated(ActionTypeIcon);
const AnimatedTouchableRipple = withAnimated(TouchableRipple);

const AnimatedTrashIcon = withAnimated(function ({
  size,
  color,
  style,
}: {
  size: number;
  color?: string;
  style?: Omit<TextStyle, "color"> & { color: string };
}) {
  return (
    <MaterialCommunityIcons
      name="trash-can-outline"
      color={color}
      size={size}
      style={style}
    />
  );
});

export const EditActionCard = observer(function EditActionCard({
  profileUuid,
  conditionType,
  flagName,
  actionType,
}: RuleIndex & {
  actionType: Profiles.ActionType;
}) {
  const profile = useEditableProfile(profileUuid);
  const rule = React.useMemo(
    () =>
      computed(() =>
        profile.rules.find(
          (r) =>
            r.condition.type === conditionType &&
            r.condition.flagName === flagName &&
            r.actions.some((a) => a.type === actionType)
        )
      ),
    [actionType, conditionType, flagName, profile.rules]
  ).get();
  const condition = React.useMemo(
    () =>
      rule?.condition ??
      makeObservable(Profiles.createCondition(conditionType, flagName as any)),
    [conditionType, flagName, rule]
  );
  const action = React.useMemo(
    () =>
      rule?.actions?.find((a) => a.type === actionType) ??
      makeObservable(Profiles.createAction(actionType)),
    [actionType, rule]
  );
  const svShowContent = useSharedValue(!!rule);
  const svProgress = useDerivedValue(() =>
    withTiming(svShowContent.value ? 1 : 0, { duration: 300 })
  );
  const [configureVisible, setConfigureVisible] = React.useState(false);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const animColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      svProgress.value,
      [0, 1],
      [colors.onSurfaceDisabled, colors.onSurface]
    ),
  }));
  return (
    <>
      <AnimatedTouchableRipple
        layout={CurvedTransition.duration(300)}
        style={styles.hidden}
        onPress={() => {
          if (!rule) {
            // Create the rule with a new condition so Mobx doesn't complain about re-annotating with 'observable'
            const newRule = makeObservable(
              new Profiles.Rule(Profiles.createCondition(conditionType))
            );
            runInAction(() => {
              newRule.condition = condition;
              newRule.actions.push(action);
              profile.rules.push(newRule);
            });
            svShowContent.value = true;
          }
          setConfigureVisible(true);
        }}
      >
        <>
          <Card
            noBorder
            frameless
            contentStyle={{
              flexDirection: "row",
              minHeight: 50,
              paddingHorizontal: 10,
              padding: 0,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <AnimatedActionTypeIcon
              type={actionType}
              size={20}
              style={animColorStyle}
            />
            <AnimatedText variant="titleMedium" style={animColorStyle}>
              {getActionTypeLabel(actionType)}
            </AnimatedText>
            <Pressable
              style={styles.actionIconBox}
              onPress={() => {
                !!rule &&
                  runInAction(() =>
                    profile.rules.splice(profile.rules.indexOf(rule), 1)
                  );
                svShowContent.value = false;
              }}
            >
              <AnimatedTrashIcon size={24} style={animColorStyle} />
            </Pressable>
          </Card>
          <Animated.View
            layout={FadeIn.duration(300)}
            style={{
              ...styles.bottomView,
              borderRadius,
              borderColor: colors.outline,
              gap: 10,
              pointerEvents: "none",
            }}
          >
            {rule ? (
              <ActionDetailsCard
                action={action}
                condition={condition}
                dieType={profile.dieType}
              />
            ) : (
              <Text style={styles.noActionText}>Tap to enable</Text>
            )}
          </Animated.View>
        </>
      </AnimatedTouchableRipple>
      <ConfigureActionBottomSheet
        dieType={profile.dieType}
        condition={condition}
        action={action}
        visible={configureVisible}
        onDismiss={() => setConfigureVisible(false)}
      />
    </>
  );
});

const styles = StyleSheet.create({
  hidden: {
    overflow: "hidden",
  },
  actionIconBox: {
    height: 50,
    aspectRatio: 1,
    marginRight: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDeleteIcon: {
    textAlign: "center",
  },
  noActionText: {
    marginVertical: 10,
  },
  bottomView: {
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    zIndex: -1,
  },
});

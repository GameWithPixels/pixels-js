import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { useTheme, Switch } from "react-native-paper";
import Animated, {
  CurvedTransition,
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ActionDetails } from "./ActionDetails";
import { ConfigureAnimationModal } from "./ConfigureAnimationModal";
import { RuleIndex } from "./RuleCard";

import { TouchableCard } from "~/components/TouchableCard";
import { ActionTypeIcon } from "~/components/actions";
import { AnimatedText } from "~/components/animated";
import { getActionTypeLabel } from "~/descriptions";
import { makeObservable } from "~/features/makeObservable";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useEditableProfile } from "~/hooks";
import { withAnimated } from "~/withAnimated";

function EditActionContents({
  action,
  style,
  ...props
}: {
  conditionType: Profiles.ConditionType;
  action: Profiles.Action;
} & ViewProps) {
  const actionType = action.type;
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View
      style={[
        {
          ...styles.bottomView,
          borderRadius,
          borderColor: colors.outline,
          gap: 10,
          pointerEvents: "none",
        },
        style,
      ]}
      {...props}
    >
      {actionType === "playAnimation" ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            marginVertical: 5,
          }}
        >
          <View
            style={{
              flexGrow: 1,
              justifyContent: "space-between",
              gap: 5,
            }}
          >
            <ActionDetails action={action} noActionIcon />
          </View>
          <View style={{ width: 60, aspectRatio: 1 }}>
            <DieRenderer dieType="d20" colorway="midnightGalaxy" />
          </View>
        </View>
      ) : (
        <ActionDetails
          action={action}
          noActionIcon
          style={{ marginVertical: 10 }}
        />
      )}
    </View>
  );
}

const AnimatedActionTypeIcon = withAnimated(ActionTypeIcon);
const AnimatedEditActionContents = withAnimated(EditActionContents);

export function EditActionCard({
  profileUuid,
  conditionType,
  flagName,
  actionType,
}: RuleIndex & {
  actionType: Profiles.ActionType;
}) {
  const profile = useEditableProfile(profileUuid);
  const getRule = React.useCallback(
    () =>
      profile.rules.find(
        (r) =>
          r.condition.type === conditionType &&
          r.condition.flagName === flagName
      ),
    [conditionType, flagName, profile.rules]
  );
  const condition = React.useMemo(
    () =>
      getRule()?.condition ??
      makeObservable(Profiles.createCondition(conditionType)),
    [conditionType, getRule]
  );
  const action = React.useMemo(
    () =>
      getRule()?.actions?.find((a) => a.type === actionType) ??
      makeObservable(Profiles.createAction(actionType)),
    [actionType, getRule]
  );
  const [hasContent, setHasContent] = React.useState(
    () => getRule()?.actions.includes(action) ?? false
  );
  const svShowContent = useSharedValue(hasContent);
  const svProgress = useDerivedValue(() =>
    withTiming(svShowContent.value ? 1 : 0, { duration: 300 })
  );
  const [configureVisible, setConfigureVisible] = React.useState(false);
  const { colors } = useTheme();
  const animColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      svProgress.value,
      [0, 1],
      [colors.onSurfaceDisabled, colors.onSurface]
    ),
  }));
  return (
    <>
      <Animated.View
        style={{ overflow: "hidden" }}
        layout={CurvedTransition.duration(300)}
      >
        <TouchableCard
          noBorder
          frameless
          disabled={!hasContent}
          contentStyle={{
            flexDirection: "row",
            minHeight: 50,
            paddingHorizontal: 10,
            padding: 0,
            alignItems: "center",
            justifyContent: "space-between",
          }}
          onPress={() => setConfigureVisible(true)}
        >
          <AnimatedActionTypeIcon
            type={actionType}
            size={20}
            style={animColorStyle}
          />
          <AnimatedText variant="titleMedium" style={animColorStyle}>
            {getActionTypeLabel(actionType)}
          </AnimatedText>
          <Switch
            value={hasContent}
            onValueChange={(isOn) => {
              const rule = getRule();
              runInAction(() => {
                if (isOn) {
                  if (rule) {
                    rule.condition = condition;
                    if (!rule.actions.includes(action)) {
                      rule.actions.push(action);
                    }
                  } else {
                    // Create the rule with a new condition so Mobx doesn't complain about re-annotating with 'observable'
                    const newRule = makeObservable(
                      new Profiles.Rule(Profiles.createCondition(conditionType))
                    );
                    newRule.condition = condition;
                    newRule.actions.push(action);
                    profile.rules.push(newRule);
                  }
                } else if (rule) {
                  rule.condition = condition;
                  const index = rule.actions.indexOf(action);
                  if (index >= 0) {
                    if (rule.actions.length === 1) {
                      profile.rules.splice(profile.rules.indexOf(rule), 1);
                    } else {
                      rule.actions.splice(index, 1);
                    }
                  }
                }
              });
              setConfigureVisible(isOn);
              setHasContent(isOn);
              svShowContent.value = isOn;
            }}
          />
        </TouchableCard>
        {hasContent && (
          <AnimatedEditActionContents
            conditionType={conditionType}
            action={action}
            entering={FadeIn.duration(300).delay(100)}
            exiting={FadeOut.duration(300)}
          />
        )}
      </Animated.View>
      <ConfigureAnimationModal
        dieType="d20"
        condition={condition}
        action={action}
        visible={configureVisible}
        onDismiss={() => setConfigureVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bottomView: {
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

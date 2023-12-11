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

import CaretRightIcon from "#/icons/profiles/caret-right";
import { TouchableCardProps, TouchableCard } from "~/components/TouchableCard";
import { ActionTypeIcon } from "~/components/actions";
import { useEditableProfile } from "~/hooks";
import { Colors } from "~/themes";

export interface RuleIndex {
  profileUuid: string;
  conditionType: Profiles.ConditionType;
  option?: string;
}

function getActionText(action: Profiles.Action) {
  switch (action.type) {
    case "playAnimation": {
      const act = action as Profiles.ActionPlayAnimation;
      return `Play "${act.animation?.name ?? ""}" ${act.loopCount} time${
        act.loopCount > 1 ? "s" : ""
      }`;
    }
    case "playAudioClip":
      return `Play "${
        (action as Profiles.ActionPlayAudioClip).clip?.name ?? ""
      }"`;
    case "speakText":
      return `Say "${"some text"}"`;
    case "makeWebRequest":
      return `Sned request to "${
        (action as Profiles.ActionMakeWebRequest).url
      }"`;
    default:
      return "Unknown action";
  }
}

const ActionDetails = observer(function ({
  rule,
  style,
}: {
  rule?: Profiles.Rule;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[style, styles.ruleGroupStyle]}>
      {rule?.actions.length ? (
        rule.actions.map((action) => (
          <View key={action.type} style={styles.ruleGroupStyle}>
            <View style={styles.ruleIconStyle}>
              <ActionTypeIcon
                type="speakText"
                size={16}
                color={Colors.grey500}
              />
            </View>
            <View style={styles.ruleTextStyle}>
              <Text style={styles.actionTextStyle}>
                {getActionText(action)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.actionTextStyle}>No action</Text>
      )}
    </View>
  );
});

function RolledRulesDetails({
  rules,
  bottomViewStyle,
  colors,
}: {
  rules: Profiles.Rule[];
  bottomViewStyle: ViewProps["style"];
  colors: MD3Theme["colors"];
}) {
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
    <Animated.View
      style={bottomViewStyle}
      layout={CurvedTransition.duration(300)}
    >
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
}

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
      <ActionDetails
        rule={rule}
        style={rule ? styles.rolledRuleGroupStyle : styles.ruleGroupStyle}
      />
    </View>
  );
});
// isRolled ? (
//   <View style={styles.rolledRuleGroupStyle}>
//     <View style={styles.ruleIconStyle}>
//       <MaterialCommunityIcons
//         name="web"
//         size={16}
//         color={Colors.grey500}
//       />
//     </View>
//     <View style={styles.ruleTextStyle}>
//       <Text style={{ color: Colors.grey500 }}>
//         Make request to "ifttt.com"
//       </Text>
//     </View>
//   </View>
// < Text style = { styles.facesStyle } variant = "bodyMedium" >
//   On face 1
//           </Text >
// <View style={styles.rolledRuleGroupStyle}>
//   <View style={styles.ruleIconStyle}>
//     <AnimationsIcon size={16} color={Colors.grey500} />
//   </View>
//   <View style={{ flex: 1, flexGrow: 1 }}>
//     <Text
//       numberOfLines={expandedToggle ? 0 : 1}
//       style={{ color: Colors.grey500, marginRight: 1 }} // Weird bug that clip the text
//     >
//       Play "Three Red Blinks" twice for 3s with fading set to 0.5
//     </Text>
//   </View>
// </View>

// function ExpandedRolledActionDetails() {
//   return (
//     <Animated.View entering={FadeIn.duration(300)}>
//       <Text style={styles.facesStyle} variant="bodyMedium">
//         On faces 2 to 19
//       </Text>
//       <View style={styles.rolledRuleGroupStyle}>
//         <View style={styles.ruleIconStyle}>
//           <AnimationsIcon size={16} color={Colors.grey500} />
//         </View>
//         <Text style={{ color: Colors.grey500 }}>Play "Waterfall" for 5s</Text>
//       </View>
//       <Text style={styles.facesStyle} variant="bodyMedium">
//         On all faces
//       </Text>
//       <View style={styles.rolledRuleGroupStyle}>
//         <View style={styles.ruleIconStyle}>
//           <ActionTypeIcon type="speakText" size={16} color={Colors.grey500} />
//         </View>
//         <Text style={{ color: Colors.grey500 }}>Speak Number</Text>
//       </View>
//     </Animated.View>
//   );
// }

export const RuleCard = observer(function ({
  children,
  profileUuid,
  conditionType,
  option,
  style,
  ...props
}: RuleIndex & TouchableCardProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const profile = useEditableProfile(profileUuid);
  const rules = profile.rules.filter((r) => r.condition.type === conditionType);
  const bottomViewStyle = {
    marginTop: -20,
    marginBottom: 10,
    paddingTop: 20,
    paddingLeft: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderColor: colors.outline,
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
          bottomViewStyle={bottomViewStyle}
          colors={colors}
        />
      ) : (
        <ActionDetails rule={rules[0]} style={bottomViewStyle} />
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
  ruleIconStyle: {
    width: 20,
    alignItems: "center",
  },
  ruleTextStyle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionTextStyle: { color: Colors.grey500 },
  rolledFacesStyle: { paddingBottom: 5 },
  bottomRightIcon: { position: "absolute", bottom: -3, right: 5 },
});

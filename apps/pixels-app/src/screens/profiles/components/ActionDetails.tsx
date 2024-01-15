import { createDataSetForAnimation } from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { ActionTypeIcon } from "~/components/actions";
import { applyActionOverrides, getFacesAsText } from "~/features/profiles";
import { DieRendererWithFocus } from "~/features/render3d/DieRenderer";
import { AppStyles } from "~/styles";

function getCountAsText(count: number) {
  return count === 1 ? "once" : count === 2 ? "twice" : `${count} times`;
}

function getActionText(action: Profiles.Action): string {
  if (action instanceof Profiles.ActionPlayAnimation) {
    let msg = action.animation?.name
      ? `Play "${action.animation.name}" ${getCountAsText(action.loopCount)}`
      : "No animation selected";
    if (action.duration !== undefined) {
      msg += ` for ${action.duration.toFixed(1)}s`;
    }
    return msg;
  } else if (action instanceof Profiles.ActionPlayAudioClip) {
    return action.clip?.name
      ? `Play "${action.clip.name}" ${getCountAsText(
          action.loopCount
        )} at volume ${action.volume}%`
      : "No clip selected";
  } else if (action instanceof Profiles.ActionSpeakText) {
    return action.text.length
      ? `Speak "${action.text}"${
          action.pitch !== 1 ? ` with pitch ${action.pitch}%` : ""
        }${action.rate !== 1 ? ` with rate ${action.rate}%` : ""}`
      : "No text to speak";
  } else if (action instanceof Profiles.ActionMakeWebRequest) {
    return action.url.length
      ? `Send request to "${action.url}"${
          action.value?.length ? `with value "${action.value}"` : ""
        }`
      : "No URL entered";
  } else {
    throw new Error(`Unknown action type ${action.type}`);
  }
}

function getConditionText(condition: Profiles.Condition): string | undefined {
  if (condition instanceof Profiles.ConditionRolled) {
    const faces = condition.faces;
    return `On face${faces.length > 1 ? "s" : ""} ${getFacesAsText(faces)}`;
  } else if (condition instanceof Profiles.ConditionRolling) {
    return `Recheck after ${condition.recheckAfter.toFixed(1)}s`;
  } else if (condition instanceof Profiles.ConditionIdle) {
    return `Period of ${condition.period.toFixed(1)}s`;
  } else if (condition instanceof Profiles.ConditionBattery) {
    return `Recheck after ${condition.recheckAfter.toFixed(0)}s`;
  }
}

export const ActionDetails = observer(function ActionDetails({
  action,
  withIcon,
  ...props
}: {
  action: Profiles.Action;
  withIcon?: boolean;
} & ViewProps) {
  return (
    <View {...props}>
      {withIcon && (
        <View style={styles.ruleIconStyle}>
          <ActionTypeIcon
            type={action.type}
            size={16}
            color={AppStyles.greyedOut.color}
          />
        </View>
      )}
      <View style={styles.ruleTextStyle}>
        <Text style={AppStyles.greyedOut}>{getActionText(action)}</Text>
      </View>
    </View>
  );
});

export const ConditionDetails = observer(function ConditionDetails({
  condition,
}: {
  condition: Profiles.Condition;
}) {
  const text = getConditionText(condition);
  return text ? (
    <View style={styles.ruleTextStyle}>
      <Text variant="titleSmall">{text}</Text>
    </View>
  ) : null;
});

export const ActionDieRenderer = observer(function ActionDieRenderer({
  action,
  dieType,
}: {
  action: Readonly<Profiles.Action>;
  dieType: PixelDieType;
}) {
  const animationsData = React.useMemo(
    () =>
      computed(() => {
        if (action instanceof Profiles.ActionPlayAnimation) {
          const anim = applyActionOverrides(action);
          if (anim) {
            const dataSet = createDataSetForAnimation(anim).toDataSet();
            return {
              animations: dataSet.animations,
              bits: dataSet.animationBits,
            };
          }
        }
      }),
    [action]
  ).get();
  return (
    <DieRendererWithFocus
      dieType={dieType}
      colorway="onyxBlack"
      animationsData={animationsData}
    />
  );
});

export function ActionDetailsCard({
  action,
  condition,
  dieType,
}: {
  action: Profiles.Action;
  condition?: Profiles.Condition;
  dieType: PixelDieType;
}) {
  const actionType = action.type;
  return (
    <>
      {actionType === "playAnimation" ? (
        <View style={styles.animationBox}>
          <View style={styles.animationDetails}>
            {condition && <ConditionDetails condition={condition} />}
            <ActionDetails action={action} />
          </View>
          <View style={styles.animationDie}>
            <ActionDieRenderer dieType={dieType} action={action} />
          </View>
        </View>
      ) : (
        <View
          style={{
            marginVertical: 10,
            gap: 5,
          }}
        >
          {condition && <ConditionDetails condition={condition} />}
          <ActionDetails action={action} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  ruleIconStyle: {
    width: 20,
    alignItems: "center",
  },
  ruleTextStyle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  animationBox: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginVertical: 5,
  },
  animationDetails: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 5,
  },
  animationDie: {
    width: 60,
    aspectRatio: 1,
  },
});

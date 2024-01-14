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
  switch (action.type) {
    case "playAnimation": {
      const act = action as Profiles.ActionPlayAnimation;
      let msg = act.animation?.name
        ? `Play "${act.animation.name}" ${getCountAsText(act.loopCount)}`
        : "No animation selected";
      if (act.duration !== undefined) {
        msg += ` for ${act.duration.toFixed(1)}s`;
      }
      return msg;
    }
    case "playAudioClip": {
      const act = action as Profiles.ActionPlayAudioClip;
      return act.clip?.name
        ? `Play "${act.clip.name}" ${getCountAsText(act.loopCount)} at volume ${
            act.volume
          }%`
        : "No clip selected";
    }
    case "speakText": {
      const act = action as Profiles.ActionSpeakText;
      return act.text.length
        ? `Speak "${act.text}"${
            act.pitch !== 1 ? ` with pitch ${act.pitch}%` : ""
          }${act.rate !== 1 ? ` with rate ${act.rate}%` : ""}`
        : "No text to speak";
    }
    case "makeWebRequest": {
      const act = action as Profiles.ActionMakeWebRequest;
      return act.url.length
        ? `Send request to "${act.url}"${
            act.value?.length ? `with value "${act.value}"` : ""
          }`
        : "No URL entered";
    }
    default:
      return "Unknown action";
  }
}

function getConditionText(condition: Profiles.Condition): string | undefined {
  switch (condition.type) {
    case "rolled": {
      const faces = (condition as Profiles.ConditionRolled).faces;
      return `On face${faces.length > 1 ? "s" : ""} ${getFacesAsText(faces)}`;
    }
    case "rolling":
      return `Recheck after ${(
        condition as Profiles.ConditionRolling
      ).recheckAfter.toFixed(1)}s`;
    case "idle":
      return `Period of ${(condition as Profiles.ConditionIdle).period.toFixed(
        1
      )}s`;
    case "battery":
      return `Recheck after ${(
        condition as Profiles.ConditionBattery
      ).recheckAfter.toFixed(0)}s`;
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
        if (action.type === "playAnimation") {
          const anim = applyActionOverrides(
            action as Profiles.ActionPlayAnimation
          );
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

import {
  createDataSetForAnimation,
  DiceUtils,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { useAppStore } from "~/app/hooks";
import { AppStore } from "~/app/store";
import { AppStyles } from "~/app/styles";
import { DieRendererWithFocus } from "~/components/DieRendererWithFocus";
import { ActionTypeIcon } from "~/components/actions";
import { getFacesAsText } from "~/features/dice";
import { applyActionOverrides } from "~/features/profiles";
import {
  getCountAsText,
  getUrlShortText,
  listToText,
  toPercentText,
} from "~/features/utils";

function getAnimationActionText(action: Profiles.ActionPlayAnimation): string {
  if (action.animation) {
    const parts = [`Play "${action.animation.name}"`];
    if (action.loopCount > 1) {
      parts[0] += ` ${getCountAsText(action.loopCount)}`;
    }
    if (action.duration !== undefined) {
      parts[0] += ` for ${action.duration.toFixed(1)}s`;
    }
    if (action.fade !== undefined) {
      parts.push(`with fading of ${toPercentText(action.fade)}`);
    }
    if (action.intensity !== undefined) {
      parts.push(`with intensity of ${toPercentText(action.intensity)}`);
    }
    if (action.colors.length) {
      parts.push(
        `with ${
          action.colors.length === 1 ? "a custom color" : "custom colors"
        }`
      );
    }
    return listToText(parts);
  } else {
    return "No animation selected";
  }
}

function getAudioClipActionText(
  action: Profiles.ActionPlayAudioClip,
  clipName?: string
): string {
  if (action.clipUuid) {
    let msg = `Play "${clipName ?? action.clipUuid}"`;
    if (action.volume !== 1) {
      msg += ` at volume ${toPercentText(action.volume)}`;
    }
    if (action.loopCount > 1) {
      msg += ` ${getCountAsText(action.loopCount)}`;
    }
    return msg;
  } else {
    return "No clip selected";
  }
}

function getShortText(text: string, maxLength = 25, variance = 7): string {
  text = text.trim();
  if (text.length <= maxLength) {
    return text;
  } else {
    const re = /\W/g;
    let lastIndex = 0;
    let lastIndexCheck = 0;
    let m;
    while ((m = re.exec(text))) {
      const index = re.lastIndex - m.length;
      if (index > maxLength + variance) {
        break;
      }
      if (index - 1 > lastIndexCheck) {
        console.log(index);
        lastIndex = index;
      }
      lastIndexCheck = index;
    }
    return (
      text.slice(0, lastIndex > maxLength - variance ? lastIndex : maxLength) +
      "..."
    );
  }
}

function getSpeakActionText(action: Profiles.ActionSpeakText): string {
  if (action.text.length) {
    const parts = [`Speak "${getShortText(action.text)}"`];
    if (action.volume !== 1) {
      parts.push(`at volume of ${toPercentText(action.volume)}`);
    }
    if (action.pitch !== 1) {
      parts.push(`with pitch of ${toPercentText(action.pitch)}`);
    }
    if (action.rate !== 1) {
      parts.push(`with rate of ${toPercentText(action.rate)}`);
    }
    return listToText(parts);
  } else {
    return "No text entered";
  }
}

function getWebRequestActionText(
  action: Profiles.ActionMakeWebRequest
): string {
  if (action.url.length) {
    let msg = `Send request to "${getUrlShortText(action.url)}"`;
    if (action.value?.length) {
      msg += ` with value "${action.value}"`;
    }
    return msg;
  } else {
    return "No URL entered";
  }
}

function getActionText(action: Profiles.Action, store: AppStore): string {
  if (action instanceof Profiles.ActionPlayAnimation) {
    return getAnimationActionText(action);
  } else if (action instanceof Profiles.ActionPlayAudioClip) {
    return getAudioClipActionText(
      action,
      action.clipUuid &&
        store.getState().libraryAssets.audioClips.entities[action.clipUuid]
          ?.name
    );
  } else if (action instanceof Profiles.ActionSpeakText) {
    return getSpeakActionText(action);
  } else if (action instanceof Profiles.ActionMakeWebRequest) {
    return getWebRequestActionText(action);
  } else {
    throw new Error(`Unknown action type ${action.type}`);
  }
}

function getConditionText(
  condition: Profiles.Condition,
  dieType: PixelDieType
): string | undefined {
  if (condition instanceof Profiles.ConditionRolled) {
    const faces = condition.faces.map((f) =>
      DiceUtils.unMapFaceFromAnimation(f, dieType)
    );
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
  const store = useAppStore();
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
        <Text style={AppStyles.greyedOut}>{getActionText(action, store)}</Text>
      </View>
    </View>
  );
});

export const ConditionDetails = observer(function ConditionDetails({
  condition,
  dieType,
}: {
  condition: Profiles.Condition;
  dieType: PixelDieType;
}) {
  const text = getConditionText(condition, dieType);
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
            {condition && (
              <ConditionDetails condition={condition} dieType={dieType} />
            )}
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
          {condition && (
            <ConditionDetails condition={condition} dieType={dieType} />
          )}
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
    flex: 1,
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
    flex: 1,
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 5,
  },
  animationDie: {
    width: 60,
    aspectRatio: 1,
  },
});

import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import { View, StyleSheet, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { ActionTypeIcon } from "~/components/actions";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { AppStyles } from "~/styles";

function getCountText(count: number) {
  return count === 1 ? "once" : count === 2 ? "twice" : `${count} times`;
}

function getActionText(action: Profiles.Action): string {
  switch (action.type) {
    case "playAnimation": {
      const act = action as Profiles.ActionPlayAnimation;
      let msg = `Play "${act.animation?.name ?? ""}" ${getCountText(
        act.loopCount
      )}`;
      if (act.duration !== undefined) {
        msg += ` for ${act.duration.toFixed(1)}s`;
      }
      return msg;
    }
    case "playAudioClip": {
      const act = action as Profiles.ActionPlayAudioClip;
      return `Play "${act.clip?.name ?? ""}" ${getCountText(
        act.loopCount
      )} at volume ${act.volume}%`;
    }
    case "speakText": {
      const act = action as Profiles.ActionSpeakText;
      return `Speak "${act.text ?? ""}" at volume ${act.volume}%`;
    }
    case "makeWebRequest": {
      const act = action as Profiles.ActionMakeWebRequest;
      return `Send request to "${act.url}" with parameters "${act.value}"`;
    }
    default:
      return "Unknown action";
  }
}

function getConditionText(condition: Profiles.Condition): string | undefined {
  switch (condition.type) {
    case "rolled": {
      const faces = (condition as Profiles.ConditionRolled).faces;
      return faces === "all"
        ? "On other faces"
        : faces.length <= 1
          ? `On face ${faces[0].toString() ?? "?"}`
          : `On faces ${[...faces].reverse().join(", ")}`;
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

export const ActionDetails = observer(function ({
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

export const ConditionDetails = observer(function ({
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
            <ActionDetails action={action} />
            {condition && <ConditionDetails condition={condition} />}
          </View>
          <View style={styles.animationDie}>
            <DieRenderer dieType={dieType} colorway="midnightGalaxy" />
          </View>
        </View>
      ) : (
        <View
          style={{
            marginVertical: 10,
            gap: 5,
          }}
        >
          <ActionDetails action={action} />
          {condition && <ConditionDetails condition={condition} />}
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

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

function getActionText(action: Profiles.Action) {
  switch (action.type) {
    case "playAnimation": {
      const act = action as Profiles.ActionPlayAnimation;
      return `Play "${act.animation?.name ?? ""}" ${getCountText(
        act.loopCount
      )}`;
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

export const ActionDetails = observer(function ({
  action,
  noActionIcon,
  ...props
}: {
  action: Profiles.Action;
  noActionIcon?: boolean;
} & ViewProps) {
  return (
    <View {...props}>
      {!noActionIcon && (
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

export function ActionDetailsCard({
  action,
  dieType,
  ...props
}: {
  action: Profiles.Action;
  dieType: PixelDieType;
} & ViewProps) {
  const actionType = action.type;
  return (
    <View {...props}>
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
            <DieRenderer dieType={dieType} colorway="midnightGalaxy" />
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
});

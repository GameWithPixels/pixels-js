import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import { View, StyleSheet, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { ActionTypeIcon } from "~/components/actions";
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
    case "playAudioClip":
      return `Play "${
        (action as Profiles.ActionPlayAudioClip).clip?.name ?? ""
      }"`;
    case "speakText":
      return `Speak "${"some text"}"`;
    case "makeWebRequest":
      return `Send request to "${
        (action as Profiles.ActionMakeWebRequest).url
      }"`;
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

/*
        actionType === "playAudioClip" ? (
        <View style={{ marginVertical: 5, gap: 5 }}>
          {<Text variant="titleSmall">
            {hasData ? `Play "Trumpets"` : "No sound selected"}
          </Text>
          {hasData && (
            <>
              <Text style={AppStyles.greyedOut}>Volume: 80%</Text>
              <Text style={AppStyles.greyedOut}>Repeat Count: 2</Text>
            </>
          )}}
        </View>
      ) : actionType === "speakText" ? (
        <View style={{ marginVertical: 5, gap: 5 }}>
          {<Text variant="titleSmall">Speak "Face"</Text>
          {hasData && (
            <Text style={AppStyles.greyedOut}>Volume: 70%</Text>
          )}}
        </View>
      ) : actionType === "makeWebRequest" ? (
        <View style={{ marginVertical: 5, gap: 5 }}>
          {<Text variant="titleSmall">
            {hasData ? `Notify "ifttt.com"` : "No website selected"}
          </Text>
          {hasData && (
            <Text style={AppStyles.greyedOut}>Parameters: $face</Text>
          )}}
        </View>
      ) : (
        <></>
      )}
*/
// isRolled ? (
//   <View style={styles.rolledRuleGroupStyle}>
//     <View style={styles.ruleIconStyle}>
//       <MaterialCommunityIcons
//         name="web"
//         size={16}
//         color={AppStyles.greyedOut.color}
//       />
//     </View>
//     <View style={styles.ruleTextStyle}>
//       <Text style={AppStyles.greyedOut}>
//         Make request to "ifttt.com"
//       </Text>
//     </View>
//   </View>
// < Text style = { styles.facesStyle } variant = "bodyMedium" >
//   On face 1
//           </Text >
// <View style={styles.rolledRuleGroupStyle}>
//   <View style={styles.ruleIconStyle}>
//     <AnimationsIcon size={16} color={AppStyles.greyedOut.color} />
//   </View>
//   <View style={{ flex: 1, flexGrow: 1 }}>
//     <Text
//       numberOfLines={expandedToggle ? 0 : 1}
//       style={{ ...AppStyles.greyedOut, marginRight: 1 }} // Weird bug that clip the text
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
//           <AnimationsIcon size={16} color={AppStyles.greyedOut.color} />
//         </View>
//         <Text style={AppStyles.greyedOut}>Play "Waterfall" for 5s</Text>
//       </View>
//       <Text style={styles.facesStyle} variant="bodyMedium">
//         On all faces
//       </Text>
//       <View style={styles.rolledRuleGroupStyle}>
//         <View style={styles.ruleIconStyle}>
//           <ActionTypeIcon type="speakText" size={16} color={AppStyles.greyedOut.color} />
//         </View>
//         <Text style={AppStyles.greyedOut}>Speak Number</Text>
//       </View>
//     </Animated.View>
//   );
// }

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

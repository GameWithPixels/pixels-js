import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme, Text, Switch } from "react-native-paper";
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

import { ConfigureAnimationModal } from "./ConfigureAnimationModal";

import { TouchableCard } from "~/components/TouchableCard";
import { ActionTypeIcon } from "~/components/actions";
import { AnimatedText } from "~/components/animated";
import { getActionTypeLabel } from "~/descriptions";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useAction } from "~/hooks";
import { Colors } from "~/themes";
import { withAnimated } from "~/withAnimated";

function EditActionContents({
  action,
  style,
  hasData,
  ...props
}: { hasData: boolean } & ActionEditCommonProps & ViewProps) {
  const { type: actionType } = useAction(action);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });

  const animName = "Rotating Rings";
  const overridesFlag = 3;

  return (
    <View
      style={[
        {
          marginTop: -20,
          paddingTop: 20,
          padding: 10,
          borderWidth: 1,
          borderTopWidth: 0,
          borderRadius,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderColor: colors.outline,
          gap: 10,
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
          }}
        >
          <View
            style={{
              flexGrow: 1,
              marginVertical: 5,
              justifyContent: "space-evenly",
              gap: 5,
            }}
          >
            <Text variant="titleSmall">
              {hasData ? `Play "${animName}"` : "No animation selected"}
            </Text>
            {hasData && !!((overridesFlag ?? 0) & 1) && (
              <Text style={{ color: Colors.grey500 }}>Repeat Count: 2</Text>
            )}
            {hasData && !!((overridesFlag ?? 0) & 2) && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text style={{ color: Colors.grey500 }}>Color</Text>
                <View
                  style={{
                    height: 12,
                    aspectRatio: 1,
                    borderRadius,
                    borderWidth: 1,
                    borderColor: colors.onSurfaceVariant,
                    backgroundColor: "orange",
                  }}
                />
              </View>
            )}
          </View>
          <View style={{ width: 60, aspectRatio: 1 }}>
            <DieRenderer dieType="d20" colorway="midnightGalaxy" />
          </View>
        </View>
      ) : actionType === "playAudioClip" ? (
        <View style={{ marginVertical: 5, gap: 5 }}>
          <Text variant="titleSmall">
            {hasData ? `Play "Trumpets"` : "No sound selected"}
          </Text>
          {hasData && (
            <>
              <Text style={{ color: Colors.grey500 }}>Volume: 80%</Text>
              <Text style={{ color: Colors.grey500 }}>Repeat Count: 2</Text>
            </>
          )}
        </View>
      ) : actionType === "speakText" ? (
        <View style={{ marginVertical: 5, gap: 5 }}>
          <Text variant="titleSmall">Speak "Face"</Text>
          {hasData && (
            <Text style={{ color: Colors.grey500 }}>Volume: 70%</Text>
          )}
        </View>
      ) : actionType === "makeWebRequest" ? (
        <View style={{ marginVertical: 5, gap: 5 }}>
          <Text variant="titleSmall">
            {hasData ? `Notify "ifttt.com"` : "No website selected"}
          </Text>
          {hasData && (
            <Text style={{ color: Colors.grey500 }}>Parameters: $face</Text>
          )}
        </View>
      ) : (
        <></>
      )}
    </View>
  );
}

const AnimatedActionTypeIcon = withAnimated(ActionTypeIcon);
const AnimatedEditActionContents = withAnimated(EditActionContents);

export interface ActionEditCommonProps {
  conditionType: Profiles.ConditionType;
  action: Profiles.Action;
}

export function EditActionCard({
  action,
  conditionType,
}: ActionEditCommonProps) {
  const { type: actionType } = useAction(action);
  const [showContent, setShowContent] = React.useState(false);
  const [hasData, setHasData] = React.useState(false);
  const svShowContent = useSharedValue(showContent);
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
          disabled={!showContent}
          contentStyle={{
            flexDirection: "row",
            minHeight: 50,
            paddingHorizontal: 10,
            padding: 0,
            alignItems: "center",
            justifyContent: "space-between",
          }}
          onPress={showContent ? () => setConfigureVisible(true) : undefined}
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
            value={showContent}
            onValueChange={(v) => {
              setShowContent(v);
              svShowContent.value = v;
              if (!hasData) {
                setConfigureVisible(v);
              }
            }}
          />
        </TouchableCard>
        {showContent && hasData && (
          <AnimatedEditActionContents
            conditionType={conditionType}
            action={Profiles.createAction(actionType)}
            hasData={hasData}
            entering={FadeIn.duration(300).delay(100)}
            exiting={FadeOut.duration(300)}
          />
        )}
      </Animated.View>
      <ConfigureAnimationModal
        conditionType={conditionType}
        actionType={actionType}
        visible={configureVisible}
        onDismiss={() => {
          setConfigureVisible(false);
          setHasData(true);
        }}
      />
    </>
  );
}

import { StackNavigationProp } from "@react-navigation/stack";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import React from "react";
import {
  View,
  ScrollView,
  useWindowDimensions,
  ScrollViewProps,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";

import { ConfigureAnimationModal } from "./components/ConfigureAnimationModal";

import { AppBackground } from "~/components/AppBackground";
import { Card, CardProps } from "~/components/Card";
import { PageHeader } from "~/components/PageHeader";
import { TouchableCard } from "~/components/TouchableCard";
import { actionTypes, getActionTypeIcon } from "~/components/actions";
import { FloatingAddButton, GradientIconButton } from "~/components/buttons";
import {
  getActionTypeDescription,
  getConditionTypeDescription,
  getConditionTypeLabel,
} from "~/descriptions";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useCondition, useProfiles, useRule } from "~/hooks";
import {
  EditProfileSubStackParamList,
  EditRollRulesScreenProps,
} from "~/navigation";
import { Colors } from "~/themes";

function InnerScrollView({ ...props }: ScrollViewProps) {
  const { width } = useWindowDimensions();
  return (
    // Use for Gesture Handler ScrollView for nested scroll views to work
    <GHScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{
        width,
        height: "100%",
        flex: 1,
      }}
      contentContainerStyle={{
        paddingHorizontal: 10,
        paddingBottom: 10,
        gap: 20,
      }}
      {...props}
    />
  );
}

function ActionCard({ ...props }: CardProps) {
  return (
    <Card
      contentStyle={{
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: "flex-start",
        gap: 5,
      }}
      {...props}
    />
  );
}

function EditAnimations({ onPress }: { onPress?: () => void }) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <InnerScrollView>
      {[
        {
          anim: "Rainbow Falls",
          faces: "20",
        },
        {
          anim: "Rotating Rings",
          faces: "19",
          overrides: 3,
        },
        {
          anim: "Waterfall",
          faces: "18, 17 and 16",
          overrides: 2,
        },
        {
          anim: "Blue to Red",
          faces: "2",
        },
        {
          anim: "Red to Yellow",
          faces: "1",
          overrides: 1,
        },
        {
          anim: "Waterfall",
          faces: "15, 14, 13 ... 5, 4, 3",
          remaining: true,
        },
      ].map(({ anim, faces, overrides, remaining }, i) => (
        <View key={i}>
          <TouchableCard
            noBorder
            frameless
            contentStyle={[
              {
                flexDirection: "row",
                padding: 10,
                gap: 5,
              },
            ]}
            onPress={onPress}
          >
            <>
              <Text
                style={{ flexGrow: 1, textAlign: "center" }}
                variant="bodyLarge"
              >
                {remaining
                  ? `All other rolls (${faces})`
                  : `When roll ${
                      faces.includes(" ") ? "is one of" : "is"
                    } ${faces}`}
              </Text>
            </>
          </TouchableCard>
          <View
            style={{
              flexDirection: "row",
              marginTop: -20,
              paddingTop: 20,
              paddingLeft: 20,
              paddingRight: 10,
              alignItems: "stretch",
              borderWidth: 1,
              borderTopWidth: 0,
              borderRadius,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderColor: colors.outline,
              gap: 10,
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
              <Text variant="bodySmall">Play "{anim}"</Text>
              {!!((overrides ?? 0) & 1) && (
                <Text style={{ color: Colors.grey500 }}>Repeat Count: 2</Text>
              )}
              {!!((overrides ?? 0) & 2) && (
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
                      backgroundColor: faces === "19" ? "orange" : "blue",
                    }}
                  />
                </View>
              )}
            </View>
            <View style={{ width: 60, aspectRatio: 1, marginVertical: 5 }}>
              <DieRenderer dieType="d20" colorway="midnightGalaxy" />
            </View>
          </View>
        </View>
      ))}
    </InnerScrollView>
  );
}

function EditSounds() {
  return (
    <InnerScrollView>
      <ActionCard>
        <Text variant="titleSmall">When roll is 20</Text>
        <Text variant="bodySmall">Play "Trumpets"</Text>
        <Text style={{ color: Colors.grey500 }}>Volume: 80%</Text>
        <Text style={{ color: Colors.grey500 }}>Repeat Count: 2</Text>
      </ActionCard>
      <ActionCard>
        <Text variant="titleSmall">When roll is 19</Text>
        <Text variant="bodySmall">Play "Joy"</Text>
        <Text style={{ color: Colors.grey500 }}>Volume: 100%</Text>
      </ActionCard>
      <ActionCard>
        <Text variant="titleSmall">When roll is 1</Text>
        <Text variant="bodySmall">Play "Sadness"</Text>
        <Text style={{ color: Colors.grey500 }}>Volume: 90%</Text>
      </ActionCard>
    </InnerScrollView>
  );
}

function EditSpeak() {
  return (
    <InnerScrollView>
      <ActionCard>
        <Text variant="titleSmall">On all rolls</Text>
        <Text variant="bodySmall">Speak "Face"</Text>
        <Text style={{ color: Colors.grey500 }}>Volume: 70%</Text>
      </ActionCard>
    </InnerScrollView>
  );
}

function EditWebRequests() {
  return (
    <InnerScrollView>
      <Card
        contentStyle={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <Text variant="titleSmall">On all rolls</Text>
        <Text variant="bodySmall">Notify "ifttt.com"</Text>
        <Text style={{ color: Colors.grey500 }}>Parameters: $face</Text>
      </Card>
    </InnerScrollView>
  );
}

function EditRollRulesPage({
  profileUuid,
  navigation,
}: {
  profileUuid: string;
  navigation: StackNavigationProp<EditProfileSubStackParamList>;
}) {
  const { profiles } = useProfiles();
  const { condition } = useRule(profileUuid, 0 /*ruleIndex*/, profiles);
  const { type: conditionType } = useCondition(condition);
  const [configureVisible, setConfigureVisible] = React.useState(false);
  const { roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });

  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });

  return (
    <>
      <View style={{ height: "100%", gap: 10 }}>
        <PageHeader
          mode="arrow-left"
          title={getConditionTypeLabel(conditionType)}
          onGoBack={() => navigation.goBack()}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            marginHorizontal: 10,
          }}
        >
          {actionTypes.map((t, i) => {
            const Icon = getActionTypeIcon(t);
            return (
              Icon && (
                <GradientIconButton
                  key={t}
                  style={{
                    width: "25%",
                    justifyContent: "center",
                    borderTopLeftRadius: i === 0 ? borderRadius : 0,
                    borderBottomLeftRadius: i === 0 ? borderRadius : 0,
                    borderTopRightRadius:
                      i === actionTypes.length - 1 ? borderRadius : 0,
                    borderBottomRightRadius:
                      i === actionTypes.length - 1 ? borderRadius : 0,
                  }}
                  outline={index !== i}
                  icon={Icon}
                  onPress={() => scrollTo(i)}
                />
              )
            );
          })}
        </View>
        <Text
          variant="bodySmall"
          style={{
            marginHorizontal: 10,
            marginBottom: 10,
            color: Colors.grey500,
          }}
        >
          {getActionTypeDescription(actionTypes[index]) +
            " " +
            getConditionTypeDescription("rolled") +
            "."}
        </Text>
        {/* Use for Gesture Handler ScrollView for nested scroll views to work */}
        <GHScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          onScroll={({ nativeEvent: { contentOffset } }) =>
            setIndex(Math.round(contentOffset.x / width))
          }
          scrollEventThrottle={100}
        >
          <EditAnimations onPress={() => setConfigureVisible(true)} />
          <EditSounds />
          <EditSpeak />
          <EditWebRequests />
        </GHScrollView>
      </View>
      <FloatingAddButton onPress={() => {}} />
      <ConfigureAnimationModal
        conditionType="rolled"
        actionType="playAnimation"
        visible={configureVisible}
        onDismiss={() => setConfigureVisible(false)}
      />
    </>
  );
}

export function EditRollRuleScreen({
  route: {
    params: { profileUuid },
  },
  navigation,
}: EditRollRulesScreenProps) {
  return (
    <AppBackground>
      <EditRollRulesPage profileUuid={profileUuid} navigation={navigation} />
    </AppBackground>
  );
}

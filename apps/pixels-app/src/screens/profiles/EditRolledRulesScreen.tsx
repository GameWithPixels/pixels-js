import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import {
  View,
  ScrollView,
  useWindowDimensions,
  ScrollViewProps,
  StyleSheet,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";

import { ActionDetails } from "./components/ActionDetails";
import { ConfigureActionModal } from "./components/ConfigureActionModal";

import { actionTypes } from "~/actionTypes";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { TouchableCard } from "~/components/TouchableCard";
import { getActionTypeIcon } from "~/components/actions";
import { FloatingAddButton, GradientIconButton } from "~/components/buttons";
import {
  getActionTypeDescription,
  getConditionTypeDescription,
  getConditionTypeLabel,
} from "~/descriptions";
import { makeObservable } from "~/features/makeObservable";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useConfirmActionSheet, useEditableProfile } from "~/hooks";
import { EditRollRulesScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";

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
        paddingBottom: 90,
        gap: 20,
      }}
      {...props}
    />
  );
}

function RolledConditionCard({
  type,
  rule,
  dieType,
  onConfigure,
  onRemove,
}: {
  type: Profiles.ActionType;
  rule: Profiles.Rule;
  dieType: PixelDieType;
  onConfigure?: () => void;
  onRemove?: () => void;
}) {
  const cond = rule.condition as Profiles.ConditionRolled;
  const faces = cond.getFaceList();
  const action = rule.actions.find((a) => a.type === type);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View>
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
        onPress={onConfigure}
      >
        <>
          <Text
            style={{ flexGrow: 1, textAlign: "center" }}
            variant="bodyLarge"
          >
            {faces === "all"
              ? `All other rolls (${faces})`
              : `When roll is ${faces.length > 1 ? "one of" : ""} ${
                  faces.length ? faces.join(", ") : "?"
                }`}
          </Text>
          <MaterialCommunityIcons
            name="trash-can-outline"
            color={colors.onSurface}
            size={20}
            style={{ alignSelf: "center" }}
            onPress={onRemove}
          />
        </>
      </TouchableCard>
      <View
        style={{
          ...styles.bottomView,
          borderRadius,
          borderColor: colors.outline,
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {action ? (
          <>
            <View
              style={{
                flexGrow: 1,
                marginVertical: type === "playAnimation" ? 5 : 10,
                justifyContent: "space-evenly",
                gap: 5,
              }}
            >
              <ActionDetails action={action} noActionIcon />
            </View>
            {type === "playAnimation" && (
              <View style={{ width: 60, aspectRatio: 1, marginVertical: 5 }}>
                <DieRenderer dieType={dieType} colorway="midnightGalaxy" />
              </View>
            )}
          </>
        ) : (
          <Text style={{ ...AppStyles.greyedOut, marginVertical: 10 }}>
            No action
          </Text>
        )}
      </View>
    </View>
  );
}

const defaultCondition = new Profiles.ConditionRolled();
const defaultAction = new Profiles.ActionPlayAnimation();

const EditRolledRulesPage = observer(function ({
  profileUuid,
  onGoBack,
}: {
  profileUuid: string;
  onGoBack: () => void;
}) {
  const profile = useEditableProfile(profileUuid);
  const [configureRule, setConfigureRule] = React.useState<Profiles.Rule>();
  const showConfirmDelete = useConfirmActionSheet("Delete");

  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });

  const { roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <>
      <View style={{ height: "100%", gap: 10 }}>
        <PageHeader
          mode="arrow-left"
          title={getConditionTypeLabel("rolled")}
          onGoBack={onGoBack}
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
            ...AppStyles.greyedOut,
            marginHorizontal: 10,
            marginBottom: 10,
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
          {actionTypes.map((t) => (
            <InnerScrollView key={t}>
              {profile.rules
                .filter(
                  (r) =>
                    r.condition.type === "rolled" &&
                    r.condition.flagName === "equal" &&
                    r.actions.find((a) => a.type === t)
                )
                .map((r, i) => (
                  <RolledConditionCard
                    key={i}
                    type={t}
                    rule={r}
                    dieType={profile.dieType}
                    onConfigure={() => setConfigureRule(r)}
                    onRemove={() =>
                      showConfirmDelete({
                        onConfirm: () =>
                          runInAction(() =>
                            profile.rules.splice(profile.rules.indexOf(r), 1)
                          ),
                      })
                    }
                  />
                ))}
            </InnerScrollView>
          ))}
        </GHScrollView>
      </View>
      <FloatingAddButton
        onPress={() => {
          runInAction(() => {
            const newRule = makeObservable(
              new Profiles.Rule(Profiles.createCondition("rolled", "equal"), {
                actions: [Profiles.createAction(actionTypes[index])],
              })
            );
            profile.rules.push(newRule);
            setConfigureRule(newRule);
          });
        }}
      />
      <ConfigureActionModal
        dieType={profile.dieType}
        condition={configureRule?.condition ?? defaultCondition}
        action={configureRule?.actions[0] ?? defaultAction}
        // unavailableFaces={profile.rules
        //   .map((r) => r.condition)
        //   .filter((c) => c !== cond && c.type === "rolled")
        //   .flatMap((c) => {
        //     const faces = (c as Profiles.ConditionRolled).getFaceList();
        //     return faces === "all" ? [] : faces;
        //   })}
        visible={!!configureRule}
        onDismiss={() => setConfigureRule(undefined)}
      />
    </>
  );
});

export function EditRollRuleScreen({
  route: {
    params: { profileUuid },
  },
  navigation,
}: EditRollRulesScreenProps) {
  return (
    <AppBackground>
      <EditRolledRulesPage
        profileUuid={profileUuid}
        onGoBack={() => navigation.goBack()}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  bottomView: {
    flexDirection: "row",
    marginTop: -20,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 10,
    alignItems: "stretch",
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import {
  DiceUtils,
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
import { useRolledConditionFaces } from "~/hooks/useRolledConditionFaces";
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
  const faces = useRolledConditionFaces(cond);
  const action = rule.actions.find((a) => a.type === type);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View>
      <TouchableCard
        noBorder
        frameless
        contentStyle={{ flexDirection: "row", padding: 0 }}
        onPress={onConfigure}
      >
        <>
          <Text
            style={{
              flexGrow: 1,
              textAlign: "center",
              paddingVertical: 10,
              marginHorizontal: 60,
            }}
            variant="bodyLarge"
          >
            {faces === "all"
              ? `All other rolls`
              : `When roll is ${faces.length > 1 ? "one of" : ""} ${
                  faces.length ? [...faces].reverse().join(", ") : "?"
                }`}
          </Text>
          {onRemove && (
            <MaterialCommunityIcons
              name="trash-can-outline"
              color={colors.onSurface}
              size={24}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: "100%",
                paddingHorizontal: 10,
                textAlign: "center",
                textAlignVertical: "center",
              }} // Making the touchable surface take full height
              onPress={onRemove}
            />
          )}
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

function createObservableRolledRule(
  face: number | "all",
  actionType: Profiles.ActionType
): Profiles.Rule {
  return makeObservable(
    new Profiles.Rule(
      new Profiles.ConditionRolled({
        flags: Profiles.RolledFlagsValues.equal,
        face: face === "all" ? -1 : Math.pow(2, face - 1),
      }),
      { actions: [Profiles.createAction(actionType)] }
    )
  );
}
function getRolledRules(rules: Readonly<Profiles.Rule>[]): Profiles.Rule[] {
  return rules.filter(
    (r) => r.condition.type === "rolled" && r.condition.flagName === "equal"
  );
}

function getRolledFaces(
  rolledRules: Readonly<Profiles.Rule>[],
  actionType: Profiles.ActionType,
  excludedRule?: Readonly<Profiles.Rule>
): number[] | undefined {
  return rolledRules
    .filter(
      (r) =>
        r !== excludedRule &&
        (r.condition as Profiles.ConditionRolled).face >= 0 &&
        r.actions.find((a) => a.type === actionType)
    )
    .map((r) => r.condition)
    .flatMap((c) => {
      const faces = (c as Profiles.ConditionRolled).getFaceList();
      return faces === "all" ? [] : faces;
    });
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
  const rolledRules = React.useMemo(
    () => getRolledRules(profile.rules),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.rules.length] // TODO recompute when a rule is added or removed
  );
  const [configureRule, setConfigureRule] = React.useState<Profiles.Rule>();
  const fallbackRules = React.useMemo(
    () =>
      actionTypes.map(
        (at) =>
          rolledRules.find(
            (r) =>
              (r.condition as Profiles.ConditionRolled).face === -1 &&
              r.actions.find((a) => a.type === at)
          ) ?? createObservableRolledRule("all", at)
      ),
    [rolledRules]
  );

  // Delete rule
  const showConfirmDeleteActionSheet = useConfirmActionSheet("Delete");
  const confirmDelete = React.useCallback(
    (rule: Readonly<Profiles.Rule>) => {
      showConfirmDeleteActionSheet({
        onConfirm: () =>
          runInAction(() => {
            const index = profile.rules.indexOf(rule);
            if (index >= 0) {
              profile.rules.splice(index, 1);
            }
          }),
      });
    },
    [profile.rules, showConfirmDeleteActionSheet]
  );

  // Horizontal scroll
  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });

  // Unavailable faces
  const dieFaces = React.useMemo(
    () => DiceUtils.getDieFaces(profile.dieType),
    [profile.dieType]
  );
  const unavailableFaces = getRolledFaces(rolledRules, actionTypes[index]);
  const availableFace: number | undefined = dieFaces.filter(
    (f) => !unavailableFaces?.includes(f)
  )[0];

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
              {rolledRules
                .filter(
                  (r) =>
                    (r.condition as Profiles.ConditionRolled).face >= 0 &&
                    r.actions.find((a) => a.type === t)
                )
                .sort(
                  (r1, r2) =>
                    (r2.condition as Profiles.ConditionRolled).face -
                    (r1.condition as Profiles.ConditionRolled).face
                )
                .map((r, i) => (
                  <RolledConditionCard
                    key={i}
                    type={t}
                    rule={r}
                    dieType={profile.dieType}
                    onConfigure={() => setConfigureRule(r)}
                    onRemove={() => confirmDelete(r)}
                  />
                ))}
              {!!availableFace && (
                <RolledConditionCard
                  type={t}
                  rule={fallbackRules[index]}
                  dieType={profile.dieType}
                  onConfigure={() => {
                    if (!profile.rules.includes(fallbackRules[index])) {
                      runInAction(() =>
                        profile.rules.push(fallbackRules[index])
                      );
                    }
                    setConfigureRule(fallbackRules[index]);
                  }}
                />
              )}
            </InnerScrollView>
          ))}
        </GHScrollView>
      </View>
      {!!availableFace && (
        <FloatingAddButton
          onPress={() => {
            runInAction(() => {
              const newRule = createObservableRolledRule(
                availableFace,
                actionTypes[index]
              );
              profile.rules.push(newRule);
              setConfigureRule(newRule);
            });
          }}
        />
      )}
      <ConfigureActionModal
        dieType={profile.dieType}
        condition={configureRule?.condition ?? defaultCondition}
        action={configureRule?.actions[0] ?? defaultAction}
        unavailableFaces={getRolledFaces(
          rolledRules,
          actionTypes[index],
          configureRule
        )}
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
    zIndex: -1,
  },
});

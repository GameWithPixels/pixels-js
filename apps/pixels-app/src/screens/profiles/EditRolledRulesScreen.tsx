import { MaterialCommunityIcons } from "@expo/vector-icons";
import { assert } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import {
  DiceUtils,
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { computed, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import {
  View,
  ScrollView,
  useWindowDimensions,
  ScrollViewProps,
  StyleSheet,
  Pressable,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import {
  Text,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";
import Animated, {
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { ActionDetails } from "./components/ActionDetails";
import { ConfigureActionModal } from "./components/ConfigureActionModal";

import { actionTypes } from "~/actionTypes";
import { AppBackground } from "~/components/AppBackground";
import { Card } from "~/components/Card";
import { PageHeader } from "~/components/PageHeader";
import { getActionTypeIcon } from "~/components/actions";
import { FloatingAddButton, GradientIconButton } from "~/components/buttons";
import {
  getActionTypeDescription,
  getConditionTypeDescription,
  getConditionTypeLabel,
  getFacesAsText,
} from "~/descriptions";
import { getHighestFace } from "~/features/getHighestFace";
import { makeObservable } from "~/features/makeObservable";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useEditableProfile } from "~/hooks";
import { EditRollRulesScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";
import { withAnimated } from "~/withAnimated";

interface InnerScrollViewHandle {
  addPadding: (padding: number) => void;
}

const InnerScrollView = React.forwardRef(function InnerScrollView(
  { children, ...props }: ScrollViewProps,
  ref: React.ForwardedRef<InnerScrollViewHandle>
) {
  const { width } = useWindowDimensions();

  // See this issue about jumping when deleting an item with the view scrolled down
  // https://github.com/software-mansion/react-native-reanimated/issues/3412
  const scrollViewPadding = useSharedValue(0);
  React.useImperativeHandle(
    ref,
    () => ({
      addPadding: (padding: number) => {
        scrollViewPadding.value += padding;
        console.log("TODO need this log to work" + scrollViewPadding.value);
      },
    }),
    [scrollViewPadding]
  );

  const scrollHandler = useAnimatedScrollHandler((event) => {
    const maxOffsetY =
      event.contentSize.height - event.layoutMeasurement.height;
    const scrolledUp = Math.max(0, maxOffsetY - event.contentOffset.y);
    scrollViewPadding.value = Math.max(0, scrollViewPadding.value - scrolledUp);
  });
  const scrollViewAnimated = useAnimatedStyle(() => {
    return { paddingBottom: scrollViewPadding.value, gap: 20 };
  });

  return (
    // Use Gesture Handler (now Animated) ScrollView for nested scroll views to work
    <Animated.ScrollView
      contentInsetAdjustmentBehavior="automatic"
      onScroll={scrollHandler}
      style={{ width, height: "100%", flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 10,
        paddingBottom: 90,
      }}
      {...props}
    >
      <Animated.View style={scrollViewAnimated}>{children}</Animated.View>
    </Animated.ScrollView>
  );
});

const AnimatedRolledConditionCard = withAnimated(RolledConditionCard);

function RolledConditionCard({
  type,
  rule,
  dieType,
  onDelete,
  ...props
}: {
  type: Profiles.ActionType;
  rule: Profiles.Rule;
  dieType: PixelDieType;
  onDelete?: () => void;
} & Omit<TouchableRippleProps, "children">) {
  const cond = rule.condition as Profiles.ConditionRolled;
  const action = rule.actions.find((a) => a.type === type);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const color =
    !props.disabled && action ? colors.onSurface : colors.onSurfaceDisabled;
  return (
    <TouchableRipple {...props}>
      <>
        <Card
          disabled={props.disabled}
          noBorder
          frameless
          contentStyle={styles.actionCard}
        >
          <View style={styles.actionIconBox} />
          <Text
            style={{ ...styles.actionCardTitle, color }}
            variant="bodyLarge"
          >
            {cond.faces === "all"
              ? `All other faces`
              : `When rolled face is${
                  cond.faces.length > 1 ? " one of" : ""
                } ${getFacesAsText(cond.faces)}`}
          </Text>
          <Pressable
            onPress={props.disabled ? undefined : onDelete}
            style={styles.actionIconBox}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              color={color}
              size={24}
              style={styles.actionDeleteIcon}
            />
          </Pressable>
        </Card>
        <View
          style={{
            ...styles.bottomView,
            borderRadius,
            borderColor: colors.outline,
            gap: 10,
            pointerEvents: "none",
          }}
        >
          {props.disabled ? (
            <Text style={styles.noAction}>All faces are assigned</Text>
          ) : action ? (
            <>
              <View
                style={{
                  flexGrow: 1,
                  marginVertical: type === "playAnimation" ? 5 : 10,
                  justifyContent: "space-evenly",
                  gap: 5,
                }}
              >
                <ActionDetails action={action} />
              </View>
              {type === "playAnimation" && (
                <View style={styles.animationDie}>
                  <DieRenderer dieType={dieType} colorway="midnightGalaxy" />
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noAction}>Tap to enable</Text>
          )}
        </View>
      </>
    </TouchableRipple>
  );
}

function createObservableRolledRule(
  faces: number[] | "all",
  actionType?: Profiles.ActionType
): Profiles.Rule {
  return makeObservable(
    new Profiles.Rule(new Profiles.ConditionRolled({ faces }), {
      actions: actionType ? [Profiles.createAction(actionType)] : [],
    })
  );
}

function getRolledRules(rules: Readonly<Profiles.Rule>[]): Profiles.Rule[] {
  return rules.filter((r) => r.condition.type === "rolled");
}

function getRolledFaces(
  rolledRules: Readonly<Profiles.Rule>[],
  actionType: Profiles.ActionType,
  excludedRule?: Readonly<Profiles.Rule>
): number[] {
  return rolledRules
    .filter(
      (r) =>
        r !== excludedRule &&
        (r.condition as Profiles.ConditionRolled).faces !== "all" &&
        r.actions.find((a) => a.type === actionType)
    )
    .flatMap(
      (r) => (r.condition as Profiles.ConditionRolled).faces as number[]
    );
}

const defaultCondition = new Profiles.ConditionRolled();
const defaultAction = new Profiles.ActionPlayAnimation();

const EditRolledRulesPage = observer(function EditRolledRulesPage({
  profileUuid,
  onGoBack,
}: {
  profileUuid: string;
  onGoBack: () => void;
}) {
  const profile = useEditableProfile(profileUuid);
  const rolledRules = React.useMemo(
    () => computed(() => getRolledRules(profile.rules)),
    [profile]
  ).get();
  const [configureRule, setConfigureRule] = React.useState<Profiles.Rule>();
  const fallbackRules = React.useMemo(
    () =>
      actionTypes.map(
        (at) =>
          rolledRules.find(
            (r) =>
              (r.condition as Profiles.ConditionRolled).faces === "all" &&
              r.actions.find((a) => a.type === at)
          ) ?? createObservableRolledRule("all")
      ),
    [rolledRules]
  );

  // Horizontal scroll
  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });

  const fbRule = fallbackRules[index];

  // Unavailable faces
  const dieFaces = React.useMemo(
    () => [...DiceUtils.getDieFaces(profile.dieType)].reverse(),
    [profile.dieType]
  );
  const unavailableFaces = getRolledFaces(rolledRules, actionTypes[index]);
  const availableFace = dieFaces.find((f) => !unavailableFaces?.includes(f));

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });

  const scrollViewRefs = [
    React.useRef<InnerScrollViewHandle>(null),
    React.useRef<InnerScrollViewHandle>(null),
    React.useRef<InnerScrollViewHandle>(null),
    React.useRef<InnerScrollViewHandle>(null),
  ];
  assert(
    scrollViewRefs.length >= actionTypes.length,
    `Number of scroll view refs must be at least ${actionTypes.length}`
  );
  return (
    <>
      <View style={{ height: "100%", gap: 10 }}>
        <PageHeader mode="arrow-left" onGoBack={onGoBack}>
          {getConditionTypeLabel("rolled")}
        </PageHeader>
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
                // Linear gradient border radius doesn't work properly on iOS
                // so we use a View with a border instead
                <View
                  key={t}
                  style={{
                    width: "25%",
                    justifyContent: "center",
                    borderColor: index !== i ? colors.outline : "transparent",
                    borderWidth: 1,
                    borderLeftWidth: i > 0 ? 1 : 0,
                    borderRightWidth: i === actionTypes.length - 1 ? 1 : 0,
                    borderRadius,
                    borderTopLeftRadius: i === 0 ? borderRadius : 0,
                    borderBottomLeftRadius: i === 0 ? borderRadius : 0,
                    borderTopRightRadius:
                      i === actionTypes.length - 1 ? borderRadius : 0,
                    borderBottomRightRadius:
                      i === actionTypes.length - 1 ? borderRadius : 0,
                    overflow: "hidden",
                  }}
                >
                  <GradientIconButton
                    style={{
                      borderWidth: 0,
                      borderRadius,
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
                </View>
              )
            );
          })}
        </View>
        <Text variant="bodySmall" style={styles.description}>
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
          {actionTypes.map((t, i) => (
            <InnerScrollView key={t} ref={scrollViewRefs[i]}>
              {rolledRules
                .filter(
                  (r) =>
                    (r.condition as Profiles.ConditionRolled).faces !== "all" &&
                    (r.condition as Profiles.ConditionRolled).faces.length &&
                    r.actions.find((a) => a.type === t)
                )
                .sort(
                  (r1, r2) =>
                    getHighestFace(
                      (r2.condition as Profiles.ConditionRolled).faces
                    ) -
                    getHighestFace(
                      (r1.condition as Profiles.ConditionRolled).faces
                    )
                )
                .map((r) => (
                  <AnimatedRolledConditionCard
                    key={r.uuid}
                    entering={FadeIn.duration(300).delay(200)}
                    exiting={FadeOut.duration(300)}
                    layout={CurvedTransition.easingY(Easing.linear).delay(200)}
                    type={t}
                    rule={r}
                    dieType={profile.dieType}
                    onPress={() => setConfigureRule(r)}
                    onDelete={() => {
                      scrollViewRefs[i].current?.addPadding(200);
                      runInAction(() =>
                        profile.rules.splice(profile.rules.indexOf(r), 1)
                      );
                    }}
                  />
                ))}
              <AnimatedRolledConditionCard
                type={t}
                entering={FadeIn.duration(300)}
                layout={CurvedTransition.easingY(Easing.linear).delay(200)}
                rule={fbRule}
                dieType={profile.dieType}
                disabled={!fbRule || availableFace === undefined}
                onPress={() => {
                  if (!profile.rules.includes(fbRule)) {
                    runInAction(() => {
                      fbRule.actions[0] = makeObservable(
                        Profiles.createAction(t)
                      );
                      profile.rules.push(fbRule);
                    });
                  }
                  setConfigureRule(fbRule);
                }}
                onDelete={
                  profile.rules.includes(fbRule)
                    ? () =>
                        runInAction(() =>
                          profile.rules.splice(profile.rules.indexOf(fbRule), 1)
                        )
                    : undefined
                }
              />
            </InnerScrollView>
          ))}
        </GHScrollView>
      </View>
      <FloatingAddButton
        disabled={availableFace === undefined}
        onPress={
          availableFace
            ? () => {
                const newRule = createObservableRolledRule(
                  [availableFace],
                  actionTypes[index]
                );
                runInAction(() => {
                  profile.rules.push(newRule);
                });
                setConfigureRule(newRule);
              }
            : undefined
        }
      />
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
  actionCard: {
    flexDirection: "row",
    padding: 0,
  },
  actionCardTitle: {
    flexGrow: 1,
    flexShrink: 1,
    marginVertical: 12,
    textAlign: "center",
  },
  actionIconBox: {
    height: 50,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDeleteIcon: {
    textAlign: "center",
  },
  noAction: {
    ...AppStyles.greyedOut,
    marginVertical: 10,
  },
  animationDie: {
    width: 60,
    aspectRatio: 1,
    marginVertical: 5,
  },
  description: {
    ...AppStyles.greyedOut,
    marginHorizontal: 10,
    marginBottom: 10,
  },
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

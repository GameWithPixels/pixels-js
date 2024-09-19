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
  TextProps,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";
import Animated, {
  cancelAnimation,
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionDetails, ActionDieRenderer } from "./components/ActionDetails";
import { ConfigureActionBottomSheet } from "./components/ConfigureActionBottomSheet";

import { EditRollRulesScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { Card } from "~/components/Card";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { getActionTypeIcon } from "~/components/actions";
import { AnimatedText } from "~/components/animated";
import { FloatingAddButton, GradientIconButton } from "~/components/buttons";
import {
  EditorActionTypes,
  getActionTypeDescription,
  getConditionTypeDescription,
  getConditionTypeLabel,
  getFacesAsText,
  rolledConditionComparator,
} from "~/features/profiles";
import { makeObservable } from "~/features/utils";
import { withAnimated } from "~/features/withAnimated";
import { fixForScrollViewPadding } from "~/fixes";
import { useEditableProfile } from "~/hooks";

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
        fixForScrollViewPadding(scrollViewPadding.value);
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
        paddingBottom: 60,
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
  const action = rule.actions.find((a) => a.type === type);
  const faces =
    rule.condition instanceof Profiles.ConditionRolled
      ? rule.condition.faces.map((f) =>
          DiceUtils.unMapFaceFromAnimation(f, dieType)
        )
      : [];
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
            {`When rolled face is${
              faces.length > 1 ? " one of" : ""
            } ${getFacesAsText(faces)}`}
          </Text>
          <Pressable
            sentry-label="remove-rolled-rule"
            style={styles.actionIconBox}
            onPress={props.disabled ? undefined : onDelete}
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
            <Text
              style={{
                marginVertical: 10,
                color: colors.onSurfaceDisabled,
              }}
            >
              All faces are assigned
            </Text>
          ) : action ? (
            <>
              <View
                style={{
                  flex: 1,
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
                  <ActionDieRenderer action={action} dieType={dieType} />
                </View>
              )}
            </>
          ) : (
            <Text
              style={{
                marginVertical: 10,
                color: colors.onSurfaceDisabled,
              }}
            >
              Tap to enable
            </Text>
          )}
        </View>
      </>
    </TouchableRipple>
  );
}

function RemainingFacesText({
  availableCount,
  hasActions,
  dieFacesCount,
  ...props
}: {
  availableCount: number;
  hasActions: boolean;
  dieFacesCount: number;
} & Omit<TextProps<never>, "children">) {
  return (
    <AnimatedText
      layout={CurvedTransition.easingY(Easing.linear).delay(200)}
      {...props}
    >
      {!availableCount
        ? "All faces have an animation :)"
        : hasActions
          ? `${availableCount} face${
              availableCount > 1 ? "s" : ""
            } out of ${dieFacesCount} without an animation.`
          : "Tap on the (+) button at the bottom to assign an animation to one or more faces."}
    </AnimatedText>
  );
}

function createObservableRolledRule(
  faces: number[],
  dieType: PixelDieType,
  actionType?: Profiles.ActionType
): Profiles.Rule {
  faces = faces.map((f) => DiceUtils.mapFaceForAnimation(f, dieType));
  return makeObservable(
    new Profiles.Rule(
      new Profiles.ConditionRolled({ faces }),
      actionType ? Profiles.createAction(actionType) : undefined
    )
  );
}

function getRolledRules(rules: Readonly<Profiles.Rule>[]): Profiles.Rule[] {
  return rules.filter((r) => r.condition.type === "rolled");
}

function getRolledFaces(
  rolledRules: Readonly<Profiles.Rule>[],
  actionType: Profiles.ActionType,
  dieType: PixelDieType,
  excludedRule?: Readonly<Profiles.Rule>
): number[] {
  return rolledRules
    .filter(
      (r) => r !== excludedRule && r.actions.find((a) => a.type === actionType)
    )
    .flatMap(
      (r) =>
        ((r.condition as Profiles.ConditionRolled).faces.map((f) =>
          DiceUtils.unMapFaceFromAnimation(f, dieType)
        ) ?? []) as number[]
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

  // Horizontal scroll
  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });

  // Unavailable faces
  const dieFaces = React.useMemo(
    () => [...DiceUtils.getDieFaces(profile.dieType)].reverse(),
    [profile.dieType]
  );
  const unavailableFaces = getRolledFaces(
    rolledRules,
    EditorActionTypes[index],
    profile.dieType
  );
  const availableFaces = dieFaces.filter((f) => !unavailableFaces?.includes(f));
  const availCount = availableFaces.length;

  const bounce = availCount > 0;
  const bounceSv = useSharedValue(0);
  React.useEffect(() => {
    if (bounce) {
      // const duration = 1200;
      // bounceSv.value = withRepeat(withTiming(1.3, { duration }), -1, true);
      bounceSv.value = withRepeat(
        withSequence(withTiming(15), withSpring(0, { damping: 2.5 })),
        -1,
        true
      );
      return () => cancelAnimation(bounceSv);
    }
  }, [bounce, bounceSv]);
  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        // TODO those factors are arbitrary
        // { translateX: 150 * (1 - bounceSv.value) },
        // { translateY: 75 * (bounceSv.value - 1) },
        // { scaleX: bounceSv.value },
        // { scaleY: bounceSv.value },
        { translateY: -bounceSv.value },
      ],
    };
  });

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const { bottom: bottomInset } = useSafeAreaInsets();

  const scrollViewRefs = [
    React.useRef<InnerScrollViewHandle>(null),
    React.useRef<InnerScrollViewHandle>(null),
    React.useRef<InnerScrollViewHandle>(null),
    React.useRef<InnerScrollViewHandle>(null),
  ];
  assert(
    scrollViewRefs.length >= EditorActionTypes.length,
    `Number of scroll view refs must be at least ${EditorActionTypes.length}`
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
          {EditorActionTypes.map((t, i) => {
            const Icon = getActionTypeIcon(t);
            return (
              Icon && (
                // Linear gradient border radius doesn't work properly on iOS
                // so we use a View with a border instead
                <View
                  key={t}
                  style={{
                    width: `${100 / EditorActionTypes.length}%`,
                    justifyContent: "center",
                    borderColor: index !== i ? colors.outline : "transparent",
                    borderWidth: 1,
                    borderLeftWidth: i > 0 ? 1 : 0,
                    borderRightWidth:
                      i === EditorActionTypes.length - 1 ? 1 : 0,
                    borderRadius,
                    borderTopLeftRadius: i === 0 ? borderRadius : 0,
                    borderBottomLeftRadius: i === 0 ? borderRadius : 0,
                    borderTopRightRadius:
                      i === EditorActionTypes.length - 1 ? borderRadius : 0,
                    borderBottomRightRadius:
                      i === EditorActionTypes.length - 1 ? borderRadius : 0,
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
                        i === EditorActionTypes.length - 1 ? borderRadius : 0,
                      borderBottomRightRadius:
                        i === EditorActionTypes.length - 1 ? borderRadius : 0,
                    }}
                    outline={index !== i}
                    icon={Icon}
                    sentry-label={"select-" + t}
                    onPress={() => scrollTo(i)}
                  />
                </View>
              )
            );
          })}
        </View>
        <Text variant="bodySmall" style={styles.description}>
          {getActionTypeDescription(EditorActionTypes[index]) +
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
          {EditorActionTypes.map((t, i) => {
            const actionRules = rolledRules
              .filter(
                (r) =>
                  (r.condition as Profiles.ConditionRolled).faces?.length &&
                  r.actions.find((a) => a.type === t)
              )
              .sort(rolledConditionComparator);
            return (
              <InnerScrollView key={t} ref={scrollViewRefs[i]}>
                {actionRules.map((r) => (
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
                <RemainingFacesText
                  availableCount={availCount}
                  hasActions={!!actionRules.length}
                  dieFacesCount={dieFaces.length}
                  style={{ alignSelf: "center", color: colors.onSurface }}
                />
              </InnerScrollView>
            );
          })}
        </GHScrollView>
      </View>
      <Animated.View style={bounceStyle}>
        <FloatingAddButton
          disabled={!availCount}
          bottomInset={bottomInset}
          sentry-label="add-rolled-rule"
          onPress={() => {
            cancelAnimation(bounceSv);
            const newRule = createObservableRolledRule(
              [availableFaces[0]],
              profile.dieType,
              EditorActionTypes[index]
            );
            runInAction(() => profile.rules.push(newRule));
            setConfigureRule(newRule);
          }}
        />
      </Animated.View>
      <ConfigureActionBottomSheet
        dieType={profile.dieType}
        profileName={profile.name}
        condition={configureRule?.condition ?? defaultCondition}
        action={configureRule?.actions[0] ?? defaultAction}
        unavailableFaces={getRolledFaces(
          rolledRules,
          EditorActionTypes[index],
          profile.dieType,
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
      <SelectedPixelTransferProgressBar />
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
    paddingLeft: 10,
    paddingRight: 5,
    alignItems: "stretch",
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    zIndex: -1,
  },
});

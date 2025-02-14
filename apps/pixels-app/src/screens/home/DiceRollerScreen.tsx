import { addListener, UnsubscribeListener } from "@reduxjs/toolkit";
import { assertNever, range } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { TextProps, View, ViewProps, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Divider, Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  AnimatedProps,
  AnimatedRef,
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  scrollTo,
  SharedValue,
  SlideInDown,
  SlideInUp,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { OptionsMenu } from "./components/RollerOptionsMenu";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { DiceRollerScreenProps } from "~/app/navigation";
import { RootState } from "~/app/store";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { Card, CardProps } from "~/components/Card";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import { PageHeader } from "~/components/PageHeader";
import { RollFormulaEditor } from "~/components/RollFormulaEditor";
import { DieWireframe } from "~/components/icons";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  getSimplifiedRollFormula,
  rollFormulaToString,
} from "~/features/rollFormula";
import {
  addFormulaRollEntry,
  addRollEntry,
  FormulaRollEntry,
  FormulaRollsState,
  generateRollEntryUuid,
  removeRollerEntry,
  setRollerActiveEntryUuid,
  SingleRollEntry,
  SingleRollsState,
  updateFormulaRollEntry,
} from "~/features/store";

function RollTouchableCard({
  children,
  title,
  expectedRolls,
  rolls,
  endText,
  result = "?",
  sizeFactor,
  cardWidth,
  withEnteringAnim,
  style,
  onPress,
  onLongPress,
  ...props
}: {
  title?: string;
  expectedRolls: readonly Readonly<{
    dieType: PixelDieType;
    count: number;
    twice?: boolean;
  }>[];
  rolls?: readonly Readonly<{
    dieType: PixelDieType;
    value: number;
  }>[];
  endText?: string;
  result?: number | string;
  sizeFactor: number;
  cardWidth: number;
  withEnteringAnim?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
} & CardProps) {
  const remainingRolls = rolls ? [...rolls] : [];
  const { colors } = useTheme();
  return (
    <Card
      frameless
      noBorder
      vivid
      style={[
        {
          marginVertical: sizeFactor * 0.03,
          width: cardWidth,
        },
        style,
      ]}
      contentStyle={[
        {
          margin: sizeFactor * 0.03,
          padding: 0,
          backgroundColor: colors.background,
        },
      ]}
      {...props}
    >
      <TouchableRipple
        onPress={onPress}
        onLongPress={onLongPress}
        style={{ width: "100%", alignItems: "center" }}
      >
        <>
          {title && <Text variant="titleMedium">{title}</Text>}
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexGrow: 1,
                flexShrink: 1,
                flexDirection: "row",
                height: 2 * sizeFactor * 0.3,
                alignItems: "center",
                justifyContent: "space-evenly",
              }}
            >
              {expectedRolls.map((dice, i) => (
                <View style={{ flexDirection: "row" }} key={i}>
                  {range(dice.count).map((j) => (
                    <View key={j}>
                      {range(dice.twice ? 2 : 1).map((k) => {
                        const index = remainingRolls.findIndex(
                          (r) => r.dieType === dice.dieType
                        );
                        const value = remainingRolls[index]?.value;
                        if (index >= 0) {
                          remainingRolls.splice(index, 1);
                        }
                        return (
                          <View key={k}>
                            <DieWireframe
                              dieType={dice.dieType}
                              size={sizeFactor * 0.3}
                            />
                            {value !== undefined && (
                              <AnimatedRolledDie
                                value={value}
                                entering={
                                  withEnteringAnim
                                    ? SlideInUp.springify()
                                        .mass(1)
                                        .damping(20)
                                        .stiffness(200)
                                    : undefined
                                }
                                textStyle={{
                                  width: sizeFactor * 0.25,
                                  textAlign: "center",
                                  fontFamily: "LTInternet-Bold",
                                  fontSize: sizeFactor * 0.2,
                                  lineHeight: sizeFactor * 0.25,
                                  color: colors.secondary,
                                  backgroundColor: colors.background,
                                  borderRadius: sizeFactor,
                                }}
                              />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              ))}
              {endText && (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    fontFamily: "LTInternet-Bold",
                    textAlign: "center",
                    fontSize: sizeFactor * 0.25,
                    lineHeight: sizeFactor * 0.3,
                  }}
                >
                  {endText}
                </Text>
              )}
            </View>
            <Divider
              style={{
                height: "90%",
                width: 1,
                backgroundColor: colors.onPrimary,
              }}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                width: 0.5 * sizeFactor,
                fontFamily: "LTInternet-Bold",
                textAlign: "center",
                fontSize: sizeFactor * 0.45,
                lineHeight: sizeFactor * 0.5,
              }}
            >
              {result}
            </Text>
          </View>
        </>
      </TouchableRipple>
      {children}
    </Card>
  );
}

function AnimatedRolledDie({
  value,
  textStyle,
  ...props
}: AnimatedProps<ViewProps> & {
  value: number;
  textStyle?: TextProps["style"];
}) {
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
      {...props}
    >
      <Text numberOfLines={1} adjustsFontSizeToFit style={textStyle}>
        {value}
      </Text>
    </Animated.View>
  );
}

function FormulaTouchableCard({
  formulaEntry,
  showEditor,
  sizeFactor,
  cardWidth,
  withEnteringAnim,
  onPress,
  onLongPress,
  ...props
}: {
  formulaEntry: Readonly<FormulaRollEntry>;
  showEditor?: boolean;
  sizeFactor: number;
  cardWidth: number;
  withEnteringAnim?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
} & CardProps) {
  const appDispatch = useAppDispatch();
  const { formula, rolls, uuid: formulaUuid } = formulaEntry;

  const simpleFormula = React.useMemo(
    () => getSimplifiedRollFormula(formula),
    [formula]
  ) ?? { dieType: "d20", dieCount: 1, constant: 0 };

  const { dieType, dieCount, constant } = simpleFormula;
  const endText = constant
    ? `${simpleFormula.constant >= 0 ? "+" : ""}${constant}`
    : undefined;
  const rollTwice =
    simpleFormula?.modifier === "advantage" ||
    simpleFormula?.modifier === "disadvantage";

  const expectedRolls = [{ dieType, count: dieCount, twice: rollTwice }];
  if (simpleFormula?.bonus === "guidance") {
    expectedRolls.push({ dieType: "d4", count: 1, twice: false });
  }

  return (
    <RollTouchableCard
      title={rollFormulaToString(formula)}
      expectedRolls={expectedRolls}
      rolls={rolls}
      endText={endText}
      result={formulaEntry.result?.value}
      sizeFactor={sizeFactor}
      cardWidth={cardWidth}
      withEnteringAnim={withEnteringAnim}
      onPress={onPress}
      onLongPress={onLongPress}
      {...props}
    >
      {showEditor && (
        <>
          <Divider style={{ width: "90%", marginVertical: 10 }} />
          <RollFormulaEditor
            formula={formula}
            onFormulaChange={(formula) =>
              appDispatch(
                updateFormulaRollEntry({
                  uuid: formulaUuid,
                  formula,
                })
              )
            }
          />
        </>
      )}
    </RollTouchableCard>
  );
}

interface AnimatedRollCardHandle {
  overrideSizeRatio: (sizeRatio: number) => void;
}

const AnimatedTouchableCard = React.forwardRef(function AnimatedTouchableCard(
  {
    sizeRatio,
    numberOfItems,
    fullWidth,
    parentViewWidth,
    position,
    withEnteringAnim,
    onRemove,
    card,
  }: React.PropsWithChildren<{
    sizeRatio: number;
    numberOfItems: number;
    fullWidth?: boolean;
    parentViewWidth: number;
    position?: "left" | "right" | "center" | "center-left" | "center-right";
    withEnteringAnim?: boolean;
    onRemove?: () => void;
    card?: (props: {
      sizeFactor: number;
      cardWidth: number;
      style: ViewProps["style"];
    }) => React.ReactNode;
  }>,
  ref: React.ForwardedRef<AnimatedRollCardHandle>
) {
  const [sizeFactor, setSizeFactor] = React.useState(
    sizeRatio * parentViewWidth
  );
  React.useEffect(
    () => setSizeFactor(sizeRatio * parentViewWidth),
    [parentViewWidth, sizeRatio]
  );
  React.useImperativeHandle(ref, () => {
    return {
      overrideSizeRatio: (sizeRatio) =>
        setSizeFactor(sizeRatio * parentViewWidth),
    };
  }, [parentViewWidth]);

  const cardWidth = fullWidth
    ? parentViewWidth
    : Math.min(
        parentViewWidth,
        Math.max(
          sizeFactor,
          sizeFactor * 0.35 * numberOfItems + sizeFactor * 0.5
        )
      );

  const leftPos = (() => {
    switch (position) {
      case undefined:
      case "right":
        return parentViewWidth - cardWidth;
      case "left":
        return 0;
      case "center-right":
        return Math.min(parentViewWidth - cardWidth, 0.5 * parentViewWidth);
      case "center-left":
        return Math.max(0, 0.5 * parentViewWidth - cardWidth);
      case "center":
        return 0.5 * (parentViewWidth - cardWidth);
      default:
        assertNever(position, `Unknown card position: ${position}`);
    }
  })();

  const pressed = useSharedValue(false);
  const offset = useSharedValue(0);
  const initialTouchLocation = useSharedValue<{ x: number; y: number } | null>(
    null
  );
  const panActive = useSharedValue(false);
  panActive.value = !!onRemove;

  // https://github.com/software-mansion/react-native-gesture-handler/issues/1933#issuecomment-1566953466
  const pan = Gesture.Pan()
    .manualActivation(true)
    .onBegin((ev) => {
      initialTouchLocation.value = { x: ev.x, y: ev.y };
    })
    .onTouchesMove((ev, state) => {
      // Sanity checks
      if (!initialTouchLocation.value || !ev.changedTouches.length) {
        state.fail();
      } else {
        const touch = ev.changedTouches[0];
        const xDiff = Math.abs(touch.x - initialTouchLocation.value.x);
        const yDiff = Math.abs(touch.y - initialTouchLocation.value.y);
        // Check if the gesture is horizontal or if it's already activated
        // as we don't want to interrupt an ongoing swipe
        if (pressed.value || xDiff > yDiff) {
          // Horizontal panning
          state.activate();
        } else {
          state.fail();
        }
      }
    })
    .onStart(() => (pressed.value = true))
    .onChange((ev) => panActive.value && (offset.value = ev.translationX))
    .onEnd(() => {
      pressed.value = false;
      if (panActive.value) {
        const pos = leftPos + offset.value;
        if (
          offset.value < 0
            ? pos + cardWidth > 0.2 * parentViewWidth
            : pos < 0.8 * parentViewWidth
        ) {
          offset.value = withSpring(0);
        } else {
          const dest = Math.sign(offset.value) * parentViewWidth;
          offset.value = withTiming(dest, { duration: 200 });
          if (onRemove) {
            runOnJS(onRemove)();
          }
        }
      }
    });

  // Run this effect after a change
  // React.useEffect(() => {
  //   const lastViewWidth = parentViewWidth;
  //   return () => {
  //     if (panActive.value && lastViewWidth) {
  //       const startPositionLeft =
  //         parentViewWidth / 2 - Math.min(parentViewWidth / 2, cardWidth);
  //       const startPositionRight =
  //         parentViewWidth / 2 - Math.max(-parentViewWidth / 2 + cardWidth, 0);
  //       if (position === "right") {
  //         offset.value = startPositionRight - startPositionLeft;
  //         offset.value = withTiming(0, { duration: 300 });
  //       } else {
  //         offset.value = startPositionLeft - startPositionRight;
  //         offset.value = withTiming(0, { duration: 300 });
  //       }
  //     }
  //   };
  // }, [offset, panActive, position, parentViewWidth, cardWidth]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={
          withEnteringAnim
            ? SlideInDown.springify().mass(1).damping(20).stiffness(200)
            : undefined
        }
        // layout={CurvedTransition.easingY(Easing.linear).duration(300)}
        style={[AppStyles.fullWidth, animStyle]}
        // onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
      >
        {card?.({
          sizeFactor,
          cardWidth,
          style: { alignSelf: "flex-start", left: leftPos },
        })}
      </Animated.View>
    </GestureDetector>
  );
});

function UseFormulaButton({
  scrollViewRef,
  scrollViewContentHeight,
}: {
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  scrollViewContentHeight: SharedValue<number>;
}) {
  const store = useAppStore();
  const activeEntryUuid = useAppSelector(
    (state) => state.diceRoller.settings.activeEntryUuid
  );
  const reducedMotion = useReducedMotion();
  const formulaCardHeightsRef = React.useRef({
    full: 0,
    card: 0,
    header: 0,
  });
  const formulaCardHeight = useSharedValue(0);
  const derivedFormulaCardHeight = useDerivedValue(() =>
    withTiming(formulaCardHeight.value, { duration: reducedMotion ? 0 : 200 })
  );
  const formulaCardAnimStyle = useAnimatedStyle(() => ({
    height: derivedFormulaCardHeight.value,
  }));
  useDerivedValue(() => {
    const y =
      scrollViewContentHeight.value -
      // Force dependency on the animated height value to smoothly scroll to the bottom
      1e-100 * derivedFormulaCardHeight.value;
    // scrollTo(scrollViewRef, 0, y, false);
  });

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    // <Animated.View
    //   style={[{ width: "100%", overflow: "hidden" }, formulaCardAnimStyle]}
    // >
    //   {!disabled && (
    //     <Animated.View
    //       entering={FadeIn.duration(500)}
    //       exiting={FadeOut.duration(500)}
    //       style={{
    //         position: "absolute",
    //         left: 5,
    //         right: 5,
    //       }}
    //     >
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[colors.primary, colors.tertiary]}
      style={{
        width: "100%",
        borderColor: colors.outline,
        borderRadius,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: "hidden",
      }}
    >
      <TouchableRipple
        disabled={!!activeEntryUuid}
        onPress={() => {
          // formulaCardHeight.value = 0;
          const { diceRoller } = store.getState();
          const lastFormulaEntry =
            diceRoller.formulaRolls.entities[
              diceRoller.formulaRolls.ids.at(-1) ?? ""
            ];
          const uuid = generateRollEntryUuid(diceRoller);
          store.dispatch(
            addFormulaRollEntry({
              formula: lastFormulaEntry?.formula ?? {
                kind: "dice",
                dieType: "d20",
                dieCount: 1,
              },
              uuid,
              timestamp: Date.now(),
              rolls: [],
            })
          );
        }}
        onLayout={({ nativeEvent: { layout } }) => {
          // Show top of formula card with a delay
          const height = layout.y + layout.height;
          if (formulaCardHeightsRef.current.header !== height) {
            formulaCardHeightsRef.current.header = height;
            setTimeout(() => {
              formulaCardHeight.value = height;
              // Scroll to bottom if reduced motion is enabled
              reducedMotion &&
                setTimeout(
                  () =>
                    scrollViewRef.current?.scrollToEnd({
                      animated: false,
                    }),
                  10
                );
            }, 1200);
          }
        }}
      >
        <Text variant="titleMedium" style={{ margin: 10, alignSelf: "center" }}>
          Use Formula
        </Text>
      </TouchableRipple>
    </LinearGradient>
    //     </Animated.View>
    //   )}
    // </Animated.View>
  );
}

function useScrollToEndOnNewItem(
  scrollViewRef: AnimatedRef<Animated.ScrollView>
) {
  const appDispatch = useAppDispatch();
  const scrollToEnd = React.useCallback(() => {
    // Slightly delay the scroll to make sure the new item is rendered on iOS
    return setTimeout(() => scrollViewRef.current?.scrollToEnd(), 0);
  }, [scrollViewRef]);
  // Scroll to bottom on init
  React.useEffect(() => {
    if (scrollViewRef.current) {
      const id = scrollToEnd();
      return () => clearTimeout(id);
    }
  }, [scrollViewRef, scrollToEnd]);
  // Scroll to bottom on new roll that isn't added to a formula
  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = appDispatch(
      addListener({
        actionCreator: addRollEntry,
        effect: (action, listenerApi) => {
          const state = listenerApi.getState() as RootState;
          if (action.payload.uuid === state.diceRoller.singleRolls.ids.at(-1)) {
            timeoutId = scrollToEnd();
          }
        },
      })
    ) as unknown as UnsubscribeListener;
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [appDispatch, scrollToEnd, scrollViewRef]);
  // Scroll to bottom on new formula
  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = appDispatch(
      addListener({
        actionCreator: addFormulaRollEntry,
        effect: () => {
          timeoutId = scrollToEnd();
        },
      })
    ) as unknown as UnsubscribeListener;
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [appDispatch, scrollToEnd, scrollViewRef]);
}

function GenericRollerEntryCard({
  ref,
  uuid,
  roll,
  formula,
  isNew,
  sizeRatio,
  parentViewWidth,
  position,
  onRemove,
}: {
  ref: React.RefObject<AnimatedRollCardHandle>;
  uuid: string;
  roll?: SingleRollEntry;
  formula?: FormulaRollEntry;
  isNew: boolean;
  sizeRatio: number;
  parentViewWidth: number;
  position?: "left" | "right" | "center" | "center-left" | "center-right";
  onRemove?: () => void;
}) {
  const appDispatch = useAppDispatch();
  // TODO improve perf of counting items, make it general
  const simpleFormula = formula
    ? getSimplifiedRollFormula(formula.formula)
    : undefined;
  const numberOfItems =
    (simpleFormula?.dieCount ?? 1) +
    (simpleFormula?.constant ? 1 : 0) +
    (simpleFormula?.bonus ? 1 : 0);
  const selected = useAppSelector(
    (state) => state.diceRoller.settings.activeEntryUuid === uuid
  );
  return (
    <AnimatedTouchableCard
      ref={ref}
      sizeRatio={sizeRatio}
      numberOfItems={numberOfItems}
      fullWidth={selected}
      parentViewWidth={parentViewWidth}
      position={position}
      withEnteringAnim={isNew}
      // withSlideIn={timestamp > startTimestampRef.current} // New cards only
      onRemove={selected ? undefined : onRemove}
      card={({ sizeFactor, cardWidth, style }) =>
        roll ? (
          <RollTouchableCard
            result={roll.value.toString()}
            expectedRolls={[{ dieType: roll.dieType, count: 1 }]}
            sizeFactor={sizeFactor}
            cardWidth={cardWidth}
            withEnteringAnim={isNew}
            style={style}
            onLongPress={onRemove}
          />
        ) : formula ? (
          <FormulaTouchableCard
            formulaEntry={formula}
            showEditor={selected}
            sizeFactor={sizeFactor}
            cardWidth={cardWidth}
            withEnteringAnim={isNew}
            style={style}
            onPress={() =>
              appDispatch(setRollerActiveEntryUuid(selected ? undefined : uuid))
            }
          />
        ) : null
      }
    />
  );
}

function getSortedRollsIds(
  singleRolls: SingleRollsState,
  formulaRolls: FormulaRollsState
) {
  const ids = [
    ...singleRolls.ids.map((id) => ({
      id,
      t: singleRolls.entities[id]?.timestamp,
    })),
    ...formulaRolls.ids.map((id) => ({
      id,
      t: formulaRolls.entities[id]?.timestamp,
    })),
  ];
  ids.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
  return ids.map(({ id }) => id);
}

type ItemsMap = Map<
  SingleRollsState["ids"][number] | FormulaRollsState["ids"][number],
  React.RefObject<AnimatedRollCardHandle>
>;

function RollerPage({
  navigation,
}: {
  navigation: DiceRollerScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();

  const sizeRatio = useAppSelector(
    (state) => state.diceRoller.settings.cardsSizeRatio
  );
  const alignment = useAppSelector(
    (state) => state.diceRoller.settings.cardsAlignment
  );
  const singleRolls = useAppSelector((state) => state.diceRoller.singleRolls);
  const formulaRolls = useAppSelector((state) => state.diceRoller.formulaRolls);
  const sortedRollsIds = React.useMemo(
    () => getSortedRollsIds(singleRolls, formulaRolls),
    [singleRolls, formulaRolls]
  );
  const refs = React.useRef<ItemsMap>(new Map());
  React.useEffect(() => {
    // Clear old refs
    for (const uuid of refs.current.keys()) {
      if (!singleRolls.ids.includes(uuid) && !formulaRolls.ids.includes(uuid)) {
        refs.current.delete(uuid);
      }
    }
  }, [singleRolls, formulaRolls]);
  const startTimestampRef = React.useRef(Date.now());

  const scrollViewContentHeight = useSharedValue(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  // Scroll to bottom when a new item is added
  useScrollToEndOnNewItem(scrollViewRef);

  const [menuVisible, setMenuVisible] = React.useState(false);
  const bottomPadding = useSharedValue(0);
  const animatedPadding = useAnimatedStyle(() => ({
    height: bottomPadding.value,
  }));

  const { width: screenWidth } = useWindowDimensions();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        onGoBack={() => navigation.goBack()}
        rightElement={() => (
          <OptionsMenu
            visible={menuVisible}
            onLiveChangeSizeRatio={(r) => {
              for (const ref of refs.current.values()) {
                ref.current?.overrideSizeRatio(r);
              }
            }}
            contentStyle={{ width: 220 }}
            onShowMenu={() => setMenuVisible(true)}
            onDismiss={() => setMenuVisible(false)}
          />
        )}
      >
        Roller
      </PageHeader>
      <Animated.ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{
          width: "100%",
          gap: 10,
          overflow: "visible",
        }}
        onContentSizeChange={(_, h) => (scrollViewContentHeight.value = h)}
      >
        {!singleRolls.ids.length && (
          <RotatingGradientBorderCard
            style={{
              width: "80%",
              marginTop: 20,
              alignSelf: "center",
            }}
            contentStyle={{
              paddingVertical: 40,
              paddingHorizontal: 20,
              gap: 40,
            }}
          >
            <Text variant="titleLarge">The Dice Roller</Text>
            <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
              Show all rolls.
            </Text>
            <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
              Compose formulas.
            </Text>
          </RotatingGradientBorderCard>
        )}
        {sortedRollsIds.map((id, i) => {
          let ref = refs.current.get(id);
          if (!ref) {
            ref = React.createRef();
            refs.current.set(id, ref);
          }
          const roll = singleRolls.entities[id];
          const formula = formulaRolls.entities[id];
          const position =
            alignment === "alternate"
              ? i % 2
                ? "center-right"
                : "center-left"
              : alignment;
          const onRemove = () => {
            appDispatch(removeRollerEntry(id as string));
            bottomPadding.value = sizeRatio * screenWidth;
            bottomPadding.value = withTiming(0, {
              duration: 300,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          };
          return (
            <GenericRollerEntryCard
              key={id}
              ref={ref}
              uuid={id as string}
              roll={roll}
              formula={formula}
              isNew={
                (roll?.timestamp ?? formula?.timestamp ?? 0) >
                startTimestampRef.current
              }
              sizeRatio={sizeRatio}
              parentViewWidth={screenWidth}
              position={position}
              onRemove={onRemove}
            />
          );
        })}
        {/* Padding to have a smooth scroll when removing a roll entry */}
        <Animated.View style={animatedPadding} />
      </Animated.ScrollView>
      {/* Bottom button */}
      <UseFormulaButton
        scrollViewRef={scrollViewRef}
        scrollViewContentHeight={scrollViewContentHeight}
      />
    </View>
  );
}

export function DiceRollerScreen({ navigation }: DiceRollerScreenProps) {
  return (
    <AppBackground>
      <RollerPage navigation={navigation} />
    </AppBackground>
  );
}

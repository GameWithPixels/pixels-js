import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { addListener, UnsubscribeListener } from "@reduxjs/toolkit";
import { range } from "@systemic-games/pixels-core-utils";
import {
  DiceUtils,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View, ViewProps, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Divider,
  Menu,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import Animated, {
  AnimatedRef,
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  scrollTo,
  SharedValue,
  SlideInDown,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { DiceRollerScreenProps } from "~/app/navigation";
import { RootState } from "~/app/store";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { Card, CardProps } from "~/components/Card";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import {
  HeaderMenuButton,
  HeaderMenuButtonProps,
} from "~/components/HeaderMenuButton";
import { PageHeader } from "~/components/PageHeader";
import { RollFormulaEditor } from "~/components/RollFormulaEditor";
import { SliderWithValue } from "~/components/SliderWithValue";
import { DieWireframe } from "~/components/icons";
import { AvailableDieTypeValues } from "~/features/dice";
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
  removeAllRollerEntries,
  removeRollerEntry,
  setRollerActiveEntryUuid,
  setRollerCardsAlignment,
  setRollerCardsSizeRatio,
  setRollerPaused,
  SingleRollEntry,
  SingleRollsState,
  updateFormulaRollEntry,
} from "~/features/store";
import { useConfirmActionSheet } from "~/hooks";

interface AnimatedRollCardHandle {
  overrideWidth: (w: number) => void;
}

function RollTouchableCard({
  children,
  title,
  expectedRolls,
  rolls,
  endText,
  result = "?",
  width,
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
  width: number;
  onPress?: () => void;
  onLongPress?: () => void;
} & CardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(
    screenWidth - 10,
    Math.max(
      width,
      width *
        0.35 *
        (expectedRolls.reduce((total, r) => total + r.count, 0) +
          (endText ? 1 : 0)) +
        width * 0.5
    )
  );
  const remainingRolls = rolls ? [...rolls] : [];
  const { colors } = useTheme();
  return (
    <Card
      frameless
      noBorder
      vivid
      style={[
        {
          marginVertical: width * 0.05,
          width: cardWidth,
        },
        style,
      ]}
      contentStyle={[
        {
          margin: width * 0.03,
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
                height: 2 * width * 0.3,
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
                              size={width * 0.3}
                            />
                            {value !== undefined && (
                              <View
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Text
                                  style={{
                                    fontFamily: "LTInternet-Bold",
                                    fontSize: width * 0.2,
                                    lineHeight: width * 0.25,
                                    color: colors.secondary,
                                    backgroundColor: colors.background,
                                    borderRadius: width * 0.1,
                                  }}
                                >
                                  {value}
                                </Text>
                              </View>
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
                  style={{
                    fontFamily: "LTInternet-Bold",
                    textAlign: "center",
                    fontSize: width * 0.25,
                    lineHeight: width * 0.3,
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
                width: 0.5 * width,
                fontFamily: "LTInternet-Bold",
                textAlign: "center",
                fontSize: width * 0.45,
                lineHeight: width * 0.5,
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

const AnimatedRollCard = React.forwardRef(function AnimatedRollCard(
  {
    rollEntry,
    width: widthProp,
    position,
    withSlideIn,
    onRemove,
  }: {
    rollEntry: Readonly<SingleRollEntry>;
    width: number;
    position?: "left" | "right" | "center";
    withSlideIn?: boolean;
    onRemove?: () => void;
  },
  ref: React.ForwardedRef<AnimatedRollCardHandle>
) {
  const [width, setWidth] = React.useState(widthProp);
  React.useImperativeHandle(ref, () => {
    return {
      overrideWidth: (w: number) => {
        setWidth(w);
      },
    };
  }, []);
  React.useEffect(() => setWidth(widthProp), [widthProp]);

  const [viewWidth, setViewWidth] = React.useState(0);
  const startPosition =
    position === "right"
      ? Math.min(viewWidth - width, (0.92 * viewWidth) / 2)
      : position === "left"
        ? Math.max(0, (1.08 * viewWidth) / 2 - width)
        : 0.5 * viewWidth;
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
        const pos = startPosition + offset.value;
        if (
          offset.value < 0
            ? pos + width > 0.2 * viewWidth
            : pos < 0.8 * viewWidth
        ) {
          offset.value = withSpring(0);
        } else {
          const dest = Math.sign(offset.value) * viewWidth;
          offset.value = withTiming(dest, { duration: 200 });
          if (onRemove) {
            runOnJS(onRemove)();
          }
        }
      }
    });
  // Run this effect after a change
  React.useEffect(() => {
    const lastViewWidth = viewWidth;
    return () => {
      if (panActive.value && lastViewWidth) {
        const startPositionLeft =
          viewWidth / 2 - Math.min(viewWidth / 2, width);
        const startPositionRight =
          viewWidth / 2 - Math.max(-viewWidth / 2 + width, 0);
        if (position === "right") {
          offset.value = startPositionRight - startPositionLeft;
          offset.value = withTiming(0, { duration: 300 });
        } else {
          offset.value = startPositionLeft - startPositionRight;
          offset.value = withTiming(0, { duration: 300 });
        }
      }
    };
  }, [offset, panActive, position, viewWidth, width]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={
          withSlideIn
            ? SlideInDown.springify().mass(1).damping(20).stiffness(200)
            : undefined
        }
        layout={CurvedTransition.easingY(Easing.linear).duration(300)}
        style={[AppStyles.fullWidth, animStyle]}
        onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
      >
        <RollTouchableCard
          result={rollEntry.value.toString()}
          expectedRolls={[{ dieType: rollEntry.dieType, count: 1 }]}
          width={width}
          style={{ alignSelf: "flex-start", left: startPosition }}
          onLongPress={onRemove}
        />
      </Animated.View>
    </GestureDetector>
  );
});

function FormulaTouchableCard({
  formulaEntry,
  showEditor,
  width,
  onPress,
  onLongPress,
  ...props
}: {
  formulaEntry: Readonly<FormulaRollEntry>;
  showEditor?: boolean;
  width: number;
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
      width={width}
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

const AnimatedFormulaCard = React.forwardRef(function AnimatedFormulaCard(
  {
    formulaEntry,
    width: widthProp,
    position,
    withSlideIn,
    showEditor,
    contentStyle,
    onSelected,
    onRemove,
  }: {
    formulaEntry: Readonly<FormulaRollEntry>;
    width: number;
    position?: "left" | "right" | "center";
    withSlideIn?: boolean;
    showEditor?: boolean;
    contentStyle?: ViewProps["style"];
    onSelected?: () => void;
    onRemove?: () => void;
  },
  ref: React.ForwardedRef<AnimatedRollCardHandle>
) {
  const [width, setWidth] = React.useState(widthProp);
  React.useImperativeHandle(ref, () => {
    return {
      overrideWidth: (w: number) => {
        setWidth(w);
      },
    };
  }, []);
  React.useEffect(() => setWidth(widthProp), [widthProp]);

  const [viewWidth, setViewWidth] = React.useState(0);
  const startPosition =
    position === "right"
      ? Math.min(viewWidth - width, (0.92 * viewWidth) / 2)
      : position === "left"
        ? Math.max(0, (1.08 * viewWidth) / 2 - width)
        : 0.5 * viewWidth;
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
        const pos = startPosition + offset.value;
        if (
          offset.value < 0
            ? pos + width > 0.2 * viewWidth
            : pos < 0.8 * viewWidth
        ) {
          offset.value = withSpring(0);
        } else {
          const dest = Math.sign(offset.value) * viewWidth;
          offset.value = withTiming(dest, { duration: 200 });
          if (onRemove) {
            runOnJS(onRemove)();
          }
        }
      }
    });
  // Run this effect after a change
  React.useEffect(() => {
    const lastViewWidth = viewWidth;
    return () => {
      if (panActive.value && lastViewWidth) {
        const startPositionLeft =
          viewWidth / 2 - Math.min(viewWidth / 2, width);
        const startPositionRight =
          viewWidth / 2 - Math.max(-viewWidth / 2 + width, 0);
        if (position === "right") {
          offset.value = startPositionRight - startPositionLeft;
          offset.value = withTiming(0, { duration: 300 });
        } else {
          offset.value = startPositionLeft - startPositionRight;
          offset.value = withTiming(0, { duration: 300 });
        }
      }
    };
  }, [offset, panActive, position, viewWidth, width]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={
          withSlideIn
            ? SlideInDown.springify().mass(1).damping(20).stiffness(200)
            : undefined
        }
        layout={CurvedTransition.easingY(Easing.linear).duration(300)}
        style={[AppStyles.fullWidth, animStyle]}
        onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
      >
        <FormulaTouchableCard
          formulaEntry={formulaEntry}
          showEditor={showEditor}
          width={width}
          style={[
            { alignSelf: "flex-start", left: startPosition },
            contentStyle,
          ]}
          onPress={onSelected}
          onLongPress={onRemove}
        />
      </Animated.View>
    </GestureDetector>
  );
});

function VirtualDiceLine({
  diceTypes,
  addRoll,
}: {
  diceTypes: PixelDieType[];
  addRoll: (dieType: PixelDieType, value: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        margin: 5,
        marginLeft: 10,
        alignSelf: "center",
      }}
    >
      {diceTypes.map((dieType) => (
        <TouchableRipple
          key={dieType}
          onPress={() => {
            const faces = DiceUtils.getDieFaces(dieType);
            addRoll(dieType, faces[Math.floor(Math.random() * faces.length)]);
          }}
        >
          <DieWireframe dieType={dieType} size={40} />
        </TouchableRipple>
      ))}
    </View>
  );
}

function OptionsMenu({
  onLiveChangeSizeRatio,
  ...props
}: {
  onLiveChangeSizeRatio: (ratio: number) => void;
} & Omit<HeaderMenuButtonProps, "children">) {
  const store = useAppStore();
  const delayedDismiss = () =>
    setTimeout(() => {
      props.onDismiss?.();
    }, 200);
  const confirmClearAll = useConfirmActionSheet("Clear All Rolls", () => {
    store.dispatch(removeAllRollerEntries());
  });
  const {
    paused,
    cardsSizeRatio: sizeRatio,
    cardsAlignment: alignment,
  } = useAppSelector((state) => state.diceRoller.settings);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const selectedStyle = {
    padding: 5,
    borderRadius,
    borderColor: colors.primary,
    borderWidth: 1,
  } as const;
  const unselectedStyle = {
    ...selectedStyle,
    borderColor: colors.background,
  } as const;
  return (
    <HeaderMenuButton {...props}>
      <Text variant="bodyLarge" style={{ marginHorizontal: 15 }}>
        Display Size
      </Text>
      <SliderWithValue
        percentage
        value={sizeRatio}
        onValueChange={onLiveChangeSizeRatio}
        onEndEditing={(v) => store.dispatch(setRollerCardsSizeRatio(v))}
        minimumValue={0.3}
        maximumValue={1}
        style={{ marginHorizontal: 10, marginBottom: 10 }}
      />
      <Divider />
      <Menu.Item
        title={paused ? "Paused" : "Running"}
        trailingIcon={() =>
          paused ? (
            <MaterialCommunityIcons
              name="play-outline"
              size={24}
              color={colors.onSurface}
            />
          ) : (
            <MaterialIcons name="pause" size={24} color={colors.onSurface} />
          )
        }
        contentStyle={AppStyles.menuItemWithIcon}
        style={{ zIndex: 1 }}
        onPress={() => {
          store.dispatch(setRollerPaused(!paused));
          delayedDismiss();
        }}
      />
      <Divider />
      <Menu.Item
        title="Clear All"
        trailingIcon={() => (
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={24}
            color={colors.onSurface}
          />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        style={{ zIndex: 1 }}
        onPress={() => {
          confirmClearAll();
          delayedDismiss();
        }}
      />
      <Divider />
      <Text variant="bodyLarge" style={{ marginHorizontal: 15, marginTop: 10 }}>
        Alignment
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          marginTop: 5,
          marginBottom: 10,
        }}
      >
        <MaterialCommunityIcons
          name="align-horizontal-left"
          size={24}
          color={colors.onSurface}
          style={alignment === "left" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("left"));
            delayedDismiss();
          }}
        />
        <MaterialCommunityIcons
          name="align-horizontal-center"
          size={24}
          color={colors.onSurface}
          style={alignment === "center" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("center"));
            delayedDismiss();
          }}
        />
        <MaterialCommunityIcons
          name="align-horizontal-right"
          size={24}
          color={colors.onSurface}
          style={alignment === "right" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("right"));
            delayedDismiss();
          }}
        />
        <MaterialCommunityIcons
          name="align-horizontal-distribute"
          size={24}
          color={colors.onSurface}
          style={alignment === "alternate" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("alternate"));
            delayedDismiss();
          }}
        />
      </View>
      <Divider />
      <Text variant="bodyLarge" style={{ marginHorizontal: 15, marginTop: 10 }}>
        Virtual Roll
      </Text>
      {[0, 1].map((i) => (
        <VirtualDiceLine
          key={i}
          diceTypes={AvailableDieTypeValues.slice(
            Math.ceil((i * AvailableDieTypeValues.length) / 2),
            Math.ceil(((i + 1) * AvailableDieTypeValues.length) / 2)
          )}
          addRoll={(dieType, value) => {
            store.dispatch(
              addRollEntry({
                uuid: generateRollEntryUuid(store.getState().diceRoller),
                timestamp: Date.now(),
                pixelId: 0,
                dieType,
                value,
              })
            );
            delayedDismiss();
          }}
        />
      ))}
    </HeaderMenuButton>
  );
}

function UseFormulaButton({
  disabled,
  scrollViewRef,
  scrollViewContentHeight,
  onUseFormula,
}: {
  disabled?: boolean;
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  scrollViewContentHeight: SharedValue<number>;
  onUseFormula: (uuid: string) => void;
}) {
  const store = useAppStore();
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
          onUseFormula(uuid);
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

  const {
    cardsSizeRatio: sizeRatio,
    cardsAlignment: alignment,
    activeEntryUuid,
  } = useAppSelector((state) => state.diceRoller.settings);
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
                ref.current?.overrideWidth(r * screenWidth);
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
        <View
          style={{
            width: "100%",
            paddingHorizontal: 5,
            overflow: "visible",
          }}
        >
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
                  ? "right"
                  : "left"
                : alignment;
            return roll ? (
              <AnimatedRollCard
                key={id}
                ref={ref}
                rollEntry={roll}
                width={sizeRatio * screenWidth}
                position={position}
                withSlideIn={roll.timestamp > startTimestampRef.current} // New cards only
                onRemove={() => {
                  appDispatch(removeRollerEntry(roll.uuid));
                  bottomPadding.value = sizeRatio * screenWidth;
                  bottomPadding.value = withTiming(0, {
                    duration: 300,
                  });
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                }}
              />
            ) : (
              formula && (
                <AnimatedFormulaCard
                  key={id}
                  formulaEntry={formula}
                  width={sizeRatio * screenWidth}
                  position={activeEntryUuid === id ? "left" : position}
                  withSlideIn={formula.timestamp > startTimestampRef.current} // New cards only
                  showEditor={activeEntryUuid === id}
                  contentStyle={
                    activeEntryUuid === id ? { width: "100%" } : undefined
                  }
                  onSelected={() =>
                    appDispatch(
                      setRollerActiveEntryUuid(
                        activeEntryUuid === id ? undefined : (id as string)
                      )
                    )
                  }
                  onRemove={() => {
                    appDispatch(removeRollerEntry(formula.uuid));
                    bottomPadding.value = sizeRatio * screenWidth;
                    bottomPadding.value = withTiming(0, {
                      duration: 300,
                    });
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  }}
                />
              )
            );
          })}
        </View>
        {/* Padding to have a smooth scroll when removing a roll entry */}
        <Animated.View style={animatedPadding} />
      </Animated.ScrollView>
      {/* Bottom button */}
      <UseFormulaButton
        disabled={!!activeEntryUuid}
        scrollViewRef={scrollViewRef}
        scrollViewContentHeight={scrollViewContentHeight}
        onUseFormula={(uuid) => appDispatch(setRollerActiveEntryUuid(uuid))}
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

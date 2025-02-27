import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UnsubscribeListener } from "@reduxjs/toolkit";
import { assertNever, range } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  LayoutRectangle,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextProps,
  View,
  ViewProps,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Divider, Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  AnimatedProps,
  AnimatedRef,
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  runOnJS,
  SlideInDown,
  SlideInRight,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OptionsMenu } from "./components/RollerOptionsMenu";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { DiceRollerScreenProps } from "~/app/navigation";
import { addAppListener } from "~/app/store";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { AnimatedCard, CardProps } from "~/components/Card";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import { PageHeader } from "~/components/PageHeader";
import { RollFormulaEditor } from "~/components/RollFormulaEditor";
import { BottomSheetModalCloseButton } from "~/components/buttons";
import { AnimatedDieWireframe } from "~/components/icons";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  computeRollFormulaResult,
  getSimplifiedRollFormula,
  parseRollFormula,
  rollFormulaToString,
} from "~/features/rollFormula";
import {
  addRollToRoller,
  commitRollerActiveFormula,
  RollerEntry,
  removeRollerEntry,
  updateRollerActiveFormula,
  activateRollerFormula,
  RollerEntryWithFormula,
} from "~/features/store";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function useIsMounted() {
  const isMountedRef = React.useRef(false);
  React.useEffect(() => {
    isMountedRef.current = true;
  }, []);
  return isMountedRef.current;
}

function useNewArrayItems<Type>(
  items: readonly Readonly<Type>[] | undefined
): Type[] {
  const lastItems = React.useRef(items ?? []);
  const newItems = React.useMemo(
    () =>
      !items || lastItems.current === items
        ? []
        : items.filter((r) => !lastItems.current.includes(r)),
    [items]
  );
  lastItems.current = items ?? [];
  return newItems;
}

function CustomText({
  lineHeight,
  style,
  ...props
}: { lineHeight: number } & TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      style={[
        {
          fontFamily: "LTInternet-Bold",
          textAlign: "center",
          fontSize: lineHeight * 0.85,
          lineHeight,
          color: colors.onSurface,
        },
        style,
      ]}
      {...props}
    />
  );
}

function AnimatedCustomText({
  lineHeight,
  style,
  ...props
}: AnimatedProps<{ lineHeight: number } & TextProps>) {
  const fontSize = useDerivedValue(
    () =>
      (typeof lineHeight === "number" ? lineHeight : lineHeight.value) * 0.85
  );
  const { colors } = useTheme();
  return (
    <Animated.Text
      style={[
        {
          fontFamily: "LTInternet-Bold",
          textAlign: "center",
          fontSize,
          lineHeight,
          color: colors.onSurface,
        },
        style,
      ]}
      {...props}
    />
  );
}

function AnimatedRolledDie({
  dieType,
  value,
  size,
  textStyle,
  ...props
}: {
  dieType: PixelDieType;
  value?: number;
} & AnimatedProps<
  {
    size: number;
    textStyle?: TextProps["style"];
  } & ViewProps
>) {
  const lineHeight = useDerivedValue(
    () => (typeof size === "number" ? size : size.value) * 0.8
  );
  const { colors } = useTheme();
  return (
    <Animated.View {...props}>
      <AnimatedDieWireframe
        dieType={dieType}
        size={size}
        disabled={value !== undefined}
        entering={FadeIn}
      />
      {value !== undefined && (
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedCustomText
            numberOfLines={1}
            adjustsFontSizeToFit
            lineHeight={lineHeight}
            style={[
              {
                width: lineHeight,
                color: colors.onSurface,
                borderRadius: size,
              },
              textStyle,
            ]}
          >
            {value}
          </AnimatedCustomText>
        </Animated.View>
      )}
    </Animated.View>
  );
}

type RollCardCommonProps = CardProps & {
  sizeFactor: number;
  cardWidth: number;
  leftPos: number;
  onPress?: () => void;
  onDismiss?: () => void;
  onWidthAnimationEnd?: (w: number) => void;
  onHeightAnimationEnd?: (h: number) => void;
  onFinalSize?: (layout: { width: number; height: number }) => void;
};

function RollTouchableCard({
  children,
  title,
  expectedRolls,
  rolls,
  endText,
  result = "?",
  sizeFactor,
  cardWidth,
  leftPos,
  style,
  onPress,
  onDismiss,
  onWidthAnimationEnd,
  onHeightAnimationEnd,
  onFinalSize,
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
} & RollCardCommonProps) {
  const animWidth = useSharedValue(cardWidth);
  React.useEffect(() => {
    animWidth.value = withTiming(cardWidth, undefined, () => {
      onWidthAnimationEnd && runOnJS(onWidthAnimationEnd)(cardWidth);
    });
  }, [animWidth, cardWidth, onWidthAnimationEnd]);
  const animLeftPos = useSharedValue(leftPos);
  React.useEffect(() => {
    animLeftPos.value = withTiming(leftPos);
  }, [animLeftPos, leftPos]);
  const animStyle = useAnimatedStyle(() => ({
    width: animWidth.value,
    left: animLeftPos.value,
  }));

  const borderSize = sizeFactor * 0.02;
  const titleSize = 0.1 * sizeFactor;
  const diceHeight = 1.5 * sizeFactor * 0.3;
  const touchHeight = diceHeight + titleSize;
  const animHeight = useSharedValue(touchHeight);
  const animContentStyle = useAnimatedStyle(() => ({
    height: animHeight.value,
  }));
  React.useEffect(() => {
    animHeight.value = withTiming(touchHeight, undefined, () => {
      onHeightAnimationEnd && runOnJS(onHeightAnimationEnd)(touchHeight);
    });
  }, [animHeight, onHeightAnimationEnd, touchHeight]);
  const maxHeightRef = React.useRef(0);

  const remainingRolls = rolls ? [...rolls] : [];
  const newRolls = useNewArrayItems(rolls);
  const isMounted = useIsMounted();

  const { colors } = useTheme();
  return (
    <AnimatedCard
      frameless
      noBorder
      vivid
      style={[animStyle, style]}
      contentStyle={[
        {
          margin: borderSize,
          padding: 0,
          backgroundColor: colors.background,
          overflow: "hidden",
        },
        animContentStyle,
      ]}
      {...props}
    >
      <TouchableRipple
        onPress={onPress}
        style={{
          flexDirection: "row",
          width: "100%",
          height: touchHeight,
          alignItems: "center",
        }}
      >
        <>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            {title && <CustomText lineHeight={titleSize}>{title}</CustomText>}
            <View
              style={{
                flexDirection: "row",
                height: diceHeight,
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
                        const isNew = newRolls?.includes(remainingRolls[index]);
                        if (index >= 0) {
                          remainingRolls.splice(index, 1);
                        }
                        return (
                          <LayoutAnimationConfig
                            key={`${i}-${j}-${k}-${dice.dieType}-${value}`}
                            skipEntering={!isMounted || !isNew}
                          >
                            <AnimatedRolledDie
                              entering={SlideInDown.duration(300)}
                              exiting={FadeOut.duration(100)}
                              dieType={dice.dieType}
                              value={value}
                              size={sizeFactor * 0.3}
                              style={{ marginTop: !k ? 0 : -sizeFactor * 0.15 }}
                            />
                          </LayoutAnimationConfig>
                        );
                      })}
                    </View>
                  ))}
                </View>
              ))}
              {endText && (
                <AnimatedCustomText
                  entering={FadeIn.duration(300)}
                  // layout={CurvedTransition.easingY(Easing.linear).duration(200)}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  lineHeight={0.3 * sizeFactor}
                >
                  {endText}
                </AnimatedCustomText>
              )}
            </View>
          </View>
          <Divider
            style={{
              height: "90%",
              width: 1,
              backgroundColor: colors.onPrimary,
            }}
          />
          <CustomText
            numberOfLines={1}
            adjustsFontSizeToFit
            lineHeight={sizeFactor * 0.3}
            style={{
              width: 0.4 * sizeFactor,
              marginTop: title ? titleSize : 0,
            }}
          >
            {result}
          </CustomText>
        </>
      </TouchableRipple>
      {children && (
        <View
          style={{
            position: "absolute",
            width: cardWidth - borderSize * 2,
            left: 0,
            top: touchHeight,
          }}
          onLayout={(e) => {
            if (children) {
              // For some reason the animation of the card width creates some vibration in the layout
              const h = touchHeight + e.nativeEvent.layout.height;
              if (h > maxHeightRef.current) {
                maxHeightRef.current = h + 1;
                animHeight.value = withTiming(h);
                onFinalSize?.({ width: cardWidth, height: h + borderSize * 2 });
              }
            }
          }}
        >
          {children}
        </View>
      )}
      {onDismiss && (
        <BottomSheetModalCloseButton
          onPress={onDismiss}
          style={{ top: -10, right: -10 }}
        />
      )}
    </AnimatedCard>
  );
}

function FormulaTouchableCard({
  formulaEntry,
  onRollFormulaChange,
  ...props
}: {
  formulaEntry: Readonly<
    Pick<RollerEntryWithFormula, "formula" | "rolls" | "result">
  >;
  onRollFormulaChange?: (formula: string) => void;
} & RollCardCommonProps) {
  const { formula, rolls, result } = formulaEntry;

  const rollFormula = React.useMemo(() => parseRollFormula(formula), [formula]);

  const simpleFormula = React.useMemo(
    () => getSimplifiedRollFormula(rollFormula),
    [rollFormula]
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

  const newRolls = useNewArrayItems(rolls);
  const unusedRolls = React.useMemo(() => {
    const unusedRolls = [...rolls];
    computeRollFormulaResult(rollFormula, unusedRolls);
    unusedRolls.reverse();
    return unusedRolls;
  }, [rollFormula, rolls]);

  const { colors } = useTheme();
  return (
    <RollTouchableCard
      title={formula}
      expectedRolls={expectedRolls}
      rolls={rolls}
      endText={endText}
      result={result?.value}
      {...props}
    >
      {onRollFormulaChange && (
        <>
          {unusedRolls.length > 0 && (
            <ScrollView
              horizontal
              style={{
                flexDirection: "row",
                width: "100%",
                marginTop: 10,
              }}
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 10,
                gap: 5,
              }}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={30}
                color={colors.onSurfaceDisabled}
              />
              {unusedRolls.map((roll, i) => (
                <AnimatedRolledDie
                  key={`${roll.pixelId}-${roll.timestamp}`}
                  dieType={roll.dieType}
                  value={roll.value}
                  entering={
                    !newRolls.includes(roll)
                      ? undefined
                      : SlideInRight.springify()
                          .mass(1)
                          .damping(20)
                          .stiffness(200)
                  }
                  layout={LinearTransition.easing(Easing.ease)}
                  size={30}
                  style={{ zIndex: i ? undefined : 1 }} // First on top so it's visible when sliding in
                />
              ))}
            </ScrollView>
          )}
          <Divider
            style={{ width: "90%", marginVertical: 10, alignSelf: "center" }}
          />
          <RollFormulaEditor
            rollFormula={rollFormula}
            onRollFormulaChange={(f) =>
              onRollFormulaChange(rollFormulaToString(f))
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
    alignment,
    onRemove,
    card,
    ...props
  }: React.PropsWithChildren<{
    sizeRatio: number;
    numberOfItems: number;
    fullWidth?: boolean;
    parentViewWidth: number;
    alignment?: "left" | "right" | "center" | "center-left" | "center-right";
    onRemove?: () => void;
    card?: (props: {
      sizeFactor: number;
      cardWidth: number;
      leftPos: number;
    }) => React.ReactNode;
  }> &
    ViewProps,
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
    switch (alignment) {
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
        assertNever(alignment, `Unknown card alignment: ${alignment}`);
    }
  })();
  const animPos = useSharedValue(leftPos);
  React.useEffect(() => {
    animPos.value = leftPos;
  }, [animPos, leftPos]);

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
          onRemove && runOnJS(onRemove)();
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
        entering={SlideInDown.springify().mass(1).damping(20).stiffness(200)}
        // layout={CurvedTransition.easingY(Easing.linear).duration(300)}
        style={[AppStyles.fullWidth, animStyle]}
        {...props}
      >
        {card?.({
          sizeFactor,
          cardWidth,
          leftPos,
        })}
      </Animated.View>
    </GestureDetector>
  );
});

const GenericRollerEntryCard = React.forwardRef(function GenericRollerEntryCard(
  {
    rollerEntry,
    sizeRatio,
    parentViewWidth,
    alignment,
    onOpen,
    onRemove,
    onLayout,
    ...props
  }: {
    rollerEntry: RollerEntry;
    sizeRatio: number;
    parentViewWidth: number;
    alignment?: "left" | "right" | "center" | "center-left" | "center-right";
    onOpen?: (cardRect: LayoutRectangle) => void;
    onRemove?: () => void;
  } & CardProps,
  ref: React.ForwardedRef<AnimatedRollCardHandle>
) {
  const formulaEntry = rollerEntry.formula
    ? (rollerEntry as RollerEntryWithFormula)
    : undefined;
  const rollEntry =
    !rollerEntry.formula && rollerEntry.rolls.length
      ? {
          ...rollerEntry.rolls[0],
        }
      : undefined;

  // TODO improve perf of counting items, make it general
  const simpleFormula = React.useMemo(
    () =>
      formulaEntry &&
      getSimplifiedRollFormula(parseRollFormula(formulaEntry.formula)),
    [formulaEntry]
  );
  const numberOfItems =
    (simpleFormula?.dieCount ?? 1) +
    (simpleFormula?.constant ? 1 : 0) +
    (simpleFormula?.bonus ? 1 : 0);

  // Card position in parent view
  const topPosRef = React.useRef<number>();
  const cardRectRef = React.useRef<LayoutRectangle>();
  const onPress = () => {
    if (onOpen && cardRectRef.current && topPosRef.current !== undefined) {
      const cardRect = { ...cardRectRef.current };
      cardRect.y += topPosRef.current;
      onOpen(cardRect);
    }
  };

  return (
    <AnimatedTouchableCard
      ref={ref}
      sizeRatio={sizeRatio}
      numberOfItems={numberOfItems}
      parentViewWidth={parentViewWidth}
      alignment={alignment}
      onRemove={onRemove}
      card={({ sizeFactor, cardWidth, leftPos }) =>
        rollEntry ? (
          <RollTouchableCard
            result={rollEntry.value.toString()}
            expectedRolls={[{ dieType: rollEntry.dieType, count: 1 }]}
            sizeFactor={sizeFactor}
            cardWidth={cardWidth}
            leftPos={leftPos}
          />
        ) : formulaEntry ? (
          <FormulaTouchableCard
            formulaEntry={formulaEntry}
            sizeFactor={sizeFactor}
            cardWidth={cardWidth}
            leftPos={leftPos}
            onPress={onPress}
            onLayout={(e) =>
              (cardRectRef.current = { ...e.nativeEvent.layout })
            }
          />
        ) : null
      }
      onLayout={(e) => {
        topPosRef.current = e.nativeEvent.layout.y;
        onLayout?.(e);
      }}
      {...props}
    />
  );
});

function OpenFormulaCardButton({
  onPress,
  style,
  ...props
}: { onPress: () => void } & ViewProps) {
  const { colors, roundness, fonts } = useTheme();
  const { bottom: marginBottom } = useSafeAreaInsets();

  const textVariant = "titleMedium";
  const padding = 7;
  const buttonHeight = fonts[textVariant].lineHeight + 2 * padding;
  const fullHeight = buttonHeight + marginBottom;
  const animTop = useSharedValue(fullHeight);
  React.useEffect(() => {
    animTop.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, [animTop]);
  const animStyle = useAnimatedStyle(() => ({ top: animTop.value }));
  const borderRadius = getBorderRadius(roundness);
  return (
    <View style={[{ height: fullHeight }, style]} {...props}>
      <AnimatedLinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.8 }}
        colors={[colors.primary, colors.tertiary]}
        style={[
          {
            position: "absolute",
            width: "100%",
            borderRadius,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            overflow: "hidden",
          },
          animStyle,
        ]}
      >
        <TouchableRipple
          style={{
            paddingVertical: padding,
            alignItems: "center",
            borderRadius,
          }}
          onPress={onPress}
        >
          <Text variant={textVariant}>Roll With Formula</Text>
        </TouchableRipple>
      </AnimatedLinearGradient>
      {/* Safe area bottom inset */}
      {marginBottom > 0 && (
        <LinearGradient
          start={{ x: 0, y: 0.2 }}
          end={{ x: 0, y: 1 }}
          colors={[colors.tertiary, colors.background]}
          style={{
            width: "100%",
            height: 0.8 * marginBottom,
            top: buttonHeight - 1,
          }}
        />
      )}
    </View>
  );
}

function OpenedFormulaCard({
  formulaEntry,
  sizeRatio,
  parentViewSize,
  startRect,
  onClose,
  ...props
}: {
  formulaEntry: RollerEntryWithFormula;
  sizeRatio: number;
  parentViewSize: { width: number; height: number };
  startRect: LayoutRectangle;
  onClose: () => void;
} & Omit<ViewProps, "style">) {
  const appDispatch = useAppDispatch();
  const [leftPos, setLeftPos] = React.useState(startRect.x);
  const [cardWidth, setCardWidth] = React.useState(startRect.width);

  React.useEffect(() => {
    setLeftPos(0);
    setCardWidth(parentViewSize.width);
  }, [parentViewSize.width]);

  const newRolls = useNewArrayItems(formulaEntry.rolls);
  const startResult = React.useRef(formulaEntry?.result);
  React.useEffect(() => {
    // Automatically close the card if the result is set on a new roll
    if (
      formulaEntry?.result &&
      startResult.current !== formulaEntry.result &&
      newRolls.length
    ) {
      setTimeout(onClose, 1500);
    }
  }, [formulaEntry, newRolls.length, onClose]);

  const { bottom: paddingBottom } = useSafeAreaInsets();
  const animTop = useSharedValue(startRect.y);
  const animStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: animTop.value - paddingBottom,
  }));

  const [showEditor, setShowEditor] = React.useState(false);
  const onChange = (formula: string) => {
    appDispatch(updateRollerActiveFormula(formula));
  };

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.backdrop,
      }}
      {...props}
    >
      {/* Hide original card */}
      <View
        style={{
          position: "absolute",
          top: startRect.y,
          left: startRect.x,
          width: startRect.width,
          height: startRect.height,
          backgroundColor: colors.background,
          borderRadius,
        }}
      />
      {/* Close by tapping outside card */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      {/* Formula card */}
      <FormulaTouchableCard
        formulaEntry={formulaEntry}
        sizeFactor={sizeRatio * parentViewSize.width}
        cardWidth={cardWidth}
        leftPos={leftPos}
        style={animStyle}
        onRollFormulaChange={showEditor ? onChange : undefined}
        onDismiss={onClose}
        onWidthAnimationEnd={(w) => {
          w === cardWidth && setShowEditor(true);
        }}
        onFinalSize={({ height }) => {
          animTop.value = withTiming(parentViewSize.height - height);
        }}
      />
    </View>
  );
}

function useAutoScrollToEnd(scrollViewRef: AnimatedRef<Animated.ScrollView>) {
  const appDispatch = useAppDispatch();
  const timeoutIdRef = React.useRef<ReturnType<typeof setTimeout>>();
  const scrollToEnd = React.useCallback(
    (opt?: { animated?: boolean }) => {
      if (Platform.OS === "ios") {
        // Slightly delay the scroll to make sure the new item is rendered on iOS
        if (!timeoutIdRef.current) {
          timeoutIdRef.current = setTimeout(() => {
            scrollViewRef.current?.scrollToEnd(opt);
            timeoutIdRef.current = undefined;
          }, 0);
        }
      } else {
        scrollViewRef.current?.scrollToEnd(opt);
      }
    },
    [scrollViewRef]
  );
  // Scroll to bottom on init
  React.useEffect(() => {
    if (scrollViewRef.current) {
      scrollToEnd({ animated: false });
      return () => clearTimeout(timeoutIdRef.current);
    }
  }, [scrollViewRef, scrollToEnd]);
  // Scroll to bottom on new roll that isn't added to a formula
  React.useEffect(() => {
    const unsubscribe = appDispatch(
      addAppListener({
        actionCreator: addRollToRoller,
        effect: (action, listenerApi) => {
          const entriesCountBefore =
            listenerApi.getOriginalState().diceRoller.entries.ids.length;
          const entriesCountAfter =
            listenerApi.getState().diceRoller.entries.ids.length;
          if (entriesCountAfter > entriesCountBefore) {
            scrollToEnd();
          }
        },
      })
    ) as unknown as UnsubscribeListener;
    return () => {
      unsubscribe();
    };
  }, [appDispatch, scrollToEnd, scrollViewRef]);
  // Scroll to bottom on new formula
  React.useEffect(() => {
    const unsubscribe = appDispatch(
      addAppListener({
        actionCreator: commitRollerActiveFormula,
        effect: () => scrollToEnd(),
      })
    ) as unknown as UnsubscribeListener;
    return () => {
      unsubscribe();
    };
  }, [appDispatch, scrollToEnd, scrollViewRef]);
}

function RollerPage({
  navigation,
}: {
  navigation: DiceRollerScreenProps["navigation"];
}) {
  const store = useAppStore();
  const appDispatch = useAppDispatch();

  const sizeRatio = useAppSelector(
    (state) => state.diceRoller.settings.cardsSizeRatio
  );
  const alignment = useAppSelector(
    (state) => state.diceRoller.settings.cardsAlignment
  );
  const { ids: rollsIds, entities: rollEntries } = useAppSelector(
    (state) => state.diceRoller.entries
  );
  const refs = React.useRef<
    Map<string, React.RefObject<AnimatedRollCardHandle>>
  >(new Map());
  React.useEffect(() => {
    // Clear old refs
    for (const uuid of refs.current.keys()) {
      if (!rollsIds.includes(uuid)) {
        refs.current.delete(uuid);
      }
    }
  }, [rollsIds]);

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  // Scroll to bottom when a new item is added
  useAutoScrollToEnd(scrollViewRef);

  const isMounted = useIsMounted();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const bottomPadding = useSharedValue(0);
  const animatedPadding = useAnimatedStyle(() => ({
    height: bottomPadding.value,
  }));

  const [containerSize, setContainerSize] = React.useState({
    width: 0,
    height: 0,
  });
  // const scrollViewPosRef = React.useRef({ x: 0, y: 0 });
  const scrollOffsetRef = React.useRef(0);
  const [formulaButtonRect, setFormulaButtonRect] =
    React.useState<LayoutRectangle>();
  const [formulaStartRect, setFormulaStartRect] =
    React.useState<LayoutRectangle>();

  const activeFormulaEntry = useAppSelector(
    (state) => state.diceRoller.activeRollFormula
  );
  React.useEffect(() => {
    return () => {
      // Commit formula on leaving screen
      appDispatch(commitRollerActiveFormula());
    };
  }, [appDispatch]);

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
      <View
        style={{ flex: 1 }}
        onLayout={(e) =>
          setContainerSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        <Animated.ScrollView
          ref={scrollViewRef}
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{
            paddingBottom: 5,
            gap: sizeRatio * 20,
          }}
          onScroll={(event) =>
            (scrollOffsetRef.current = event.nativeEvent.contentOffset.y)
          }
          // onLayout={(e) => {
          //   scrollViewPosRef.current = {
          //     x: e.nativeEvent.layout.x,
          //     y: e.nativeEvent.layout.y,
          //   };
          // }}
        >
          {!rollsIds.length && (
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
          <LayoutAnimationConfig skipEntering={!isMounted}>
            {rollsIds.map((untypedId, i) => {
              const id = untypedId as string;
              if (!rollEntries[id]) {
                return null;
              }
              let ref = refs.current.get(id);
              if (!ref) {
                ref = React.createRef();
                refs.current.set(id, ref);
              }
              const align =
                alignment === "alternate"
                  ? i % 2
                    ? "center-right"
                    : "center-left"
                  : alignment;
              return (
                <GenericRollerEntryCard
                  key={id}
                  ref={ref}
                  rollerEntry={rollEntries[id]}
                  sizeRatio={sizeRatio}
                  parentViewWidth={screenWidth}
                  alignment={align}
                  onOpen={(rect) => {
                    if (rollEntries[id]?.formula) {
                      appDispatch(activateRollerFormula(rollEntries[id].uuid));
                      setFormulaStartRect({
                        x: rect.x,
                        y: rect.y - scrollOffsetRef.current,
                        width: rect.width,
                        height: rect.height,
                      });
                    }
                  }}
                  onRemove={() => {
                    appDispatch(removeRollerEntry(id as string));
                    bottomPadding.value = sizeRatio * screenWidth;
                    bottomPadding.value = withTiming(0, {
                      duration: 300,
                    });
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  }}
                />
              );
            })}
          </LayoutAnimationConfig>
          {/* Padding to have a smooth scroll when removing a roll entry */}
          <Animated.View style={animatedPadding} />
        </Animated.ScrollView>
        {/* Bottom button */}
        <OpenFormulaCardButton
          style={{ width: "100%" }}
          onPress={() => {
            store.dispatch(activateRollerFormula());
            setFormulaStartRect(formulaButtonRect);
          }}
          onLayout={(e) => setFormulaButtonRect({ ...e.nativeEvent.layout })}
        />
        {/* Opened formula card */}
        {activeFormulaEntry && formulaStartRect && (
          <OpenedFormulaCard
            formulaEntry={activeFormulaEntry}
            sizeRatio={0.5}
            parentViewSize={containerSize}
            startRect={formulaStartRect}
            onClose={() => {
              appDispatch(commitRollerActiveFormula());
              setFormulaStartRect(undefined);
            }}
          />
        )}
      </View>
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

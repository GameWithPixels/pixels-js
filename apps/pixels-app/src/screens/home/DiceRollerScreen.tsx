import { UnsubscribeListener } from "@reduxjs/toolkit";
import { assertNever } from "@systemic-games/pixels-core-utils";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  LayoutRectangle,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewProps,
  useWindowDimensions,
  KeyboardAvoidingView,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  AnimatedRef,
  LayoutAnimationConfig,
  runOnJS,
  SlideInDown,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OptionsMenu } from "./components/RollerOptionsMenu";
import {
  computeFormulaViewWidth,
  FormulaTouchableCard,
  RollTouchableCard,
  useNewArrayItems,
} from "./components/roller";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { DiceRollerScreenProps } from "~/app/navigation";
import { addAppListener } from "~/app/store";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { CardProps } from "~/components/Card";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import { PageHeader } from "~/components/PageHeader";
import { getBorderRadius } from "~/features/getBorderRadius";
import { parseRollFormula } from "~/features/rollFormula";
import {
  addRollToRoller,
  commitRollerActiveFormula,
  RollerEntry,
  removeRollerEntry,
  updateRollerActiveFormula,
  activateRollerFormula,
  RollerEntryWithFormula,
  removeRollerActiveFormulaRoll,
} from "~/features/store";
import { useIsMounted } from "~/hooks";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedRollCardHandle {
  overrideSizeRatio: (sizeRatio: number) => void;
}

const AnimatedTouchableCard = React.forwardRef(function AnimatedTouchableCard(
  {
    sizeRatio,
    cardWidth,
    parentViewWidth,
    alignment,
    onRemove,
    card,
    ...props
  }: {
    sizeRatio: number;
    cardWidth: number;
    parentViewWidth: number;
    alignment?: "left" | "right" | "center" | "center-left" | "center-right";
    onRemove?: () => void;
    card?: (props: {
      sizeFactor: number;
      cardWidth: number;
      leftPos: number;
    }) => React.ReactNode;
  } & Omit<ViewProps, "children">,
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
      } else {
        offset.value = 0;
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
        // layout={LinearTransition.duration(300)}
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

  const formulaTree = React.useMemo(() => {
    try {
      return rollerEntry.formula?.length
        ? parseRollFormula(rollerEntry.formula)
        : undefined;
    } catch (e) {}
  }, [rollerEntry.formula]);

  const formulaViewWidth = computeFormulaViewWidth(
    formulaTree ?? {
      kind: "dice",
      dieType: "d20",
      count: 1,
    }
  );
  const borderSize = 0.02;
  const dividerSize = 0.005;
  const valueSize = 0.4;
  const cardRefWidth =
    Math.max(
      2.2 * valueSize,
      formulaViewWidth + 2 * borderSize + dividerSize + valueSize
    ) *
    parentViewWidth *
    sizeRatio;

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
      cardWidth={Math.min(parentViewWidth, cardRefWidth)}
      parentViewWidth={parentViewWidth}
      alignment={alignment}
      onRemove={onRemove}
      card={({ sizeFactor, cardWidth, leftPos }) =>
        rollEntry ? (
          <RollTouchableCard
            value={rollEntry.value}
            rolls={[rollEntry]}
            sizeFactor={sizeFactor}
            cardWidth={cardWidth}
            cardRefWidth={cardRefWidth}
            leftPos={leftPos}
          />
        ) : formulaEntry ? (
          <FormulaTouchableCard
            formulaEntry={formulaEntry}
            sizeFactor={sizeFactor}
            cardWidth={cardWidth}
            cardRefWidth={cardRefWidth}
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
        end={{ x: 0, y: 0.95 }}
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
          start={{ x: 0, y: 0.05 }}
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
  // parentViewSize,
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

  const finalHeightRef = React.useRef<number>();
  const [parentViewSize, setParentViewSize] = React.useState({
    width: 0,
    height: 0,
  });
  React.useEffect(() => {
    setLeftPos(0);
    setCardWidth(parentViewSize.width);
  }, [parentViewSize.width]);

  const newRolls = useNewArrayItems(formulaEntry.rolls);
  const hadResult = React.useRef(formulaEntry.value !== undefined);
  React.useEffect(() => {
    // Automatically close the card if the result is set on a new roll
    if (
      !hadResult.current &&
      formulaEntry.value !== undefined &&
      newRolls.length
    ) {
      setTimeout(onClose, 1500);
    }
  }, [formulaEntry.value, newRolls.length, onClose]);

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
      <KeyboardAvoidingView behavior="padding" style={AppStyles.flex}>
        <View
          style={AppStyles.flex}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setParentViewSize({ width, height });
            if (finalHeightRef.current) {
              animTop.value = height - finalHeightRef.current;
            }
          }}
        />
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
          cardRefWidth={parentViewSize.width}
          canScroll
          leftPos={leftPos}
          animateDice
          style={animStyle}
          onRollFormulaChange={showEditor ? onChange : undefined}
          onDismiss={onClose}
          onRemoveRoll={(roll) => {
            if ("timestamp" in roll && typeof roll.timestamp === "number") {
              appDispatch(removeRollerActiveFormulaRoll(roll.timestamp));
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          }}
          onWidthAnimationEnd={(w) => {
            w === cardWidth && setShowEditor(true);
          }}
          onFinalSize={({ height }) => {
            finalHeightRef.current = height;
            animTop.value = withTiming(parentViewSize.height - height);
          }}
        />
      </KeyboardAvoidingView>
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
                All connected dice rolls will be shown here.
              </Text>
              <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
                Slide rolls to remove them and customize the view layout using
                the option menu on the top right.
              </Text>
              <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
                Create Roll Formulas using the bottom button. Rolls will be
                stored in the Roll Formula card as long as it stays opened.
              </Text>
              <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
                In the Roll Formula card, slide away unwanted rolls. Completed
                Roll Formulas may be edited.
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
                    bottomPadding.value = withTiming(0, { duration: 300 });
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  }}
                />
              );
            })}
          </LayoutAnimationConfig>
          {/* Padding to not clip the last entry when removing another one */}
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

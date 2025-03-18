import { UnsubscribeListener } from "@reduxjs/toolkit";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  LayoutRectangle,
  Platform,
  View,
  ViewProps,
  useWindowDimensions,
} from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  AnimatedRef,
  LayoutAnimationConfig,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RollerHeader } from "./components/RollerHeader";
import {
  ActiveFormulaCard,
  AnimatedRollCardHandle,
  RollerEntryCard,
} from "./components/roller";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { DiceRollerScreenProps } from "~/app/navigation";
import { addAppListener } from "~/app/store";
import { AppBackground } from "~/components/AppBackground";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  addRollToRoller,
  commitRollerActiveFormula,
  RollerEntry,
  removeRollerEntry,
  activateRollerFormula,
} from "~/features/store";
import { useIsMounted } from "~/hooks";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function ExplanatoryCard() {
  return (
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
        Slide rolls to remove them and customize the view layout using the
        option menu on the top right.
      </Text>
      <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
        Create Roll Formulas using the bottom button. Rolls will be stored in
        the Roll Formula card as long as it stays opened.
      </Text>
      <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
        In the Roll Formula card, slide away unwanted rolls. Completed Roll
        Formulas may be edited.
      </Text>
    </RotatingGradientBorderCard>
  );
}

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

  // Settings
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
  const bottomPadding = useSharedValue(0);
  const animatedPadding = useAnimatedStyle(() => ({
    height: bottomPadding.value,
  }));

  // Store information about the layout for animations
  const layoutInfoRef = React.useRef<{
    scrollOffset: number;
    formulaButtonRect?: LayoutRectangle;
    cardStartRect?: LayoutRectangle;
    containerSize?: { width: number; height: number };
  }>({ scrollOffset: 0 });

  React.useEffect(() => {
    return () => {
      // Commit formula on leaving screen
      store.dispatch(commitRollerActiveFormula());
    };
  }, [store]);

  const { width: screenWidth } = useWindowDimensions();
  const onOpenEntry = React.useCallback(
    (rollerEntry: RollerEntry, rect: LayoutRectangle) => {
      if (rollerEntry?.formula) {
        store.dispatch(activateRollerFormula(rollerEntry.uuid));
        layoutInfoRef.current.cardStartRect = {
          x: rect.x,
          y: rect.y - layoutInfoRef.current.scrollOffset,
          width: rect.width,
          height: rect.height,
        };
      }
    },
    [store]
  );
  const onRemoveEntry = React.useCallback(
    (uuid: string) => {
      store.dispatch(removeRollerEntry(uuid));
      if (screenWidth) {
        bottomPadding.value = sizeRatio * screenWidth;
        bottomPadding.value = withTiming(0, { duration: 300 });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [bottomPadding, screenWidth, sizeRatio, store]
  );

  return (
    <View style={{ height: "100%" }}>
      <RollerHeader
        navigation={navigation}
        onLiveChangeSizeRatio={(r) => {
          for (const ref of refs.current.values()) {
            ref.current?.overrideSizeRatio(r);
          }
        }}
      />
      <View
        style={{ flex: 1 }}
        onLayout={({ nativeEvent: { layout } }) =>
          (layoutInfoRef.current.containerSize = { ...layout })
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
          onScroll={({ nativeEvent: { contentOffset } }) =>
            (layoutInfoRef.current.scrollOffset = contentOffset.y)
          }
        >
          {!rollsIds.length ? (
            <ExplanatoryCard />
          ) : (
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
                  <RollerEntryCard
                    key={id}
                    ref={ref}
                    rollerEntry={rollEntries[id]}
                    sizeRatio={sizeRatio}
                    parentViewWidth={screenWidth}
                    alignment={align}
                    onOpen={onOpenEntry}
                    onRemove={onRemoveEntry}
                  />
                );
              })}
            </LayoutAnimationConfig>
          )}
          {/* Padding to not clip the last entry when removing another one */}
          <Animated.View style={animatedPadding} />
        </Animated.ScrollView>
        {/* Bottom button */}
        <OpenFormulaCardButton
          style={{ width: "100%" }}
          onPress={() => {
            const rect = layoutInfoRef.current.formulaButtonRect;
            if (rect) {
              store.dispatch(activateRollerFormula());
              layoutInfoRef.current.cardStartRect = rect;
            }
          }}
          onLayout={({ nativeEvent: { layout } }) =>
            (layoutInfoRef.current.formulaButtonRect = { ...layout })
          }
        />
        {/* Opened formula card */}
        <ActiveFormulaCard
          layoutGetter={() => layoutInfoRef.current}
          onClose={() => {
            store.dispatch(commitRollerActiveFormula());
            layoutInfoRef.current.cardStartRect = undefined;
          }}
        />
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

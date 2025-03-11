import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, View } from "react-native";
import { Divider, TouchableRipple, useTheme } from "react-native-paper";
import {
  FadeOut,
  LayoutAnimationConfig,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

import { AnimatedRolledDie } from "./AnimatedRolledDie";
import { AnimatedRollCardText, RollCardText } from "./RollCardText";
import {
  formulaDieSize,
  getFormulaViewMaxHeight,
  RollFormulaView,
} from "./RollFormulaView";

import { AnimatedCard, CardProps } from "~/components/Card";
import { BottomSheetModalCloseButton } from "~/components/buttons";
import { makeTransparent } from "~/components/colors";
import {
  RollFormulaTree,
  getFormulaRollsMapping,
} from "~/features/rollFormula";
import { DieRoll } from "~/features/store";
import { useIsMounted } from "~/hooks";

export function useNewArrayItems<Type>(
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

export type RollCardCommonProps = CardProps & {
  sizeFactor: number;
  cardWidth: number;
  cardRefWidth: number;
  canScroll?: boolean;
  leftPos: number;
  animateDice?: boolean;
  onPress?: () => void;
  onDismiss?: () => void;
  onRemoveRoll?: (roll: DieRoll) => void;
  onWidthAnimationEnd?: (w: number) => void;
  onHeightAnimationEnd?: (h: number) => void;
  onFinalSize?: (layout: { width: number; height: number }) => void;
};

export function RollTouchableCard({
  children,
  title,
  rolls,
  droppedRolls,
  formulaTree,
  value,
  sizeFactor,
  cardWidth,
  cardRefWidth,
  canScroll,
  leftPos,
  animateDice,
  style,
  onPress,
  onDismiss,
  onRemoveRoll,
  onWidthAnimationEnd,
  onHeightAnimationEnd,
  onFinalSize,
  ...props
}: {
  title?: string;
  formulaTree?: RollFormulaTree;
  singleRoll?: boolean;
  rolls: readonly DieRoll[];
  droppedRolls?: readonly DieRoll[]; // Should be included in "rolls" property too
  value?: number;
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

  const borderSize = 0.02 * sizeFactor;
  const titleSize = 0.1 * sizeFactor;
  const touchHeight = sizeFactor * getFormulaViewMaxHeight() + titleSize;
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

  const rollsMapping = React.useMemo(
    () => formulaTree && getFormulaRollsMapping(formulaTree, [...rolls]),
    [rolls, formulaTree]
  );

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
        <LayoutAnimationConfig
          skipEntering={!animateDice || !isMounted}
          skipExiting={!animateDice}
        >
          <View
            style={{
              flexGrow: 1,
              flexShrink: 1,
              alignItems: "center",
              height: touchHeight,
            }}
          >
            {title && (
              <RollCardText lineHeight={titleSize}>{title}</RollCardText>
            )}
            <View
              style={{
                flexGrow: 1,
                flexShrink: 1,
                justifyContent: "center",
              }}
            >
              <ScrollView
                horizontal
                scrollEnabled={canScroll}
                contentContainerStyle={{ alignItems: "center" }}
              >
                {formulaTree && rollsMapping ? (
                  <RollFormulaView
                    formulaTree={formulaTree}
                    sizeFactor={sizeFactor}
                    rollsMapping={rollsMapping}
                    droppedRolls={droppedRolls}
                    onRemoveRoll={onRemoveRoll}
                  />
                ) : (
                  rolls.length > 0 && (
                    <AnimatedRolledDie
                      dieType={rolls[0].dieType}
                      value={rolls[0].value}
                      size={sizeFactor * formulaDieSize}
                    />
                  )
                )}
              </ScrollView>
              {!canScroll && cardRefWidth > cardWidth && (
                // Fade out formula view when it's wider than the card
                <LinearGradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1.2, y: 0 }}
                  locations={[0, 0.7, 1]}
                  colors={[
                    "transparent",
                    makeTransparent(colors.background, 0.5),
                    colors.background,
                  ]}
                  style={{
                    position: "absolute",
                    width: sizeFactor * 0.3,
                    right: 0,
                    height: "100%",
                    zIndex: 10,
                    paddingHorizontal: sizeFactor * 0.03,
                  }}
                />
              )}
            </View>
          </View>
          <Divider
            style={{
              height: "90%",
              width: 0.005 * sizeFactor,
              backgroundColor: colors.onPrimary,
            }}
          />
          <AnimatedRollCardText
            key={value ?? "value"} // Force re-render on value change
            entering={ZoomIn.duration(300)}
            exiting={FadeOut.duration(100)}
            lineHeight={sizeFactor * 0.3}
            style={{
              width: 0.4 * sizeFactor,
              marginTop: title ? titleSize : 0,
            }}
          >
            {value ?? "?"}
          </AnimatedRollCardText>
        </LayoutAnimationConfig>
      </TouchableRipple>
      {children && (
        <View
          style={{
            flexGrow: 1,
            width: "100%",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: cardWidth - borderSize * 2,
              left: 0,
              top: 0,
            }}
            onLayout={(e) => {
              // For some reason the animation of the card width creates some vibration in the layout
              const h = touchHeight + e.nativeEvent.layout.height;
              if (h > maxHeightRef.current) {
                maxHeightRef.current = h + 1;
                animHeight.value = withTiming(h);
                onFinalSize?.({
                  width: cardWidth,
                  height: h + borderSize * 2,
                });
              }
            }}
          >
            {children}
          </View>
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

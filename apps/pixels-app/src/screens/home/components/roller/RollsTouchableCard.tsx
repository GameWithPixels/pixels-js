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
  computeFormulaViewWidth,
  getFormulaDieSize,
  getFormulaViewMaxHeight,
  RollFormulaView,
} from "./RollFormulaView";

import { AnimatedCard, CardProps } from "~/components/Card";
import { TopRightCloseButton } from "~/components/buttons";
import { makeTransparent } from "~/components/colors";
import {
  RollFormulaTree,
  getFormulaRollsMapping,
} from "~/features/rollFormula";
import { DieRoll } from "~/features/store";
import { useIsMounted } from "~/hooks";

const borderSize = 0.02;
const dividerSize = 0.005;
const valueSize = 0.4;
const titleSize = 0.1;
const overlaySize = 0.3;

export function computeRollCardRefWidth(formulaTree?: RollFormulaTree): number {
  const formulaViewWidth = formulaTree
    ? computeFormulaViewWidth(formulaTree)
    : 0;
  return Math.max(
    2.2 * valueSize, // Minimum width
    formulaViewWidth + 2 * borderSize + dividerSize + valueSize
  );
}

export type RollCardCommonProps = CardProps & {
  scale: number;
  cardWidth: number;
  cardRefWidth: number;
  leftPos: number;
  canScroll?: boolean;
  animateDice?: boolean;
  onPress?: () => void;
  onDismiss?: () => void;
  onRemoveRoll?: (roll: DieRoll) => void;
  onWidthAnimationEnd?: (w: number) => void;
  onHeightAnimationEnd?: (h: number) => void;
  onFinalSize?: (layout: { width: number; height: number }) => void;
};

export function RollsTouchableCard({
  children,
  title,
  rolls,
  droppedRolls,
  formulaTree,
  result,
  scale,
  cardWidth,
  cardRefWidth,
  leftPos,
  canScroll,
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
  formulaTree?: Readonly<RollFormulaTree> | "invalid";
  rolls: readonly DieRoll[];
  droppedRolls?: readonly DieRoll[]; // Should be included in "rolls" property too
  result?: number;
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

  const touchHeight = (getFormulaViewMaxHeight() + titleSize) * scale;
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
    () =>
      formulaTree &&
      formulaTree !== "invalid" &&
      getFormulaRollsMapping(formulaTree, [...rolls]),
    [rolls, formulaTree]
  );

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
          margin: borderSize * scale,
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
              <RollCardText lineHeight={titleSize * scale}>
                {title}
              </RollCardText>
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
                scrollEnabled={canScroll ?? false}
                bounces={false}
                contentContainerStyle={{ alignItems: "center" }}
              >
                {formulaTree === "invalid" ? (
                  <RollCardText lineHeight={(valueSize / 3) * scale}>
                    Invalid formula
                  </RollCardText>
                ) : formulaTree && rollsMapping ? (
                  <RollFormulaView
                    formulaTree={formulaTree}
                    scale={scale}
                    rollsMapping={rollsMapping}
                    droppedRolls={droppedRolls}
                    onRemoveRoll={onRemoveRoll}
                  />
                ) : (
                  rolls.length > 0 && (
                    <AnimatedRolledDie
                      dieType={rolls[0].dieType}
                      size={getFormulaDieSize() * scale}
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
                    width: overlaySize * scale,
                    right: 0,
                    height: "100%",
                    zIndex: 10,
                    paddingHorizontal: overlaySize * 0.1 * scale,
                  }}
                />
              )}
            </View>
          </View>
          <Divider
            style={{
              height: "90%",
              width: dividerSize * scale,
              backgroundColor: colors.onPrimary,
            }}
          />
          <AnimatedRollCardText
            key={result ?? "result"} // Force re-render on value change
            entering={ZoomIn.duration(300)}
            exiting={FadeOut.duration(100)}
            lineHeight={valueSize * scale * 0.75}
            style={{
              width: valueSize * scale,
              marginTop: title ? titleSize * scale : 0,
            }}
          >
            {result ?? "?"}
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
        <TopRightCloseButton
          onPress={onDismiss}
          style={{ top: -10, right: -10 }}
        />
      )}
    </AnimatedCard>
  );
}

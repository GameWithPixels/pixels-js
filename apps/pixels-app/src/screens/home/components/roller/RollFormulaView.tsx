import { assertNever, range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { Divider, useTheme } from "react-native-paper";
import Animated, {
  FadeOut,
  runOnJS,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedRolledDie } from "./AnimatedRolledDie";
import { RollCardText } from "./RollCardText";

import { makeTransparent } from "~/components/colors";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  RollFormulaElement as _RollFormulaElement,
  RollFormulaTree as _RollFormulaTree,
  getFormulaRollsMapping,
} from "~/features/rollFormula";
import { DieRoll } from "~/features/store";
import { usePanGesture } from "~/hooks";

type RollFormulaTree = Readonly<_RollFormulaTree>;
type RollFormulaElement = Readonly<_RollFormulaElement>;

function SlidableDie({
  onRemove,
  style,
  ...props
}: React.PropsWithChildren<{
  onRemove?: () => void;
}> &
  ViewProps) {
  const offset = useSharedValue(0);
  const panActive = useSharedValue(!!onRemove);
  React.useEffect(() => {
    panActive.value = !!onRemove;
  }, [onRemove, panActive]);
  const cutoffDist = 200;
  const pan = usePanGesture({
    direction: "vertical",
    onChange: (y) => {
      "worklet";
      offset.value = panActive.value ? y : 0;
    },
    onEnd: () => {
      "worklet";
      if (panActive.value) {
        if (Math.abs(offset.value) < 0.5 * cutoffDist) {
          // Cancel gesture
          offset.value = withSpring(0);
        } else {
          // Move away and return it after a small delay
          offset.value = withSequence(
            withTiming(10000, { duration: 0 }),
            withDelay(1000, withTiming(0, { duration: 0 }))
          );
          // Remove item
          onRemove && runOnJS(onRemove)();
        }
      } else {
        offset.value = 0;
      }
    },
  });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
    opacity: 1 - Math.abs(offset.value) / cutoffDist,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[animStyle, style]} {...props} />
    </GestureDetector>
  );
}

type CommonFormulaTreeProps = {
  scale: number;
  depth: number;
  rollsMapping: ReturnType<typeof getFormulaRollsMapping<DieRoll>>;
  droppedRolls?: readonly Readonly<DieRoll>[];
  onRemoveRoll?: (roll: Readonly<DieRoll>) => void;
};

const textHeight = 0.3;
const textWidthPerChar = 0.15;

function ConstantView({
  constant,
  scale,
}: {
  constant: Extract<RollFormulaElement, { kind: "constant" }>;
} & Pick<CommonFormulaTreeProps, "scale">) {
  const str = constant.value.toString();
  return (
    <RollCardText
      lineHeight={scale * textHeight}
      style={{ width: scale * textWidthPerChar * str.length }}
    >
      {str}
    </RollCardText>
  );
}

function computeConstantViewWidth(
  constant: Extract<RollFormulaElement, { kind: "constant" }>,
  scale: number
): number {
  return constant.value.toString().length * textWidthPerChar * scale;
}

const dieSize = 0.3;
const dieOverlapVerticalFactor = 0.5;
const dieOverlapHorizontalFactor = 0.5;
const d100OverlapHorizontalFactor = 0.3;
const nestedDiceScale = 0.8;
const droppedDiceScale = 0.8;

function MayBeSlidableDieRollView({
  roll,
  scale,
  overlap,
  droppedRolls,
  onRemoveRoll: onRemove,
}: {
  roll: Readonly<DieRoll> | DieRoll["dieType"];
  overlap?: "left" | "top";
} & Omit<CommonFormulaTreeProps, "rollsMapping">) {
  const isRoll = typeof roll === "object";
  const dropped = isRoll && droppedRolls?.includes(roll);
  const size = scale * dieSize * (dropped ? droppedDiceScale : 1);
  const style: ViewProps["style"] = [
    overlap === "left" && {
      marginLeft: -size * dieOverlapHorizontalFactor,
    },
    overlap === "top" && {
      marginTop: -size * dieOverlapVerticalFactor,
    },
  ] as const;
  return isRoll && onRemove ? (
    <SlidableDie
      onRemove={() => onRemove(roll)}
      style={{ zIndex: dropped ? 0 : 1 }}
    >
      <AnimatedRolledDie
        entering={SlideInDown.duration(300)}
        exiting={FadeOut.duration(100)}
        dieType={roll.dieType}
        value={roll.value}
        faded={dropped}
        size={size}
        style={style}
      />
    </SlidableDie>
  ) : (
    <AnimatedRolledDie
      entering={SlideInDown.duration(300)}
      exiting={FadeOut.duration(100)}
      dieType={isRoll ? roll.dieType : roll}
      value={isRoll ? roll.value : undefined}
      faded={dropped}
      size={size}
      style={[style, { zIndex: dropped ? 0 : 1 }]}
    />
  );
}

type DiceElement = Extract<RollFormulaElement, { kind: "dice" }>;
type DicePairElement = DiceElement & {
  dieType: Exclude<DiceElement["dieType"], "d100">;
  count: 2;
};

function DiceView({
  dice,
  scale,
  rollsMapping,
  ...props
}: {
  dice: DiceElement;
} & CommonFormulaTreeProps) {
  const rolls = rollsMapping.get(dice);
  const isD100 = dice.dieType === "d100";
  const units = isD100 ? rolls?.filter((r) => r.dieType === "d10") : undefined;
  const tens = isD100 ? rolls?.filter((r) => r.dieType === "d00") : undefined;
  if (isD100 && props.depth) {
    scale *= nestedDiceScale;
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {range(dice.count).map((i) => {
        if (isD100) {
          const u = units?.[dice.count - 1 - i];
          const t = tens?.[dice.count - 1 - i];
          return (
            <View
              key={i}
              style={{
                marginLeft: i
                  ? -scale * dieSize * d100OverlapHorizontalFactor
                  : 0,
              }}
            >
              <MayBeSlidableDieRollView
                key={`d10-${u?.value}`}
                roll={u ?? "d10"}
                scale={scale}
                {...props}
              />
              <MayBeSlidableDieRollView
                key={`d00-${t?.value}`}
                roll={t ?? "d00"}
                overlap="top"
                scale={scale}
                {...props}
              />
            </View>
          );
        } else {
          const roll = rolls?.[dice.count - 1 - i];
          return (
            <MayBeSlidableDieRollView
              key={`${i}-${roll?.value}`}
              roll={roll ?? dice.dieType}
              overlap={i > 0 ? "left" : undefined}
              scale={scale}
              {...props}
            />
          );
        }
      })}
    </View>
  );
}

function computeDiceViewWidth(
  dice: DiceElement,
  scale: number,
  depth: number
): number {
  const isD100 = dice.dieType === "d100";
  if (isD100 && depth) {
    scale *= nestedDiceScale;
  }
  const f = isD100 ? d100OverlapHorizontalFactor : dieOverlapHorizontalFactor;
  return !dice.count ? 0 : (1 + (dice.count - 1) * (1 - f)) * scale * dieSize;
}

function DiceRollStackView({
  dice,
  rollsMapping,
  ...props
}: {
  dice: DicePairElement;
} & CommonFormulaTreeProps) {
  const rolls = rollsMapping.get(dice);
  return (
    <View>
      {range(dice.count).map((i) => {
        const roll = rolls?.[i];
        return (
          <MayBeSlidableDieRollView
            key={`${i}-${roll?.value}`}
            roll={roll ?? dice.dieType}
            overlap={i > 0 ? "top" : undefined}
            {...props}
          />
        );
      })}
    </View>
  );
}

const separatorWidth = 0.02;

function extractSingleDicePair(
  modifier: Extract<RollFormulaElement, { kind: "modifier" }>
): DicePairElement | undefined {
  const dice = modifier.groups[0];
  if (
    modifier.count === 1 &&
    modifier.groups.length === 1 &&
    dice.kind === "dice" &&
    dice.count === 2 &&
    dice.dieType !== "d100"
  ) {
    return dice as DicePairElement;
  }
}

const modifierHeight = (2 - dieOverlapVerticalFactor) * dieSize;
const modifierTextSize = 0.1;
const nestedModifierScale = 1 - modifierTextSize / modifierHeight;

function ModifierView({
  modifier,
  depth,
  scale,
  ...props
}: {
  modifier: Extract<RollFormulaElement, { kind: "modifier" }>;
} & CommonFormulaTreeProps) {
  // Adjust scale for nested modifiers
  scale *= depth ? nestedModifierScale : 1;
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const dicePair = extractSingleDicePair(modifier);
  return (
    modifier.groups.length > 0 &&
    (dicePair && !depth ? (
      <DiceRollStackView
        dice={dicePair}
        scale={scale}
        depth={depth}
        {...props}
      />
    ) : (
      <View
        style={{
          height: scale * modifierHeight,
          alignItems: "center",
          borderRadius,
          backgroundColor: makeTransparent(colors.surfaceDisabled, 0.1),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexGrow: 1,
            flexShrink: 1,
            alignItems: "center",
          }}
        >
          <RollFormulaInnerView
            formulaTree={modifier.groups[0]}
            scale={scale}
            depth={depth + 1}
            {...props}
          />
          {modifier.groups.slice(1).map((group, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  height: "90%",
                  width: scale * separatorWidth,
                  alignItems: "center",
                }}
              >
                <Divider
                  style={{
                    height: "100%",
                    width: StyleSheet.hairlineWidth,
                    backgroundColor: colors.onPrimary,
                  }}
                />
              </View>
              <RollFormulaInnerView
                formulaTree={group}
                scale={scale}
                depth={depth + 1}
                {...props}
              />
            </View>
          ))}
        </View>
        <RollCardText lineHeight={scale * modifierTextSize}>
          {modifier.modifier}
          {modifier.count}
        </RollCardText>
      </View>
    ))
  );
}

function computeModifierViewWidth(
  modifier: Extract<RollFormulaElement, { kind: "modifier" }>,
  scale: number,
  depth: number
): number {
  const childScale = scale * (depth ? nestedModifierScale : 1);
  const childWidth =
    extractSingleDicePair(modifier) && !depth
      ? dieSize
      : modifier.groups.reduce(
          (sum, group, i) =>
            sum +
            computeFormulaInnerViewWidth(group, childScale, depth + 1) +
            (i ? separatorWidth : 0),
          0
        );
  return scale * childWidth;
}

const operatorHeight = 0.1;
const operatorWidth = 0.05;

function OperationView({
  operation,
  ...props
}: {
  operation: Extract<RollFormulaTree, { kind: "operation" }>;
} & CommonFormulaTreeProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <RollFormulaInnerView formulaTree={operation.left} {...props} />
      <RollCardText
        lineHeight={props.scale * operatorHeight}
        style={{ width: props.scale * operatorWidth }}
      >
        {operation.operator}
      </RollCardText>
      <RollFormulaInnerView formulaTree={operation.right} {...props} />
    </View>
  );
}

function computeOperationViewWidth(
  operation: Extract<RollFormulaTree, { kind: "operation" }>,
  scale: number,
  depth: number
): number {
  return (
    computeFormulaInnerViewWidth(operation.left, scale, depth) +
    operatorWidth +
    computeFormulaInnerViewWidth(operation.right, scale, depth)
  );
}

function RollFormulaInnerView({
  formulaTree,
  ...props
}: {
  formulaTree: RollFormulaTree;
} & CommonFormulaTreeProps) {
  const { kind } = formulaTree;
  switch (kind) {
    case "constant":
      return <ConstantView constant={formulaTree} {...props} />;
    case "dice":
      return <DiceView dice={formulaTree} {...props} />;
    case "modifier":
      return <ModifierView modifier={formulaTree} {...props} />;
    case "operation":
      return <OperationView operation={formulaTree} {...props} />;
    default:
      assertNever(kind, `Unknown element kind: ${kind}`);
  }
}

export function RollFormulaView({
  formulaTree,
  ...props
}: {
  formulaTree: RollFormulaTree;
} & Omit<CommonFormulaTreeProps, "depth">) {
  return (
    <RollFormulaInnerView formulaTree={formulaTree} depth={0} {...props} />
  );
}

export function computeFormulaInnerViewWidth(
  formulaTree: RollFormulaTree,
  scale: number,
  depth: number
): number {
  const { kind } = formulaTree;
  switch (kind) {
    case "constant":
      return computeConstantViewWidth(formulaTree, scale);
    case "dice":
      return computeDiceViewWidth(formulaTree, scale, depth);
    case "modifier":
      return computeModifierViewWidth(formulaTree, scale, depth);
    case "operation":
      return computeOperationViewWidth(formulaTree, scale, depth);
    default:
      assertNever(kind, `Unknown formula kind: ${kind}`);
  }
}

export function computeFormulaViewWidth(formulaTree: RollFormulaTree): number {
  return computeFormulaInnerViewWidth(formulaTree, 1, 0);
}

export function getFormulaViewMaxHeight(): number {
  return modifierHeight;
}

export function getFormulaDieSize(): number {
  return dieSize;
}

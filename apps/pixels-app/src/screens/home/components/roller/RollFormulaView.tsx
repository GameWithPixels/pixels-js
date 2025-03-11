import { assertNever, range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Divider, useTheme } from "react-native-paper";
import Animated, {
  FadeOut,
  runOnJS,
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
  RollFormulaElement,
  RollFormulaTree,
  getFormulaRollsMapping,
} from "~/features/rollFormula";
import { DieRoll } from "~/features/store";

function SlidableDie({
  onRemove,
  style,
  ...props
}: React.PropsWithChildren<{
  onRemove?: () => void;
}> &
  ViewProps) {
  const pressed = useSharedValue(false);
  const offset = useSharedValue(0);
  const initialTouchLocation = useSharedValue<{ x: number; y: number } | null>(
    null
  );
  const panActive = useSharedValue(false);
  panActive.value = !!onRemove;

  const cutoffDist = 200;

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
        // Check if the gesture is vertical or if it's already activated
        // as we don't want to interrupt an ongoing swipe
        if (pressed.value || yDiff > xDiff) {
          // Vertical panning
          state.activate();
        } else {
          state.fail();
        }
      }
    })
    .onStart(() => (pressed.value = true))
    .onChange((ev) => panActive.value && (offset.value = ev.translationY))
    .onEnd(() => {
      pressed.value = false;
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
  sizeFactor: number;
  rollsMapping: ReturnType<typeof getFormulaRollsMapping<DieRoll>>;
  droppedRolls?: readonly Readonly<DieRoll>[];
  onRemoveRoll?: (roll: Readonly<DieRoll>) => void;
};

const textHeight = 0.3;
const textWidthPerChar = 0.15;

function ConstantView({
  constant,
  sizeFactor,
}: {
  constant: Extract<RollFormulaElement, { kind: "constant" }>;
} & Pick<CommonFormulaTreeProps, "sizeFactor">) {
  const str = constant.value.toString();
  return (
    <RollCardText
      lineHeight={sizeFactor * textHeight}
      style={{ width: sizeFactor * textWidthPerChar * str.length }}
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

export const formulaDieSize = 0.3;
const dieOverlapHorizontalFactor = 2 / 3;
const dieOverlapVerticalFactor = 0.5;

function SlidableDieRollView({
  roll,
  sizeFactor,
  overlap,
  droppedRolls,
  onRemoveRoll: onRemove,
}: {
  roll: Readonly<DieRoll> | DieRoll["dieType"];
  overlap?: "left" | "top";
} & Omit<CommonFormulaTreeProps, "rollsMapping">) {
  const isRoll = typeof roll === "object";
  const dropped = isRoll && droppedRolls?.includes(roll);
  const scale = dropped ? 0.8 : 1;
  return (
    <SlidableDie
      onRemove={onRemove && isRoll ? () => onRemove(roll) : undefined}
      style={{ zIndex: dropped ? 0 : 1 }}
    >
      <AnimatedRolledDie
        // entering={newRoll ? SlideInDown.duration(300) : undefined}
        exiting={FadeOut.duration(100)}
        dieType={isRoll ? roll.dieType : roll}
        value={isRoll ? roll.value : undefined}
        faded={dropped}
        size={sizeFactor * formulaDieSize * scale}
        style={[
          overlap === "left" && {
            marginLeft:
              -sizeFactor * formulaDieSize * dieOverlapHorizontalFactor * scale,
          },
          overlap === "top" && {
            marginTop:
              -sizeFactor * formulaDieSize * dieOverlapVerticalFactor * scale,
          },
        ]}
      />
    </SlidableDie>
  );
}

type DiceElement = Extract<RollFormulaElement, { kind: "dice" }>;
type DicePairElement = DiceElement & {
  dieType: Exclude<DiceElement["dieType"], "d100">;
  count: 2;
};

function DiceView({
  dice,
  rollsMapping,
  ...props
}: {
  dice: DiceElement;
} & CommonFormulaTreeProps) {
  const rolls = rollsMapping.get(dice);
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {range(dice.count).map((i) => {
        const roll = rolls?.[dice.count - 1 - i];
        const key = `${i}-${roll?.value}`;
        return dice.dieType === "d100" ? (
          <View key={key}>
            <SlidableDieRollView roll="d00" {...props} />
            <SlidableDieRollView roll="d10" overlap="top" {...props} />
          </View>
        ) : (
          <SlidableDieRollView
            key={key}
            roll={roll ?? dice.dieType}
            overlap={i > 0 ? "left" : undefined}
            {...props}
          />
        );
      })}
    </View>
  );
}

function computeDiceViewWidth(dice: DiceElement, scale: number): number {
  return dice.count
    ? (1 + (dice.count - 1) * (1 - dieOverlapHorizontalFactor)) *
        formulaDieSize *
        scale
    : 0;
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
          <SlidableDieRollView
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

const modifierHeight = formulaDieSize * (1 + dieOverlapVerticalFactor);
const modifierTextSize = 0.1;
const nestedModifierScale = 1 - modifierTextSize / modifierHeight;

function ModifierView({
  modifier,
  depth,
  sizeFactor,
  ...props
}: {
  modifier: Extract<RollFormulaElement, { kind: "modifier" }>;
  depth: number;
} & CommonFormulaTreeProps) {
  sizeFactor *= depth > 0 ? nestedModifierScale : 1;
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const dicePair = extractSingleDicePair(modifier);
  return (
    modifier.groups.length > 0 &&
    (dicePair && !depth ? (
      <DiceRollStackView dice={dicePair} sizeFactor={sizeFactor} {...props} />
    ) : (
      <View
        style={{
          height: sizeFactor * modifierHeight,
          marginVertical: sizeFactor * 0.01,
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
            depth={depth + 1}
            sizeFactor={sizeFactor}
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
                  width: sizeFactor * separatorWidth,
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
                depth={depth + 1}
                sizeFactor={sizeFactor}
                {...props}
              />
            </View>
          ))}
        </View>
        <RollCardText lineHeight={sizeFactor * modifierTextSize}>
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
  scale *= depth > 0 ? nestedModifierScale : 1;
  return (
    (extractSingleDicePair(modifier) && !depth
      ? formulaDieSize
      : modifier.groups.reduce(
          (sum, group, i) =>
            sum +
            computeFormulaInnerViewWidth(group, scale, depth + 1) +
            (i ? separatorWidth : 0),
          0
        )) * scale
  );
}

const operatorHeight = 0.1;
const operatorWidth = 0.05;

function OperationView({
  operation,
  depth,
  ...props
}: {
  operation: Extract<RollFormulaTree, { kind: "operation" }>;
  depth: number;
} & CommonFormulaTreeProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <RollFormulaInnerView
        formulaTree={operation.left}
        depth={depth}
        {...props}
      />
      <RollCardText
        lineHeight={props.sizeFactor * operatorHeight}
        style={{ width: props.sizeFactor * operatorWidth }}
      >
        {operation.operator}
      </RollCardText>
      <RollFormulaInnerView
        formulaTree={operation.right}
        depth={depth}
        {...props}
      />
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
  depth,
  ...props
}: {
  formulaTree: RollFormulaTree;
  depth: number;
} & CommonFormulaTreeProps) {
  const { kind } = formulaTree;
  switch (kind) {
    case "constant":
      return <ConstantView constant={formulaTree} {...props} />;
    case "dice":
      return <DiceView dice={formulaTree} {...props} />;
    case "modifier":
      return <ModifierView modifier={formulaTree} depth={depth} {...props} />;
    case "operation":
      return <OperationView operation={formulaTree} depth={depth} {...props} />;
    default:
      assertNever(kind, `Unknown element kind: ${kind}`);
  }
}

export function RollFormulaView({
  formulaTree,
  ...props
}: {
  formulaTree: RollFormulaTree;
} & CommonFormulaTreeProps) {
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
      return computeDiceViewWidth(formulaTree, scale);
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

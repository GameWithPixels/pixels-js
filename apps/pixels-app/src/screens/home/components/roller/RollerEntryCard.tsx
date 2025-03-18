import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";
import { LayoutRectangle, ViewProps } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  AnimatedProps,
  LinearTransition,
  runOnJS,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { FormulaTouchableCard } from "./FormulaTouchableCard";
import {
  computeRollCardRefWidth,
  RollsTouchableCard,
} from "./RollsTouchableCard";

import { AppStyles } from "~/app/styles";
import { CardProps } from "~/components/Card";
import { RollerEntry, RollerEntryWithFormula } from "~/features/store";
import { usePanGesture, useRollFormulaTree } from "~/hooks";

export interface AnimatedRollCardHandle {
  overrideSizeRatio: (sizeRatio: number) => void;
}

function SlidableCard({
  leftPos,
  cardWidth,
  parentViewWidth,
  onRemove,
  ...props
}: {
  leftPos: number;
  cardWidth: number;
  parentViewWidth: number;
  onRemove?: () => void;
} & AnimatedProps<ViewProps>) {
  const animPos = useSharedValue(leftPos);
  React.useEffect(() => {
    animPos.value = leftPos;
  }, [animPos, leftPos]);

  const offset = useSharedValue(0);
  const panActive = useSharedValue(false);
  React.useEffect(() => {
    panActive.value = !!onRemove;
  }, [onRemove, panActive]);
  const pan = usePanGesture({
    direction: "horizontal",
    onChange: (x) => {
      "worklet";
      offset.value = panActive.value ? x : 0;
    },
    onEnd: () => {
      "worklet";
      if (panActive.value && cardWidth) {
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
    },
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
      <Animated.View style={[AppStyles.fullWidth, animStyle]} {...props} />
    </GestureDetector>
  );
}

export const RollerEntryCard = React.forwardRef(function RollerEntryCard(
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
    onOpen?: (rollerEntry: RollerEntry, rect: LayoutRectangle) => void;
    onRemove?: (uuid: string) => void;
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

  // Card position in parent view
  const topPosRef = React.useRef<number>();
  const cardRectRef = React.useRef<LayoutRectangle>();
  const onPress = () => {
    if (onOpen && cardRectRef.current && topPosRef.current !== undefined) {
      const cardRect = { ...cardRectRef.current };
      cardRect.y += topPosRef.current;
      onOpen(rollerEntry, cardRect);
    }
  };

  const [scale, setScale] = React.useState(sizeRatio * parentViewWidth);
  React.useEffect(
    () => setScale(sizeRatio * parentViewWidth),
    [parentViewWidth, sizeRatio]
  );
  React.useImperativeHandle(ref, () => {
    return {
      overrideSizeRatio: (sizeRatio) => setScale(sizeRatio * parentViewWidth),
    };
  }, [parentViewWidth]);

  const formulaTree = useRollFormulaTree(rollerEntry.formula);
  const cardRefWidth =
    scale *
    React.useMemo(() => computeRollCardRefWidth(formulaTree), [formulaTree]);

  const cardWidth = Math.min(parentViewWidth, cardRefWidth);
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

  return (
    <SlidableCard
      entering={SlideInDown.springify().mass(1).damping(20).stiffness(200)}
      layout={LinearTransition.duration(300)}
      leftPos={leftPos}
      cardWidth={cardWidth}
      parentViewWidth={parentViewWidth}
      onRemove={onRemove ? () => onRemove(rollerEntry.uuid) : undefined}
      onLayout={(e) => {
        topPosRef.current = e.nativeEvent.layout.y;
        onLayout?.(e);
      }}
      {...props}
    >
      {rollEntry ? (
        <RollsTouchableCard
          rolls={[rollEntry]}
          result={rollEntry.value}
          scale={scale}
          cardWidth={cardWidth}
          cardRefWidth={cardRefWidth}
          leftPos={leftPos}
        />
      ) : (
        formulaEntry && (
          <FormulaTouchableCard
            key={`${formulaEntry.formula}-${formulaEntry.value}`}
            formulaEntry={formulaEntry}
            formulaTree={formulaTree}
            scale={scale}
            cardWidth={cardWidth}
            cardRefWidth={cardRefWidth}
            leftPos={leftPos}
            onPress={onPress}
            onLayout={(e) =>
              (cardRectRef.current = { ...e.nativeEvent.layout })
            }
          />
        )
      )}
    </SlidableCard>
  );
});

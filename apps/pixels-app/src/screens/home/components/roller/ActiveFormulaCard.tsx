import * as Haptics from "expo-haptics";
import React from "react";
import {
  LayoutRectangle,
  Pressable,
  StyleSheet,
  View,
  ViewProps,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { useTheme } from "react-native-paper";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormulaTouchableCard } from "./FormulaTouchableCard";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppStyles } from "~/app/styles";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  updateRollerActiveFormula,
  RollerEntryWithFormula,
  removeRollerActiveFormulaRoll,
} from "~/features/store";
import { useRollFormulaTree } from "~/hooks";

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

  const formulaTree = useRollFormulaTree(formulaEntry.formula);
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

  // Animate card position and width
  const [leftPos, setLeftPos] = React.useState(startRect.x);
  const [cardWidth, setCardWidth] = React.useState(startRect.width);
  React.useEffect(() => {
    setLeftPos(0);
    setCardWidth(parentViewSize.width);
  }, [parentViewSize.width]);

  const finalHeightRef = React.useRef<number>();
  const { bottom: paddingBottom } = useSafeAreaInsets();
  const animTop = useSharedValue(startRect.y);
  const keyboardOffset = useSharedValue(0);
  const keyboardVisible = useSharedValue(false);
  const animStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top:
      animTop.value +
      (keyboardVisible.value ? keyboardOffset.value : -paddingBottom),
  }));

  const [showEditor, setShowEditor] = React.useState(false);
  const onChange = (formula: string) => {
    appDispatch(updateRollerActiveFormula(formula));
  };

  React.useEffect(() => {
    // Crude way to move the card down when the keyboard is shown
    const showSubscription = Keyboard.addListener("keyboardWillShow", () => {
      keyboardVisible.value = true;
    });
    const showSubscription2 = Keyboard.addListener("keyboardDidShow", () => {
      keyboardVisible.value = true;
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisible.value = false;
    });
    return () => {
      showSubscription.remove();
      showSubscription2.remove();
      hideSubscription.remove();
    };
  }, [keyboardVisible]);

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
          onLayout={({ nativeEvent: { layout } }) => {
            if (finalHeightRef.current) {
              animTop.value = layout.height - finalHeightRef.current;
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
          formulaTree={formulaTree}
          scale={sizeRatio * parentViewSize.width}
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
          onKeyboardOffset={
            (offset) =>
              (keyboardOffset.value =
                offset - (Platform.OS === "ios" ? 110 : 0)) // Don't understand why this is needed
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

export function ActiveFormulaCard({
  layoutGetter,
  ...props
}: {
  layoutGetter: () => {
    containerSize?: { width: number; height: number };
    cardStartRect?: LayoutRectangle;
  };
  onClose: () => void;
} & Omit<ViewProps, "style">) {
  const formula = useAppSelector((state) => state.diceRoller.activeRollFormula);
  const { cardStartRect, containerSize } = layoutGetter();
  return (
    formula &&
    containerSize &&
    cardStartRect && (
      <OpenedFormulaCard
        formulaEntry={formula}
        sizeRatio={0.5}
        parentViewSize={containerSize}
        startRect={cardStartRect}
        {...props}
      />
    )
  );
}

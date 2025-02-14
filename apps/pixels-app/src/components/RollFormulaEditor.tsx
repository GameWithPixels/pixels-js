import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import {
  Text,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";

import { IntegerSelector } from "./IntegerSelector";
import { DieWireframe } from "./icons";

import { SliderWithValue } from "~/components/SliderWithValue";
import { ToggleButton } from "~/components/buttons";
import { AvailableDieType, AvailableDieTypeValues } from "~/features/dice";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  createRollFormula,
  getSimplifiedRollFormula,
  RollFormula,
  SimplifiedRollFormula,
} from "~/features/rollFormula";

export function DieTypeButton({
  dieType,
  iconSize,
  style,
  contentStyle,
  ...props
}: {
  dieType: AvailableDieType;
  iconSize: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
} & Omit<TouchableRippleProps, "children" | "style">) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[colors.primary, colors.tertiary]}
      style={[
        {
          borderWidth: 1,
          borderRadius,
          borderColor: colors.outline,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <TouchableRipple
        style={[
          {
            margin: 2,
            padding: 10,
            borderRadius: borderRadius - 2,
            backgroundColor: colors.surface,
          },
          contentStyle,
        ]}
        {...props}
      >
        <DieWireframe dieType={dieType} size={iconSize} />
      </TouchableRipple>
    </LinearGradient>
  );
}

export function RollFormulaEditor({
  formula,
  onFormulaChange,
}: {
  formula: RollFormula;
  onFormulaChange: (formula: RollFormula) => void;
}) {
  const simpleFormula = React.useMemo(
    () => getSimplifiedRollFormula(formula),
    [formula]
  ) ?? { dieType: "d20", dieCount: 1, constant: 0 };

  const { dieType, dieCount, constant } = simpleFormula;
  const modifier = simpleFormula.modifier;
  const bonus = simpleFormula.bonus;
  const setDieType = (dieType: AvailableDieType) =>
    onFormulaChange(createRollFormula({ ...simpleFormula, dieType }));
  const setDieCount = (dieCount: number) =>
    onFormulaChange(
      createRollFormula({
        ...simpleFormula,
        dieCount,
        modifier: undefined,
      })
    );
  const setConstant = (constant: number) =>
    onFormulaChange(createRollFormula({ ...simpleFormula, constant }));
  const setModifier = (modifier: SimplifiedRollFormula["modifier"]) =>
    onFormulaChange(
      createRollFormula({ ...simpleFormula, dieCount: 2, modifier })
    );
  const setBonus = (bonus: SimplifiedRollFormula["bonus"]) =>
    onFormulaChange(createRollFormula({ ...simpleFormula, bonus }));

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View style={{ width: "100%", paddingHorizontal: 10, gap: 5 }}>
      <Text variant="titleMedium">Die Type</Text>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {AvailableDieTypeValues.map((dt) => (
          <TouchableRipple
            key={dt}
            borderless
            style={{
              width: `${95 / AvailableDieTypeValues.length}%`,
              aspectRatio: 1,
              padding: 2,
              borderRadius,
              borderWidth: 1,
              borderColor: dieType === dt ? colors.primary : colors.background,
            }}
            onPress={() => setDieType(dt)}
          >
            <DieWireframe
              dieType={dt}
              size={0}
              style={{ width: "100%", height: "100%" }}
            />
          </TouchableRipple>
        ))}
      </View>
      <Text variant="titleMedium">Dice Count</Text>
      <IntegerSelector
        value={dieCount}
        onValueChange={setDieCount}
        minimumValue={1}
        maximumValue={20}
        buttonsStartValue={1}
        buttonsEndValue={4}
      />
      <Text variant="titleMedium">Constant</Text>
      <SliderWithValue
        value={constant}
        minimumValue={-10}
        maximumValue={10}
        step={1}
        onEndEditing={setConstant}
      />
      <Text variant="titleMedium">Modifier</Text>
      <ScrollView
        horizontal
        contentContainerStyle={{
          flexDirection: "row",
          marginBottom: 5,
          gap: 10,
        }}
      >
        <ToggleButton
          compact
          selected={modifier === "advantage"}
          onPress={() =>
            setModifier(modifier !== "advantage" ? "advantage" : undefined)
          }
        >
          Advantage
        </ToggleButton>
        <ToggleButton
          compact
          selected={modifier === "disadvantage"}
          onPress={() =>
            setModifier(
              modifier !== "disadvantage" ? "disadvantage" : undefined
            )
          }
        >
          Disadvantage
        </ToggleButton>
        <ToggleButton
          compact
          selected={bonus === "guidance"}
          onPress={() =>
            setBonus(bonus !== "guidance" ? "guidance" : undefined)
          }
        >
          Guidance
        </ToggleButton>
      </ScrollView>
    </View>
  );
}

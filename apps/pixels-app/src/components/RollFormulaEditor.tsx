import React from "react";
import { ScrollView, View } from "react-native";
import { Text, TextInput, TouchableRipple, useTheme } from "react-native-paper";

import { IntegerSelector } from "./IntegerSelector";
import { TabsHeaders } from "./TabsHeaders";
import { DieWireframe } from "./icons";

import { SliderWithValue } from "~/components/SliderWithValue";
import { ToggleButton } from "~/components/buttons";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  getSimplifiedRollFormula,
  RollDieType,
  RollDieTypeValues,
  RollFormulaTree,
  simplifiedFormulaToString,
  SimplifiedRollFormula,
} from "~/features/rollFormula";

const formulaEditModes = ["Simplified", "Textual"] as const;
const RollDieTypeArray = Object.keys(RollDieTypeValues) as RollDieType[];

export function RollFormulaEditor({
  formula,
  formulaTree,
  onRollFormulaChange,
  onKeyboardOffset,
}: {
  formula: string;
  formulaTree?: Readonly<RollFormulaTree>;
  onRollFormulaChange?: (formula: string) => void;
  onKeyboardOffset?: (offset: number) => void;
}) {
  const simpleFormulaOpt = React.useMemo(
    () => formulaTree && getSimplifiedRollFormula(formulaTree),
    [formulaTree]
  );
  const simpleFormula = simpleFormulaOpt ?? {
    dieType: "d20",
    dieCount: 1,
    constant: 0,
  };

  const { dieType, dieCount, constant, modifier, bonus } = simpleFormula;
  const update = (f: Readonly<SimplifiedRollFormula>) =>
    onRollFormulaChange?.(simplifiedFormulaToString(f));
  const setDieType = (dieType: RollDieType) =>
    update({ ...simpleFormula, dieType });
  const setDieCount = (dieCount: number) =>
    update({
      ...simpleFormula,
      dieCount,
      modifier: undefined,
    });
  const setConstant = (constant: number) =>
    update({ ...simpleFormula, constant });
  const setModifier = (modifier: SimplifiedRollFormula["modifier"]) =>
    update({
      ...simpleFormula,
      dieCount: modifier ? 2 : 1,
      modifier,
    });
  const setBonus = (bonus: SimplifiedRollFormula["bonus"]) =>
    update({ ...simpleFormula, bonus });

  const [editMode, setEditMode] = React.useState(
    formulaEditModes[simpleFormulaOpt ? 0 : 1]
  );

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View style={{ width: "100%", paddingHorizontal: 10, gap: 5 }}>
      <TabsHeaders
        keys={formulaEditModes}
        selected={editMode}
        onSelect={setEditMode}
      />
      {editMode === "Simplified" ? (
        <>
          <Text variant="titleMedium">Die Type</Text>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {RollDieTypeArray.map((dt) => (
              <TouchableRipple
                key={dt}
                borderless
                style={{
                  width: `${95 / RollDieTypeArray.length}%`,
                  aspectRatio: 1,
                  padding: 2,
                  borderRadius,
                  borderWidth: 1,
                  borderColor:
                    dieType === dt ? colors.primary : colors.background,
                }}
                onPress={() => setDieType(dt)}
              >
                {dt !== "d100" ? (
                  <DieWireframe
                    dieType={dt}
                    size={0}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                    }}
                  >
                    <DieWireframe
                      dieType="d00"
                      size={0}
                      style={{ width: "75%", height: "75%" }}
                    />
                    <DieWireframe
                      dieType="d10"
                      size={0}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        width: "75%",
                        height: "75%",
                      }}
                    />
                  </View>
                )}
              </TouchableRipple>
            ))}
          </View>
          <Text variant="titleMedium">Dice Count</Text>
          <IntegerSelector
            value={dieCount}
            onValueChange={setDieCount}
            minimumValue={1}
            maximumValue={10}
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
        </>
      ) : (
        <View style={{ marginHorizontal: 10, gap: 5 }}>
          <Text variant="titleMedium">Roll Formula</Text>
          <TextInput value={formula} onChangeText={onRollFormulaChange} />
          <View
            onLayout={({ nativeEvent: { layout } }) => {
              // Crude way to estimate by how much to shift the view when showing the keyboard
              onKeyboardOffset?.(layout.height);
            }}
          >
            <Text variant="titleMedium" style={{ marginTop: 20 }}>
              Cheat Sheet
            </Text>
            <View style={{ padding: 10, gap: 5 }}>
              <Text>kh: Keep highest</Text>
              <Text>kl: Keep lowest</Text>
              <Text>dh: Drop highest</Text>
              <Text>dl: Drop lowest</Text>
              <Text>{"{}"}: Modifier group</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

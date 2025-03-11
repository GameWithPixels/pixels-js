import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView } from "react-native";
import { Divider, useTheme } from "react-native-paper";
import {
  Easing,
  LinearTransition,
  SlideInRight,
} from "react-native-reanimated";

import { AnimatedRolledDie } from "./AnimatedRolledDie";
import {
  RollCardCommonProps,
  RollTouchableCard,
  useNewArrayItems,
} from "./RollTouchableCard";

import { RollFormulaEditor } from "~/components/RollFormulaEditor";
import { parseRollFormula } from "~/features/rollFormula";
import { RollerEntryWithFormula } from "~/features/store";

export function FormulaTouchableCard({
  formulaEntry,
  onRollFormulaChange,
  ...props
}: {
  formulaEntry: Readonly<RollerEntryWithFormula>;
  onRollFormulaChange?: (formula: string) => void;
} & RollCardCommonProps) {
  const {
    formula,
    rolls: allRolls,
    value,
    droppedRolls: droppedIndices,
    unusedRolls: unusedIndices,
  } = formulaEntry;

  const formulaTree = React.useMemo(() => {
    try {
      return parseRollFormula(formula);
    } catch (e) {
      console.log("Error parsing formula:" + e);
    }
  }, [formula]);

  const newRolls = useNewArrayItems(allRolls);
  const { rolls, droppedRolls, unusedRolls } = React.useMemo(() => {
    const droppedRolls =
      droppedIndices && allRolls.filter((_, i) => droppedIndices.includes(i));
    return unusedIndices
      ? {
          rolls: allRolls.filter((_, i) => !unusedIndices.includes(i)),
          droppedRolls,
          unusedRolls: allRolls.filter((_, i) => unusedIndices.includes(i)),
        }
      : { rolls: [...allRolls], droppedRolls };
  }, [allRolls, droppedIndices, unusedIndices]);

  const { colors } = useTheme();
  return (
    <RollTouchableCard
      title={formula}
      formulaTree={formulaTree}
      rolls={rolls}
      droppedRolls={droppedRolls}
      value={value}
      {...props}
    >
      {onRollFormulaChange && (
        <>
          {!!unusedRolls?.length && (
            <ScrollView
              horizontal
              style={{ width: "100%", marginTop: 10 }}
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 10,
                gap: 5,
              }}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={30}
                color={colors.onSurfaceDisabled}
              />
              {unusedRolls.map((roll, i) => (
                <AnimatedRolledDie
                  key={`${roll.pixelId}-${roll.timestamp}`}
                  dieType={roll.dieType}
                  value={roll.value}
                  entering={
                    !newRolls.includes(roll)
                      ? undefined
                      : SlideInRight.springify()
                          .mass(1)
                          .damping(20)
                          .stiffness(200)
                  }
                  layout={LinearTransition.easing(Easing.ease)}
                  size={30}
                  style={{ zIndex: i ? undefined : 1 }} // First on top so it's visible when sliding in
                />
              ))}
            </ScrollView>
          )}
          <Divider
            style={{ width: "95%", marginVertical: 10, alignSelf: "center" }}
          />
          <RollFormulaEditor
            formula={formula}
            formulaTree={formulaTree}
            onRollFormulaChange={onRollFormulaChange}
          />
        </>
      )}
    </RollTouchableCard>
  );
}

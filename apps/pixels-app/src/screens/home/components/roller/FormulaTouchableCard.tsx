import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView } from "react-native";
import { Divider, useTheme } from "react-native-paper";
import {
  Easing,
  LayoutAnimationConfig,
  LinearTransition,
  SlideInRight,
} from "react-native-reanimated";

import { AnimatedRolledDie } from "./AnimatedRolledDie";
import { RollCardCommonProps, RollsTouchableCard } from "./RollsTouchableCard";

import { RollFormulaEditor } from "~/components/RollFormulaEditor";
import { RollFormulaTree } from "~/features/rollFormula";
import { RollerEntryWithFormula } from "~/features/store";
import { useIsMounted } from "~/hooks";

export function FormulaTouchableCard({
  formulaEntry,
  formulaTree,
  onRollFormulaChange,
  onKeyboardOffset,
  ...props
}: {
  formulaEntry: Readonly<RollerEntryWithFormula>;
  formulaTree?: Readonly<RollFormulaTree>;
  onRollFormulaChange?: (formula: string) => void;
  onKeyboardOffset?: (offset: number) => void;
} & RollCardCommonProps) {
  const {
    formula,
    rolls: allRolls,
    value,
    droppedRolls: droppedIndices,
    unusedRolls: unusedIndices,
  } = formulaEntry;

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

  const isMounted = useIsMounted();
  const { colors } = useTheme();
  return (
    <RollsTouchableCard
      title={formula}
      formulaTree={formulaTree ?? "invalid"}
      rolls={rolls}
      droppedRolls={droppedRolls}
      result={value}
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
              <LayoutAnimationConfig skipEntering={!isMounted}>
                {unusedRolls.map((roll, i) => (
                  <AnimatedRolledDie
                    key={`${roll.pixelId}-${roll.timestamp}`}
                    dieType={roll.dieType}
                    value={roll.value}
                    entering={SlideInRight.springify()
                      .mass(1)
                      .damping(20)
                      .stiffness(200)}
                    layout={LinearTransition.easing(Easing.ease)}
                    size={30}
                    style={{ zIndex: i ? undefined : 1 }} // First on top so it's visible when sliding in
                  />
                ))}
              </LayoutAnimationConfig>
            </ScrollView>
          )}
          <Divider
            style={{ width: "95%", marginVertical: 10, alignSelf: "center" }}
          />
          <RollFormulaEditor
            formula={formula}
            formulaTree={formulaTree}
            onRollFormulaChange={onRollFormulaChange}
            onKeyboardOffset={onKeyboardOffset}
          />
        </>
      )}
    </RollsTouchableCard>
  );
}

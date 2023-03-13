import {
  ConditionTypeValues,
  EditCondition,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionCrooked,
  EditConditionFaceCompare,
  EditConditionHandling,
  EditConditionHelloGoodbye,
  EditConditionIdle,
  EditConditionRolling,
  getEditWidgetsData,
} from "@systemic-games/pixels-edit-animation";
import { FastBox } from "@systemic-games/react-native-base-components";
import { View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";

import { getConditionTitle } from "../titlesUtils";
import { RenderWidget } from "./RenderWidget";
import { RuleConditionSelection } from "./RuleComparisonWidget";

interface ConditionEditorProps {
  editCondition: EditCondition;
}

function ConditionEditor({ editCondition }: ConditionEditorProps) {
  const conditionWidgets = React.useMemo(() => {
    return getEditWidgetsData(editCondition);
  }, [editCondition]);
  return (
    <View mt={2} p={2} bg="gray.700" rounded="md">
      {conditionWidgets.map((widget, i) => (
        <FastBox key={i} pt={i > 0 ? 2 : 0}>
          <RenderWidget widget={widget} />
        </FastBox>
      ))}
    </View>
  );
}

export interface RuleConditionWidgetProps extends IViewProps {
  condition: EditCondition;
  setCondition: (condition: EditCondition) => void;
}

export function RuleConditionWidget({
  condition,
  setCondition,
  ...flexProps
}: RuleConditionWidgetProps) {
  const title = React.useMemo(
    () => getConditionTitle(condition.type),
    [condition.type]
  );
  const conditions = React.useMemo(
    () => [
      {
        label: getConditionTitle(ConditionTypeValues.faceCompare),
        onSelect: () => setCondition(new EditConditionFaceCompare()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.helloGoodbye),
        onSelect: () => setCondition(new EditConditionHelloGoodbye()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.handling),
        onSelect: () => setCondition(new EditConditionHandling()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.rolling),
        onSelect: () => setCondition(new EditConditionRolling()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.crooked),
        onSelect: () => setCondition(new EditConditionCrooked()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.connectionState),
        onSelect: () => setCondition(new EditConditionConnectionState()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.batteryState),
        onSelect: () => setCondition(new EditConditionBatteryState()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.idle),
        onSelect: () => setCondition(new EditConditionIdle()),
      },
    ],
    [setCondition]
  );
  return (
    <View
      p={3}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
      {...flexProps}
    >
      <RuleConditionSelection title={title} conditions={conditions} />
      <ConditionEditor editCondition={condition} />
    </View>
  );
}

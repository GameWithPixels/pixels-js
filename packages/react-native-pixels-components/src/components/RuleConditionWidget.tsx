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

export interface RuleConditionWidgetProps extends React.PropsWithChildren {
  condition: EditCondition;
  setCondition: (condition: EditCondition) => void;
}

export function RuleConditionWidget(props: RuleConditionWidgetProps) {
  return (
    <View
      p={3}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
    >
      <RuleConditionSelection
        conditionTitle={getConditionTitle(props.condition.type)}
        possibleConditions={[
          {
            label: getConditionTitle(ConditionTypeValues.faceCompare),
            onSelect: () => props.setCondition(new EditConditionFaceCompare()),
          },
          {
            label: getConditionTitle(ConditionTypeValues.helloGoodbye),
            onSelect: () => props.setCondition(new EditConditionHelloGoodbye()),
          },
          {
            label: getConditionTitle(ConditionTypeValues.handling),
            onSelect: () => props.setCondition(new EditConditionHandling()),
          },
          {
            label: getConditionTitle(ConditionTypeValues.rolling),
            onSelect: () => props.setCondition(new EditConditionRolling()),
          },
          {
            label: getConditionTitle(ConditionTypeValues.crooked),
            onSelect: () => props.setCondition(new EditConditionCrooked()),
          },
          {
            label: getConditionTitle(ConditionTypeValues.connectionState),
            onSelect: () =>
              props.setCondition(new EditConditionConnectionState()),
          },
          {
            label: getConditionTitle(ConditionTypeValues.batteryState),
            onSelect: () => props.setCondition(new EditConditionBatteryState()),
          },
          {
            label: getConditionTitle(ConditionTypeValues.idle),
            onSelect: () => props.setCondition(new EditConditionIdle()),
          },
        ]}
      />
      <ConditionEditor editCondition={props.condition} />
    </View>
  );
}

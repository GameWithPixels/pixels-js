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
import { Box, HStack, VStack } from "native-base";
import React from "react";

import { getConditionSimpleTitle } from "../titlesUtils";
import { RenderWidget } from "./RenderWidget";
import { RuleConditionSelection } from "./RuleComparisonWidget";

function ConditionEditor({ editCondition }: { editCondition: EditCondition }) {
  const conditionWidgets = React.useMemo(() => {
    return getEditWidgetsData(editCondition);
  }, [editCondition]);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {conditionWidgets.map((widget, key) => (
        <RenderWidget key={key} widget={widget} />
      ))}
    </VStack>
  );
}

export interface RuleConditionWidgetProps extends React.PropsWithChildren {
  condition: EditCondition;
  setCondition: (condition: EditCondition) => void;
}

export function RuleConditionWidget(props: RuleConditionWidgetProps) {
  const conditionTitle = React.useMemo(
    () => getConditionSimpleTitle(props.condition.type),
    [props.condition.type]
  );
  return (
    <VStack
      space={2}
      p={4}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
    >
      <HStack space={2} width="100%" alignItems="center">
        <Box flex={10} w="100%">
          <RuleConditionSelection
            conditionTitle={conditionTitle}
            possibleConditions={[
              {
                label: getConditionSimpleTitle(ConditionTypeValues.faceCompare),
                onPress: () =>
                  props.setCondition(new EditConditionFaceCompare()),
              },
              {
                label: getConditionSimpleTitle(
                  ConditionTypeValues.helloGoodbye
                ),
                onPress: () =>
                  props.setCondition(new EditConditionHelloGoodbye()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.handling),
                onPress: () => props.setCondition(new EditConditionHandling()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.rolling),
                onPress: () => props.setCondition(new EditConditionRolling()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.crooked),
                onPress: () => props.setCondition(new EditConditionCrooked()),
              },
              {
                label: getConditionSimpleTitle(
                  ConditionTypeValues.connectionState
                ),
                onPress: () =>
                  props.setCondition(new EditConditionConnectionState()),
              },
              {
                label: getConditionSimpleTitle(
                  ConditionTypeValues.batteryState
                ),
                onPress: () =>
                  props.setCondition(new EditConditionBatteryState()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.idle),
                onPress: () => props.setCondition(new EditConditionIdle()),
              },
            ]}
          />
        </Box>
      </HStack>
      <ConditionEditor editCondition={props.condition} />
    </VStack>
  );
}

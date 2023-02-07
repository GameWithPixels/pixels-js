import {
  ActionTypeValues,
  EditAction,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditAnimation,
  getEditWidgetsData,
} from "@systemic-games/pixels-edit-animation";
import { Box, Button, HStack, Text, VStack } from "native-base";
import React from "react";

import { RenderWidget } from "./RenderWidget";
import { RuleActionSelection } from "./RuleComparisonWidget";

function ActionEditor({
  editAction,
  animations,
  dieRenderer,
}: {
  editAction: EditAction;
  animations: EditAnimation[];
  dieRenderer?: (anim: EditAnimation) => React.ReactNode;
}) {
  const actionWIdgets = React.useMemo(() => {
    return getEditWidgetsData(editAction);
  }, [editAction]);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {actionWIdgets.map((widget, key) => (
        <RenderWidget
          key={key}
          widget={widget}
          animationsParams={{
            animations,
            dieRenderer,
          }}
        />
      ))}
    </VStack>
  );
}

export interface RuleActionWidgetProps extends React.PropsWithChildren {
  action: EditAction;
  animations: EditAnimation[];
  dieRenderer?: (anim: EditAnimation) => React.ReactNode;
  onDelete?: (() => void) | null | undefined;
}

/**
 * Widget for selecting a type of action to execute in a rule.
 * @param props See {@link RuleActionWidgetProps} for props params.
 */
export function RuleActionWidget({
  action,
  animations,
  dieRenderer,
  onDelete,
}: RuleActionWidgetProps) {
  const [editAction, setEditAction] = React.useState(action);
  const [actionTitle, setActionTitle] = React.useState(() =>
    action.type === ActionTypeValues.playAnimation
      ? "Trigger pattern"
      : "Play audio clip"
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
          <RuleActionSelection
            actionTitle={actionTitle}
            possibleActions={[
              {
                label: "Trigger Pattern",
                onPress: () => {
                  setActionTitle("Trigger Pattern");
                  setEditAction(new EditActionPlayAnimation());
                },
              },
              {
                label: "Play Audio Clip",
                onPress: () => {
                  setActionTitle("Play Audio Clip");
                  setEditAction(new EditActionPlayAudioClip());
                },
              },
            ]}
          />
        </Box>
        <Button onPress={onDelete} flex={1}>
          <Text fontSize="xl">X</Text>
        </Button>
      </HStack>
      <ActionEditor
        editAction={editAction}
        animations={animations}
        dieRenderer={dieRenderer}
      />
    </VStack>
  );
}

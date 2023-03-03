import {
  RemoteActionTypeValues,
  ActionTypeValues,
  EditAction,
  EditActionMakeWebRequest,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditAnimation,
  getEditWidgetsData,
  EditActionRunOnDevice,
} from "@systemic-games/pixels-edit-animation";
import { Box, Button, HStack, Text, VStack } from "native-base";
import React from "react";

import { getActionTitle } from "../titlesUtils";
import { RenderWidget, RenderWidgetProps } from "./RenderWidget";
import { RuleActionSelection } from "./RuleComparisonWidget";

function ActionEditor({
  editAction,
  animations,
  userTextsParams,
  dieRenderer,
}: {
  editAction: EditAction;
  animations: Readonly<EditAnimation>[];
  userTextsParams: RenderWidgetProps["userTextsParams"];
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
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
          userTextsParams={userTextsParams}
        />
      ))}
    </VStack>
  );
}

export interface RuleActionWidgetProps extends React.PropsWithChildren {
  action: EditAction;
  animations: Readonly<EditAnimation>[];
  userTextsParams: RenderWidgetProps["userTextsParams"];
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  onReplace?: ((action: EditAction) => void) | null | undefined;
  onDelete?: (() => void) | null | undefined;
}

/**
 * Widget for selecting a type of action to execute in a rule.
 * @param props See {@link RuleActionWidgetProps} for props params.
 */
export function RuleActionWidget({
  action,
  animations,
  userTextsParams,
  dieRenderer,
  onReplace,
  onDelete,
}: RuleActionWidgetProps) {
  const [editAction, setEditAction] = React.useState(action);
  const actionTitle = React.useMemo(
    () =>
      getActionTitle(
        editAction.type,
        editAction instanceof EditActionRunOnDevice
          ? editAction.remoteType
          : undefined
      ),
    [editAction]
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
                label: getActionTitle(ActionTypeValues.playAnimation),
                onSelect: () => {
                  const act = new EditActionPlayAnimation();
                  setEditAction(act);
                  onReplace?.(act);
                },
              },
              {
                label: getActionTitle(
                  ActionTypeValues.runOnDevice,
                  RemoteActionTypeValues.playAudioClip
                ),
                onSelect: () => {
                  const act = new EditActionPlayAudioClip();
                  setEditAction(act);
                  onReplace?.(act);
                },
              },
              {
                label: getActionTitle(
                  ActionTypeValues.runOnDevice,
                  RemoteActionTypeValues.makeWebRequest
                ),
                onSelect: () => {
                  const act = new EditActionMakeWebRequest();
                  setEditAction(act);
                  onReplace?.(act);
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
        userTextsParams={userTextsParams}
        dieRenderer={dieRenderer}
      />
    </VStack>
  );
}

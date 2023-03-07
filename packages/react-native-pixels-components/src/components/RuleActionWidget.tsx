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
import {
  FastBox,
  FastButton,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import { Box, IFlexProps, View } from "native-base";
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
  const actionWidgets = React.useMemo(() => {
    return getEditWidgetsData(editAction);
  }, [editAction]);
  const widgets = React.useMemo(
    () =>
      actionWidgets.map((widget, i) => (
        <FastBox key={i} mt={i > 0 ? 2 : 0}>
          <RenderWidget
            widget={widget}
            animationsParams={{
              animations,
              dieRenderer,
            }}
            userTextsParams={userTextsParams}
          />
        </FastBox>
      )),
    [actionWidgets, animations, dieRenderer, userTextsParams]
  );
  return (
    <View p={2} bg="gray.700" rounded="md">
      {widgets}
    </View>
  );
}

export interface RuleActionWidgetProps extends IFlexProps {
  action: EditAction;
  animations: Readonly<EditAnimation>[];
  userTextsParams: RenderWidgetProps["userTextsParams"];
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  onReplace?: ((newAction: EditAction) => void) | null | undefined;
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
  ...flexProps
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
  const possibleActions = React.useMemo(
    () => [
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
    ],
    [onReplace]
  );
  const onDeleteMemo = React.useCallback(() => onDelete?.(), [onDelete]);
  return (
    <Box
      p={3}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
      {...flexProps}
    >
      <FastHStack mb={2} w="100%" alignItems="center">
        <FastBox flex={10} w="100%">
          <RuleActionSelection
            actionTitle={actionTitle}
            possibleActions={possibleActions}
          />
        </FastBox>
        <FastButton
          ml={2}
          onPress={onDeleteMemo}
          flex={1}
          _text={{ fontSize: "xs", bold: true }}
        >
          X
        </FastButton>
      </FastHStack>
      <ActionEditor
        editAction={editAction}
        animations={animations}
        userTextsParams={userTextsParams}
        dieRenderer={dieRenderer}
      />
    </Box>
  );
}

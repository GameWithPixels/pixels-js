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
import { View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";

import { getActionTitle } from "../titlesUtils";
import { RenderWidget, RenderWidgetProps } from "./RenderWidget";
import { RuleActionSelection } from "./RuleComparisonWidget";

interface ActionEditorProps extends IViewProps {
  editAction: EditAction;
  animations: Readonly<EditAnimation>[];
  userTextsParams: RenderWidgetProps["userTextsParams"];
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
}

function ActionEditor({
  editAction,
  animations,
  userTextsParams,
  dieRenderer,
  ...flexProps
}: ActionEditorProps) {
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
    <View p={2} bg="gray.700" rounded="md" {...flexProps}>
      {widgets}
    </View>
  );
}

export interface RuleActionWidgetProps extends IViewProps {
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
  const actions = React.useMemo(
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
    <View
      p={3}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
      {...flexProps}
    >
      <FastHStack w="100%" alignItems="center">
        <RuleActionSelection
          flex={10}
          w="100%"
          title={actionTitle}
          actions={actions}
        />
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
        mt={2}
        editAction={editAction}
        animations={animations}
        userTextsParams={userTextsParams}
        dieRenderer={dieRenderer}
      />
    </View>
  );
}

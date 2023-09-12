import {
  EditAction,
  EditActionMakeWebRequest,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditAnimation,
  getEditWidgetsData,
  EditActionRunOnDevice,
} from "@systemic-games/pixels-edit-animation";
import {
  BaseBoxProps,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import {
  createWidgetComponent,
  CreateWidgetComponentOptionals,
  getActionTitle,
  RuleActionSelector,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import React from "react";

import { IconButton } from "~/components/IconButton";
import { makeObservable } from "~/features/makeObservable";

const ObservableActionSelector = observer(function ({
  observableAction,
  onReplace,
}: Pick<ObservableActionEditorProps, "observableAction" | "onReplace">) {
  const remoteType =
    observableAction instanceof EditActionRunOnDevice
      ? observableAction.remoteType
      : undefined;
  const actionTitle = React.useMemo(
    () => getActionTitle(observableAction.type, remoteType),
    [observableAction.type, remoteType]
  );

  const actions = React.useMemo(
    () => [
      {
        label: getActionTitle("playAnimation"),
        onSelect: () =>
          onReplace?.(makeObservable(new EditActionPlayAnimation())),
      },
      {
        label: getActionTitle("runOnDevice", "playAudioClip"),
        onSelect: () =>
          onReplace?.(makeObservable(new EditActionPlayAudioClip())),
      },
      {
        label: getActionTitle("runOnDevice", "makeWebRequest"),
        onSelect: () =>
          onReplace?.(makeObservable(new EditActionMakeWebRequest())),
      },
    ],
    [onReplace]
  );

  return <RuleActionSelector flex={1} title={actionTitle} actions={actions} />;
});

export interface ObservableActionEditorProps extends BaseBoxProps {
  observableAction: EditAction;
  animations: Readonly<EditAnimation>[];
  userTextsParams: CreateWidgetComponentOptionals["userTextsParams"];
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  onReplace?: (newAction: EditAction) => void;
  onDelete?: () => void;
}

// Only children components are observers
export function ObservableActionEditor({
  observableAction,
  animations,
  userTextsParams,
  dieRenderer,
  onReplace,
  onDelete,
  ...flexProps
}: ObservableActionEditorProps) {
  const actionWidgets = React.useMemo(() => {
    return getEditWidgetsData(observableAction);
  }, [observableAction]);
  const animationsParams = React.useMemo(
    () => ({
      animations,
      dieRenderer,
    }),
    [animations, dieRenderer]
  );
  const widgets = React.useMemo(
    () =>
      actionWidgets.map((widget, i) => {
        const Widget = createWidgetComponent(widget, {
          animationsParams,
          userTextsParams,
        });
        return <Widget key={i} mt={i > 0 ? 2 : 0} />;
      }),
    [actionWidgets, animationsParams, userTextsParams]
  );
  return (
    <BaseVStack {...flexProps}>
      <BaseHStack w="100%" alignItems="center" justifyContent="space-between">
        <ObservableActionSelector
          observableAction={observableAction}
          onReplace={onReplace}
        />
        <IconButton icon="delete" onPress={onDelete} />
      </BaseHStack>
      {widgets}
    </BaseVStack>
  );
}

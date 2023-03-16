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
  FastButton,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import {
  createWidgetComponent,
  CreateWidgetComponentOptionals,
  getActionTitle,
  RuleActionSelector,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import { View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";

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
        label: getActionTitle(ActionTypeValues.playAnimation),
        onSelect: () => onReplace?.(new EditActionPlayAnimation()),
      },
      {
        label: getActionTitle(
          ActionTypeValues.runOnDevice,
          RemoteActionTypeValues.playAudioClip
        ),
        onSelect: () => onReplace?.(new EditActionPlayAudioClip()),
      },
      {
        label: getActionTitle(
          ActionTypeValues.runOnDevice,
          RemoteActionTypeValues.makeWebRequest
        ),
        onSelect: () => onReplace?.(new EditActionMakeWebRequest()),
      },
    ],
    [onReplace]
  );

  return (
    <RuleActionSelector
      flex={10}
      w="100%"
      title={actionTitle}
      actions={actions}
    />
  );
});

export interface ObservableActionEditorProps extends IViewProps {
  observableAction: EditAction;
  animations: Readonly<EditAnimation>[];
  userTextsParams: CreateWidgetComponentOptionals["userTextsParams"];
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  onReplace?: ((newAction: EditAction) => void) | null | undefined;
  onDelete?: (() => void) | null | undefined;
}

// Only children components are observers
export default function ({
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
    <View
      p={3}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
      {...flexProps}
    >
      <FastHStack w="100%" alignItems="center">
        <ObservableActionSelector
          observableAction={observableAction}
          onReplace={onReplace}
        />
        <FastButton ml={2} onPress={onDelete} flex={1} _text={textStyle}>
          X
        </FastButton>
      </FastHStack>
      <View mt={2} p={2} bg="gray.700" rounded="md">
        {widgets}
      </View>
    </View>
  );
}

const textStyle = { fontSize: "xs", bold: true };

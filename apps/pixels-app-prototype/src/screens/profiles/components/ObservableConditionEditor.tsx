import {
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionCrooked,
  EditConditionFaceCompare,
  EditConditionHandling,
  EditConditionHelloGoodbye,
  EditConditionIdle,
  EditConditionRolling,
  EditRule,
  EditWidgetData,
  getEditWidgetsData,
} from "@systemic-games/pixels-edit-animation";
import {
  BaseBox,
  BaseFlexProps,
} from "@systemic-games/react-native-base-components";
import {
  RuleConditionSelector,
  getConditionTitle,
  createWidgetComponent,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import React from "react";
import { FlatList } from "react-native";

import { AppStyles } from "~/AppStyles";

const ObservableConditionSelection = observer(function ({
  observableRule,
}: {
  observableRule: EditRule;
}) {
  const label = React.useMemo(
    () => getConditionTitle(observableRule.condition.type),
    [observableRule.condition.type]
  );
  const conditions = React.useMemo(
    () => [
      {
        label: getConditionTitle("rolled"),
        onSelect: () => {
          observableRule.condition = new EditConditionFaceCompare();
        },
      },
      {
        label: getConditionTitle("helloGoodbye"),
        onSelect: () => {
          observableRule.condition = new EditConditionHelloGoodbye();
        },
      },
      {
        label: getConditionTitle("handling"),
        onSelect: () => {
          observableRule.condition = new EditConditionHandling();
        },
      },
      {
        label: getConditionTitle("rolling"),
        onSelect: () => {
          observableRule.condition = new EditConditionRolling();
        },
      },
      {
        label: getConditionTitle("crooked"),
        onSelect: () => {
          observableRule.condition = new EditConditionCrooked();
        },
      },
      {
        label: getConditionTitle("connection"),
        onSelect: () => {
          observableRule.condition = new EditConditionConnectionState();
        },
      },
      {
        label: getConditionTitle("battery"),
        onSelect: () => {
          observableRule.condition = new EditConditionBatteryState();
        },
      },
      {
        label: getConditionTitle("idle"),
        onSelect: () => {
          observableRule.condition = new EditConditionIdle();
        },
      },
    ],
    [observableRule]
  );

  return <RuleConditionSelector label={label} conditions={conditions} />;
});

const ObservableCondition = observer(function ({
  observableRule,
}: {
  observableRule: EditRule;
}) {
  const conditionWidgets = React.useMemo(() => {
    return getEditWidgetsData(observableRule.condition);
  }, [observableRule.condition]);
  const renderItem = React.useCallback(
    ({ item: widgetData }: { item: EditWidgetData }) => {
      const Widget = createWidgetComponent(widgetData);
      return <Widget />;
    },
    []
  );
  return (
    <FlatList
      style={AppStyles.fullWidth}
      contentContainerStyle={AppStyles.listContentContainer}
      data={conditionWidgets}
      renderItem={renderItem}
    />
  );
});

// Only children components are observers
export function ObservableConditionEditor({
  observableRule,
  ...flexProps
}: {
  observableRule: EditRule;
} & BaseFlexProps) {
  return (
    <BaseBox {...flexProps}>
      <ObservableConditionSelection observableRule={observableRule} />
      <ObservableCondition observableRule={observableRule} />
    </BaseBox>
  );
}

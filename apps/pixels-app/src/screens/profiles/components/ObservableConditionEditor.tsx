import {
  ConditionTypeValues,
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
import { FastBox } from "@systemic-games/react-native-base-components";
import {
  RuleConditionSelector,
  getConditionTitle,
  createWidgetComponent,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import { FlatList, View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";

const ObservableConditionSelection = observer(function ({
  observableRule,
}: {
  observableRule: EditRule;
}) {
  const title = React.useMemo(
    () => getConditionTitle(observableRule.condition.type),
    [observableRule.condition.type]
  );
  const conditions = React.useMemo(
    () => [
      {
        label: getConditionTitle(ConditionTypeValues.faceCompare),
        onSelect: () =>
          (observableRule.condition = new EditConditionFaceCompare()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.helloGoodbye),
        onSelect: () =>
          (observableRule.condition = new EditConditionHelloGoodbye()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.handling),
        onSelect: () =>
          (observableRule.condition = new EditConditionHandling()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.rolling),
        onSelect: () => (observableRule.condition = new EditConditionRolling()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.crooked),
        onSelect: () => (observableRule.condition = new EditConditionCrooked()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.connectionState),
        onSelect: () =>
          (observableRule.condition = new EditConditionConnectionState()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.batteryState),
        onSelect: () =>
          (observableRule.condition = new EditConditionBatteryState()),
      },
      {
        label: getConditionTitle(ConditionTypeValues.idle),
        onSelect: () => (observableRule.condition = new EditConditionIdle()),
      },
    ],
    [observableRule]
  );

  return <RuleConditionSelector title={title} conditions={conditions} />;
});

function Separator() {
  return <FastBox h={2} />;
}

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
      mt={2}
      p={2}
      bg="gray.700"
      rounded="md"
      data={conditionWidgets}
      renderItem={renderItem}
      ItemSeparatorComponent={Separator}
    />
  );
});

// Only children components are observers
export default function ({
  observableRule,
  ...flexProps
}: {
  observableRule: EditRule;
} & IViewProps) {
  return (
    <View
      p={3}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
      {...flexProps}
    >
      <ObservableConditionSelection observableRule={observableRule} />
      <ObservableCondition observableRule={observableRule} />
    </View>
  );
}

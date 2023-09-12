import {
  EditAnimation,
  getEditWidgetsData,
  EditPattern,
  createDataSetForAnimation,
  EditWidgetData,
} from "@systemic-games/pixels-edit-animation";
import {
  createWidgetComponent,
  BaseBox,
  BaseVStack,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import React from "react";
import { FlatList } from "react-native";

import AppStyles from "~/AppStyles";
import { useAppPatterns } from "~/app/hooks";
import { TextInputClear } from "~/components/TextInputClear";
import { getPatternRenderData } from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ObservableInputAnimName = observer(function ({
  observableAnim,
}: {
  observableAnim: EditAnimation;
}) {
  return (
    <TextInputClear
      isTitle
      placeholder="Type Name"
      value={observableAnim.name}
      onChangeText={(text) => (observableAnim.name = text)}
    />
  );
});

/**
 * Container component for {@link RenderWidget} to display widgets for animation edition.
 * @param editAnim type of animation for widgets to display.
 * @returns a ScrollView of edition widgets corresponding to the type of animation.
 */
function AnimationEditor({
  observableAnim,
}: {
  observableAnim: EditAnimation;
}) {
  const patterns = useAppPatterns();
  const animWidgets = React.useMemo(
    () => getEditWidgetsData(observableAnim, { exclude: ["name"] }),
    [observableAnim]
  );

  const patternsParams = React.useMemo(
    () => ({
      patterns,
      dieRenderer: (pattern: Readonly<EditPattern>) => (
        <DieRenderer renderData={getPatternRenderData(pattern)} />
      ),
    }),
    [patterns]
  );

  const renderItem = React.useCallback(
    ({
      item: widgetData,
      index,
    }: {
      item: Readonly<EditWidgetData>;
      index: number;
    }) => {
      const Widget = createWidgetComponent(widgetData, { patternsParams });
      return <Widget key={index} />;
    },
    [patternsParams]
  );

  return (
    <FlatList
      style={AppStyles.fullWidth}
      contentContainerStyle={AppStyles.listContentContainer}
      data={animWidgets}
      renderItem={renderItem}
    />
  );
}

const ObservableDieRender = observer(function ({
  observableAnim,
}: {
  observableAnim: EditAnimation;
}) {
  return (
    <BaseBox w="60%" aspectRatio={1} alignSelf="center">
      <DieRenderer
        renderData={createDataSetForAnimation(observableAnim).toDataSet()}
      />
    </BaseBox>
  );
});

// Only children components are observers
export default function ({
  observableAnim,
}: {
  observableAnim: EditAnimation;
}) {
  return (
    <BaseVStack w="100%" h="100%">
      <ObservableInputAnimName observableAnim={observableAnim} />
      <ObservableDieRender observableAnim={observableAnim} />
      <AnimationEditor observableAnim={observableAnim} />
    </BaseVStack>
  );
}

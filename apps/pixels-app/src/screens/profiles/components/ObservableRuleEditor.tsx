import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditAction,
  EditActionPlayAnimation,
  EditAnimation,
  EditRule,
} from "@systemic-games/pixels-edit-animation";
import {
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import React from "react";
import { FlatList } from "react-native";
import { Text, useTheme } from "react-native-paper";

import ObservableActionEditor from "./ObservableActionEditor";
import ObservableConditionEditor from "./ObservableConditionEditor";

import AppStyles from "~/AppStyles";
import { useAppAnimations, useAppUserTexts } from "~/app/hooks";
import IconButton from "~/components/IconButton";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import { makeObservable } from "~/features/makeObservable";
import DieRenderer from "~/features/render3d/DieRenderer";

const ObservableActionsList = observer(function ({
  observableRule,
}: {
  observableRule: EditRule;
}) {
  const animations = useAppAnimations();
  const appUserTexts = useAppUserTexts();
  const userTextsParams = React.useMemo(
    () => ({
      availableTexts: appUserTexts,
    }),
    [appUserTexts]
  );
  const dieRenderer = React.useCallback(
    (anim: Readonly<EditAnimation>) => (
      <DieRenderer renderData={getCachedDataSet(anim)} />
    ),
    []
  );

  const replace = React.useCallback(
    (action: EditAction, newAction?: EditAction) => {
      const index = observableRule.actions.indexOf(action);
      assert(index >= 0, "Trying to replace unknown action");
      const actions = [...observableRule.actions];
      if (newAction) {
        actions.splice(index, 1, newAction);
      } else {
        actions.splice(index, 1);
      }
      observableRule.actions = actions;
    },
    [observableRule]
  );

  // Key generator for actions
  const actionIdsMap = React.useMemo(() => new Map<EditAction, string>(), []);
  const getKey = React.useCallback(
    (action: EditAction): string => {
      let id = actionIdsMap.get(action);
      if (!id) {
        id = (actionIdsMap.size + 1).toString();
        actionIdsMap.set(action, id);
      }
      return id;
    },
    [actionIdsMap]
  );

  const theme = useTheme();
  const renderItem = React.useCallback(
    ({ item: observableAction }: { item: Readonly<EditAction> }) => (
      <ObservableActionEditor
        borderRadius={(theme.isV3 ? 5 : 1) * theme.roundness}
        borderWidth={1}
        borderColor={theme.colors.primary}
        bg={theme.colors.background}
        p={10}
        observableAction={observableAction}
        animations={animations}
        dieRenderer={dieRenderer}
        onReplace={(newAction) => replace(observableAction, newAction)}
        onDelete={() => replace(observableAction)}
        userTextsParams={userTextsParams}
      />
    ),
    [animations, dieRenderer, replace, userTextsParams, theme]
  );

  return (
    <FlatList
      style={AppStyles.fullWidth}
      contentContainerStyle={AppStyles.listContentContainer}
      data={observableRule.actions}
      keyExtractor={getKey}
      renderItem={renderItem}
    />
  );
});

// Only children components are observers
export default function ({ observableRule }: { observableRule: EditRule }) {
  const createAction = React.useCallback(
    () =>
      (observableRule.actions = [
        ...observableRule.actions,
        makeObservable(new EditActionPlayAnimation()),
      ]),
    [observableRule]
  );
  const theme = useTheme();
  return (
    <BaseVStack w="100%" h="100%" gap={10}>
      <ObservableConditionEditor
        borderRadius={(theme.isV3 ? 5 : 1) * theme.roundness}
        borderWidth={1}
        borderColor={theme.colors.primary}
        bg={theme.colors.background}
        p={10}
        observableRule={observableRule}
      />
      <BaseHStack alignItems="center" justifyContent="space-between">
        <Text variant="bodyLarge">Actions:</Text>
        <IconButton icon="add" onPress={createAction} />
      </BaseHStack>
      <ObservableActionsList observableRule={observableRule} />
    </BaseVStack>
  );
}

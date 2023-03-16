import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditAction,
  EditActionPlayAnimation,
  EditAnimation,
  EditRule,
} from "@systemic-games/pixels-edit-animation";
import { FastVStack } from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import { FlatList } from "native-base";
import React from "react";

import ObservableActionEditor from "./ObservableActionEditor";
import ObservableConditionEditor from "./ObservableConditionEditor";

import { useAppAnimations, useAppUserTexts } from "~/app/hooks";
import CreateEntityButton from "~/components/CreateEntityButton";
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

  const renderItem = React.useCallback(
    ({ item: observableAction }: { item: Readonly<EditAction> }) => (
      <ObservableActionEditor
        my={1}
        observableAction={observableAction}
        animations={animations}
        dieRenderer={dieRenderer}
        onReplace={(newAction) => replace(observableAction, newAction)}
        onDelete={() => replace(observableAction)}
        userTextsParams={userTextsParams}
      />
    ),
    [animations, dieRenderer, replace, userTextsParams]
  );

  return (
    <FlatList
      w="100%"
      data={observableRule.actions}
      renderItem={renderItem}
      keyExtractor={getKey}
    />
  );
});

// Only children components are observers
export default function ({ observableRule }: { observableRule: EditRule }) {
  const add = React.useCallback(
    () =>
      (observableRule.actions = [
        ...observableRule.actions,
        makeObservable(new EditActionPlayAnimation()),
      ]),
    [observableRule]
  );

  return (
    <FastVStack w="100%" h="100%">
      <ObservableConditionEditor observableRule={observableRule} />
      <CreateEntityButton onPress={add}>ADD ACTION</CreateEntityButton>
      <ObservableActionsList observableRule={observableRule} />
    </FastVStack>
  );
}

import { MaterialIcons } from "@expo/vector-icons";
import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditAction,
  EditActionPlayAnimation,
  EditAnimation,
} from "@systemic-games/pixels-edit-animation";
import {
  FastVStack,
  HView,
  PixelAppPage,
  RuleActionWidget,
  RuleConditionWidget,
} from "@systemic-games/react-native-pixels-components";
import { Text, Pressable, Center, FlatList } from "native-base";
import React from "react";

import {
  getTempProfileFromUuid,
  useAppAnimations,
  useAppUserTexts,
} from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfileEditRuleScreenProps } from "~/navigation";

interface ActionsListProps {
  actions: Readonly<EditAction>[];
  onReplace: (
    action: Readonly<EditAction>,
    newAction: Readonly<EditAction>
  ) => void;
  onRemove: (action: Readonly<EditAction>) => void;
}

function ActionsList({ actions, onReplace, onRemove }: ActionsListProps) {
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
  const renderItem = React.useCallback(
    ({ item: action }: { item: Readonly<EditAction> }) => (
      <RuleActionWidget
        my={1}
        key={actions.indexOf(action)} // TODO should use an id
        action={action}
        animations={animations}
        dieRenderer={dieRenderer}
        onReplace={(newAction) => onReplace(action, newAction)}
        onDelete={() => onRemove(action)}
        userTextsParams={userTextsParams}
      />
    ),
    [actions, animations, dieRenderer, onRemove, onReplace, userTextsParams]
  );
  return <FlatList data={actions} renderItem={renderItem} w="100%" />;
}

export default function ProfileEditRuleScreen({
  route,
}: ProfileEditRuleScreenProps) {
  const profile = React.useMemo(() => {
    const selectedProfile = getTempProfileFromUuid(route.params.profileUuid);
    assert(
      selectedProfile,
      `ProfileEditRuleScreen: Couldn't find profile with uuid: ${route.params.profileUuid}`
    );
    return selectedProfile;
  }, [route.params.profileUuid]);
  const rule = React.useMemo(() => {
    const selectedRule = profile.rules[route.params.ruleIndex];
    assert(
      selectedRule,
      `ProfileEditRuleScreen: Couldn't find rule with index: ${route.params.ruleIndex}`
    );
    return selectedRule;
  }, [profile, route.params.ruleIndex]);
  const [condition, setCondition] = React.useState(rule.condition);
  const [ruleActions, setRuleActions] = React.useState(rule.actions);

  const addAction = React.useCallback(() => {
    const newAction = new EditActionPlayAnimation();
    setRuleActions((ruleActions) => {
      const actions = [...ruleActions, newAction];
      rule.actions.length = 0;
      rule.actions.push(...actions);
      return actions;
    });
  }, [rule]);

  const replaceAction = React.useCallback(
    (action: EditAction, newAction: EditAction) =>
      setRuleActions((ruleActions) => {
        const actions = [...ruleActions];
        actions.splice(actions.indexOf(action), 1, newAction);
        rule.actions.length = 0;
        rule.actions.push(...actions);
        return actions;
      }),
    [rule]
  );

  const removeAction = React.useCallback(
    (action: EditAction) =>
      setRuleActions((ruleActions) => {
        const actions = [...ruleActions];
        actions.splice(actions.indexOf(action), 1);
        rule.actions.length = 0;
        rule.actions.push(...actions);
        return actions;
      }),
    [rule]
  );

  return (
    <PixelAppPage>
      <FastVStack w="100%" h="100%">
        <RuleConditionWidget
          condition={condition}
          setCondition={(condition) => {
            setCondition(condition);
            rule.condition = condition;
          }}
        />
        <Pressable onPress={() => addAction()}>
          <Center borderWidth={1.5} borderColor="gray.600" rounded="md">
            <HView alignItems="center" rounded="lg" bg="darkBlue.800" p={2}>
              <MaterialIcons name="rule" size={35} color="white" />
              <Text ml={4}>ADD ACTION</Text>
            </HView>
          </Center>
        </Pressable>
        <ActionsList
          actions={ruleActions}
          onReplace={replaceAction}
          onRemove={removeAction}
        />
      </FastVStack>
    </PixelAppPage>
  );
}

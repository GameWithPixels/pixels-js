import { MaterialIcons } from "@expo/vector-icons";
import {
  EditAction,
  EditActionPlayAnimation,
  EditRule,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelAppPage,
  RuleActionWidget,
  RuleConditionWidget,
} from "@systemic-games/react-native-pixels-components";
import {
  HStack,
  VStack,
  Text,
  Pressable,
  Center,
  ScrollView,
} from "native-base";
import React from "react";

import EditableStore from "~/features/EditableStore";
import { MyAppDataSet, getAnimData } from "~/features/profiles";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfileEditRuleScreenProps } from "~/navigation";

export default function ProfileEditRuleScreen({
  route,
}: ProfileEditRuleScreenProps) {
  const rule = EditableStore.getEditable<EditRule>(route.params.ruleId);
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

  const removeAction = React.useCallback(
    (action: EditAction) =>
      setRuleActions((ruleActions) => {
        const actionKey = EditableStore.getKey(action);
        EditableStore.unregister(action);
        const actions = [...ruleActions];
        actions.splice(
          actions.findIndex((action) => {
            return EditableStore.getKey(action) === actionKey;
          }),
          1
        );
        rule.actions.length = 0;
        rule.actions.push(...actions);
        return actions;
      }),
    [rule]
  );

  return (
    <PixelAppPage>
      <ScrollView height="100%" width="100%">
        <VStack space={2} height={1000} w="100%">
          <RuleConditionWidget
            condition={condition}
            setCondition={(condition) => {
              setCondition(condition);
              rule.condition = condition;
            }}
          />
          {ruleActions.map((action) => (
            <RuleActionWidget
              key={EditableStore.getKey(action)}
              action={action}
              onDelete={() => removeAction(action)}
              animations={MyAppDataSet.animations}
              dieRenderer={(anim) => (
                <DieRenderer animationData={getAnimData(anim)} />
              )}
            />
          ))}
          <Pressable onPress={() => addAction()}>
            <Center
              borderWidth={1.5}
              borderColor="gray.600"
              rounded="md"
              h="125"
            >
              <HStack
                space={4}
                alignItems="center"
                rounded="lg"
                bg="darkBlue.800"
                p={2}
              >
                <MaterialIcons name="rule" size={35} color="white" />
                <Text>ADD ACTION</Text>
              </HStack>
            </Center>
          </Pressable>
        </VStack>
      </ScrollView>
    </PixelAppPage>
  );
}

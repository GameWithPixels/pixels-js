import { MaterialIcons } from "@expo/vector-icons";
import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditAction,
  EditActionPlayAnimation,
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

import {
  getTempProfileFromUuid,
  useAppAnimations,
  useAppUserTexts,
} from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfileEditRuleScreenProps } from "~/navigation";

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

  const animations = useAppAnimations();
  const appUserTexts = useAppUserTexts();

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
              key={rule.actions.indexOf(action)}
              action={action}
              onReplace={(newAction) => replaceAction(action, newAction)}
              onDelete={() => removeAction(action)}
              animations={animations}
              userTextsParams={{
                availableTexts: appUserTexts,
              }}
              dieRenderer={(anim) => (
                <DieRenderer renderData={getCachedDataSet(anim)} />
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

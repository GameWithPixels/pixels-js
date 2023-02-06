import { MaterialIcons } from "@expo/vector-icons";
import {
  ActionTypeValues,
  ConditionTypeValues,
} from "@systemic-games/pixels-core-animation";
import {
  EditAction,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditCondition,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionCrooked,
  EditConditionFaceCompare,
  EditConditionHandling,
  EditConditionHelloGoodbye,
  EditConditionIdle,
  EditConditionRolling,
  EditRule,
  getEditWidgetsData,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelAppPage,
  RuleConditionSelection,
  RuleActionSelection,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Pressable,
  Center,
  ScrollView,
} from "native-base";
import React from "react";

import { RenderWidget } from "~/components/RenderWidget";
import EditableStore from "~/features/EditableStore";
import { ProfileEditRuleScreenProps } from "~/navigation";
import getConditionSimpleTitle from "~/screens/MainScreens/Profiles/getConditionSimpleTitle";

interface RuleActionWidgetProps extends React.PropsWithChildren {
  action: EditAction;
  onDelete?: (() => void) | null | undefined;
}

interface RuleConditionWidgetProps extends React.PropsWithChildren {
  condition: EditCondition;
  setCondition: (condition: EditCondition) => void;
}

function RuleConditionWidget(props: RuleConditionWidgetProps) {
  const conditionTitle = React.useMemo(
    () => getConditionSimpleTitle(props.condition.type),
    [props.condition.type]
  );
  return (
    <VStack
      space={2}
      p={4}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
    >
      <HStack space={2} width="100%" alignItems="center">
        <Box flex={10} w="100%">
          <RuleConditionSelection
            conditionTitle={conditionTitle}
            possibleConditions={[
              {
                label: getConditionSimpleTitle(ConditionTypeValues.faceCompare),
                onPress: () =>
                  props.setCondition(new EditConditionFaceCompare()),
              },
              {
                label: getConditionSimpleTitle(
                  ConditionTypeValues.helloGoodbye
                ),
                onPress: () =>
                  props.setCondition(new EditConditionHelloGoodbye()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.handling),
                onPress: () => props.setCondition(new EditConditionHandling()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.rolling),
                onPress: () => props.setCondition(new EditConditionRolling()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.crooked),
                onPress: () => props.setCondition(new EditConditionCrooked()),
              },
              {
                label: getConditionSimpleTitle(
                  ConditionTypeValues.connectionState
                ),
                onPress: () =>
                  props.setCondition(new EditConditionConnectionState()),
              },
              {
                label: getConditionSimpleTitle(
                  ConditionTypeValues.batteryState
                ),
                onPress: () =>
                  props.setCondition(new EditConditionBatteryState()),
              },
              {
                label: getConditionSimpleTitle(ConditionTypeValues.idle),
                onPress: () => props.setCondition(new EditConditionIdle()),
              },
            ]}
          />
        </Box>
      </HStack>
      <ConditionEditor editCondition={props.condition} />
    </VStack>
  );
}

/**
 * Widget for selecting a type of action to execute in a rule.
 * @param props See {@link RuleActionWidgetProps} for props params.
 */
function RuleActionWidget(props: RuleActionWidgetProps) {
  const [editAction, setEditAction] = React.useState(props.action);
  const [actionTitle, setActionTitle] = React.useState(() =>
    props.action.type === ActionTypeValues.playAnimation
      ? "Trigger pattern"
      : "Play audio clip"
  );

  return (
    <VStack
      space={2}
      p={4}
      borderWidth={1}
      borderColor="gray.300"
      rounded="lg"
      bg="darkBlue.700"
    >
      <HStack space={2} width="100%" alignItems="center">
        <Box flex={10} w="100%">
          <RuleActionSelection
            actionTitle={actionTitle}
            possibleActions={[
              {
                label: "Trigger Pattern",
                onPress: () => {
                  setActionTitle("Trigger Pattern");
                  setEditAction(new EditActionPlayAnimation());
                },
              },
              {
                label: "Play Audio Clip",
                onPress: () => {
                  setActionTitle("Play Audio Clip");
                  setEditAction(new EditActionPlayAudioClip());
                },
              },
            ]}
          />
        </Box>
        <Button
          onPress={() => {
            props.onDelete?.();
          }}
          flex={1}
        >
          <Text fontSize="xl">X</Text>
        </Button>
      </HStack>
      <ActionEditor editAction={editAction} />
    </VStack>
  );
}

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

function ConditionEditor({ editCondition }: { editCondition: EditCondition }) {
  const conditionWidgets = React.useMemo(() => {
    return getEditWidgetsData(editCondition);
  }, [editCondition]);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {conditionWidgets.map((widget, key) => (
        <RenderWidget key={key} widget={widget} />
      ))}
    </VStack>
  );
}

function ActionEditor({ editAction }: { editAction: EditAction }) {
  const actionWIdgets = React.useMemo(() => {
    return getEditWidgetsData(editAction);
  }, [editAction]);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {actionWIdgets.map((widget, key) => (
        <RenderWidget key={key} widget={widget} />
      ))}
    </VStack>
  );
}

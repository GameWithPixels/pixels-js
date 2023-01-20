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
  EditWidgetData,
  getEditWidgetsData,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelTheme,
  createPixelTheme,
  PxAppPage,
  RuleConditionSelection,
  RuleActionSelection,
  // RuleConditionSelection,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Pressable,
  Center,
} from "native-base";
import React, { useEffect } from "react";

import { RenderWidget } from "../Patterns/AnimationSettingsScreen";
import { lastSelectedRule } from "./ProfileRulesScreen";

import EditableStore from "~/features/EditableStore";

const paleBluePixelThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#1b94ff",
    "100": "#0081f2",
    "200": "#006cca",
    "300": "#0256a0",
    "400": "#024178",
    "500": "#04345e",
    "600": "#062846",
    "700": "#051b2e",
    "800": "#040f18",
    "900": "#010204",
  },
};
const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);

// export function GetConditionSimpleTitle(
//   condition: EditCondition | undefined
// ): string {
//   console.log("condition type = " + condition?.type);
//   let conditionTitle: string = "No action selected";
//   if (condition) {
//     switch (condition.type) {
//       case ConditionTypeValues.handling:
//         conditionTitle = "Pixel is picked up";
//         break;
//       case ConditionTypeValues.catteryState:
//         conditionTitle = "Battery Event...";
//         break;
//       case ConditionTypeValues.connectionState:
//         conditionTitle = "Bluethoot Event...";
//         break;
//       case ConditionTypeValues.crooked:
//         conditionTitle = "Pixel is crooked";
//         break;
//       case ConditionTypeValues.faceCompare:
//         conditionTitle = "Pixel roll is...";
//         break;
//       case ConditionTypeValues.helloGoodbye:
//         conditionTitle = "Pixel wakes up / sleeps";
//         break;
//       case ConditionTypeValues.idle:
//         conditionTitle = "Pixel is idle for...";

//         break;
//       case ConditionTypeValues.rolling:
//         conditionTitle = "Pixel is rolling";

//         break;
//       case ConditionTypeValues.unknown:
//         conditionTitle = "Unknown";

//         break;
//       default:
//         conditionTitle = "No condition selected";
//         break;
//     }
//   }

//   return conditionTitle;
// }

interface RuleActionWidgetProps {
  action: EditAction;
  children?: React.ReactNode | React.ReactNode[];
  onDelete?: (() => void) | null | undefined;
}
interface RuleConditionWidgetProps {
  condition: EditCondition;
  children?: React.ReactNode | React.ReactNode[];
}

function RuleConditionWidget(props: RuleConditionWidgetProps) {
  const [editCondition, setEditCondition] = React.useState<EditCondition>(
    new EditConditionFaceCompare()
  );

  useEffect(() => {
    setEditCondition(props.condition);
  }, [props.condition]);

  const [_conditionTitle, setConditionTitle] = React.useState<string>();

  function GetConditionSimpleTitle(
    condition: EditCondition | undefined
  ): string {
    let conditionTitle: string = "No action selected";
    if (condition) {
      switch (condition.type) {
        case ConditionTypeValues.handling:
          conditionTitle = "Pixel is picked up";
          break;
        case ConditionTypeValues.batteryState:
          conditionTitle = "Battery Event...";
          break;
        case ConditionTypeValues.connectionState:
          conditionTitle = "Bluethoot Event...";
          break;
        case ConditionTypeValues.crooked:
          conditionTitle = "Pixel is crooked";
          break;
        case ConditionTypeValues.faceCompare:
          conditionTitle = "Pixel roll is...";
          break;
        case ConditionTypeValues.helloGoodbye:
          conditionTitle = "Pixel wakes up / sleeps";
          break;
        case ConditionTypeValues.idle:
          conditionTitle = "Pixel is idle for...";

          break;
        case ConditionTypeValues.rolling:
          conditionTitle = "Pixel is rolling";

          break;
        case ConditionTypeValues.unknown:
          conditionTitle = "Unknown";

          break;
        default:
          conditionTitle = "No condition selected";
          break;
      }
    }

    return conditionTitle;
  }

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
            conditionTitle={GetConditionSimpleTitle(props.condition)}
            possibleConditions={[
              {
                label: "Pixel roll is...",
                onPress: () => {
                  setConditionTitle("Pixel roll is...");
                  setEditCondition(new EditConditionFaceCompare());
                },
              },
              {
                label: "Pixel wakes up/sleep",
                onPress: () => {
                  setConditionTitle("Pixel wakes up/sleep");
                  setEditCondition(new EditConditionHelloGoodbye());
                },
              },
              {
                label: "Pixel is picked up",
                onPress: () => {
                  setConditionTitle("Pixel is picked up");
                  setEditCondition(new EditConditionHandling());
                },
              },
              {
                label: "Pixel is rolling",
                onPress: () => {
                  setConditionTitle("Pixel is rolling");
                  setEditCondition(new EditConditionRolling());
                },
              },
              {
                label: "Pixel is crooked",
                onPress: () => {
                  setConditionTitle("Pixel is crooked");
                  setEditCondition(new EditConditionCrooked());
                },
              },
              {
                label: "Bluetooth Event...",
                onPress: () => {
                  setConditionTitle("Bluetooth Event...");
                  setEditCondition(new EditConditionConnectionState());
                },
              },
              {
                label: "Battery Event...",
                onPress: () => {
                  setConditionTitle("Battery Event...");
                  setEditCondition(new EditConditionBatteryState());
                },
              },
              {
                label: "Pixel is idle for...",
                onPress: () => {
                  setConditionTitle("Pixel is idle for...");
                  setEditCondition(new EditConditionIdle());
                },
              },
            ]}
          />
        </Box>
      </HStack>
      {ConditionEditor({ editCondition })}
    </VStack>
  );
}

/**
 * Widget for selecting a type of action to execute in a rule.
 * @param props See {@link RuleActionWidgetProps} for props params.
 */
function RuleActionWidget(props: RuleActionWidgetProps) {
  const [editAction, setEditAction] = React.useState<EditAction>(
    new EditActionPlayAnimation()
  );
  const [_actionTitle, setActionTitle] = React.useState<string>();

  function getActionTitle(action: EditAction): string {
    let actionTitle;
    if (action.type === ActionTypeValues.playAnimation) {
      actionTitle = "Trigger pattern";
    } else {
      actionTitle = "Play audio clip";
    }

    return actionTitle;
  }

  useEffect(() => {
    setEditAction(props.action);
    const initialActionTitle = getActionTitle(props.action);
    setActionTitle(initialActionTitle);
  }, [props.action]);

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
            actionTitle={_actionTitle}
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
      {ActionEditor({ editAction })}
    </VStack>
  );
}

export default function ProfileEditRuleScreen() {
  const [rule, setRule] = React.useState<EditRule>();
  const [ruleActions, setRuleActions] = React.useState<EditAction[]>([]);

  useEffect(() => {
    setRule(lastSelectedRule);
    if (rule?.actions) setRuleActions(rule.actions);
  }, [rule?.actions]);

  // useEffect(() => {
  //   //Set the actions from the rules
  //   const actions = lastSelectedRule.actions;
  //   setRuleActions(actions);

  //   const actionWidgets: RuleActionWidgetInfo[] = [];
  //   // Set the actions inside RuleActionWidgetInfo for action widget props
  //   ruleActions.forEach(function (action, index) {
  //     const actionWidgetInfo: RuleActionWidgetInfo = {
  //       action,
  //       widgetIndex: index,
  //     };
  //     actionWidgets.push(actionWidgetInfo);
  //   });
  //   setRulesWidgetList(actionWidgets);
  // }, [ruleActions]);

  const [_pattern, _setPattern] = React.useState(
    "-- Select a Lighting Pattern --"
  );
  const [_audioClip, _setAudioClip] = React.useState("-- Select Audio Clip --");

  function addAction() {
    const newAction = new EditActionPlayAnimation();
    setRuleActions([...ruleActions, newAction]);
  }

  function removeAction(actionKey: number) {
    ruleActions.splice(
      ruleActions.findIndex((action) => {
        return EditableStore.getKey(action) === actionKey;
      }),
      1
    );
    setRuleActions([...ruleActions]);
  }
  return (
    <PxAppPage theme={paleBluePixelTheme} scrollable>
      <VStack space={2} height={1000} w="100%">
        <RuleConditionWidget
          condition={
            rule?.condition ? rule.condition : new EditConditionFaceCompare()
          }
        />

        {ruleActions.map((action) => (
          <RuleActionWidget
            key={EditableStore.getKey(action)}
            action={action}
            onDelete={() => {
              console.log("delete");
              removeAction(EditableStore.getKey(action));
              EditableStore.unregister(action);
            }}
          />
        ))}
        <Pressable
          onPress={() => {
            addAction();
          }}
        >
          <Center borderWidth={1.5} borderColor="gray.600" rounded="md" h="125">
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
    </PxAppPage>
  );
}

function ConditionEditor({ editCondition }: { editCondition: EditCondition }) {
  const [conditionWidgets, setConditionsWidgets] = React.useState<
    EditWidgetData[]
  >([]);
  useEffect(() => {
    setConditionsWidgets(getEditWidgetsData(editCondition));
  }, [editCondition]);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {conditionWidgets.map((widgets, key) => (
        <RenderWidget key={key} widget={widgets} />
      ))}
    </VStack>
  );
}

function ActionEditor({ editAction }: { editAction: EditAction }) {
  const [actionWIdgets, setActionsWidgets] = React.useState<EditWidgetData[]>(
    []
  );
  useEffect(() => {
    setActionsWidgets(getEditWidgetsData(editAction));
  }, [editAction]);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {actionWIdgets.map((widgets, key) => (
        <RenderWidget key={key} widget={widgets} />
      ))}
    </VStack>
  );
}

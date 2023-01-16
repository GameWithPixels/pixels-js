import { MaterialIcons } from "@expo/vector-icons";
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
  EditWidgetData,
  getEditWidgetsData,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelTheme,
  createPixelTheme,
  PxAppPage,
  RuleConditionSelection,
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

const _Patterns = [
  {
    profileName: "Pattern 1",
    imageRequirePath: require("~/../assets/YellowDice.png"),
  },
  {
    profileName: "Pattern 2",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 3",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 4",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
  },
  {
    profileName: "Pattern 5",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 6",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 7",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 8",
    imageRequirePath: require("~/../assets/YellowDice.png"),
  },
  {
    profileName: "Pattern 9",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 10",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
  },
  {
    profileName: "Pattern 11",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 12",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
  },
  {
    profileName: "Pattern 13",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 14",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 15",
    imageRequirePath: require("~/../assets/YellowDice.png"),
  },
];

interface RuleWidgetInfo {
  widgetIndex: number;
}
interface RuleWidgetProps {
  ruleInfo: RuleWidgetInfo;
  children?: React.ReactNode | React.ReactNode[];
  onDelete?: (() => void) | null | undefined;
}

function RuleConditionWidget(props: RuleWidgetProps) {
  const [editCondition, setEditCondition] = React.useState<EditCondition>(
    new EditConditionFaceCompare()
  );
  const [conditionTitle, setConditionTitle] =
    React.useState("Pixel roll is...");
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
            title={conditionTitle}
            widgetIndexInList={props.ruleInfo.widgetIndex}
            conditions={[
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
            conditionIndex={0}
          />
        </Box>
      </HStack>
      {ConditionEditor({ editCondition })}
    </VStack>
  );
}

/**
 * Widget for selecting a type of action to execute in a rule.
 * @param props See {@link RuleWidgetProps} for props params.
 */
function RuleActionWidget(props: RuleWidgetProps) {
  const [editAction, setEditAction] = React.useState<EditAction>(
    new EditActionPlayAnimation()
  );
  const [actionTitle, setActionTitle] = React.useState("Trigger Pattern");
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
            title={actionTitle}
            widgetIndexInList={props.ruleInfo.widgetIndex}
            conditions={[
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
            conditionIndex={props.ruleInfo.widgetIndex}
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
  const [rulesWidgetList, setRulesWidgetList] = React.useState<
    RuleWidgetInfo[]
  >([]);
  const [_pattern, _setPattern] = React.useState(
    "-- Select a Lighting Pattern --"
  );
  const [_audioClip, _setAudioClip] = React.useState("-- Select Audio Clip --");

  function addAction() {
    let widgetIndex = rulesWidgetList.length + 1;
    widgetIndex = widgetIndex === 0 ? 1 : widgetIndex;
    const ruleWidgetInfo: RuleWidgetInfo = { widgetIndex };
    setRulesWidgetList([...rulesWidgetList, ruleWidgetInfo]);
    console.log(rulesWidgetList);
  }

  function removeRule(widgetIndex: number) {
    rulesWidgetList.splice(
      rulesWidgetList.findIndex((widget) => {
        return widget.widgetIndex === widgetIndex;
      }),
      1
    );
    setRulesWidgetList([...rulesWidgetList]);
  }
  return (
    <PxAppPage theme={paleBluePixelTheme} scrollable>
      <VStack space={2} height={1000} w="100%">
        <RuleConditionWidget
          ruleInfo={{ widgetIndex: 0 }}
          onDelete={() => {
            removeRule(0);
          }}
        />

        {rulesWidgetList.map((ruleWidgetInfo, key) => (
          <RuleActionWidget
            key={key}
            ruleInfo={ruleWidgetInfo}
            onDelete={() => {
              removeRule(ruleWidgetInfo.widgetIndex);
            }}
          />
        ))}
        <Pressable onPress={() => addAction()}>
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
  console.log(editCondition);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {conditionWidgets.map((widgets, key) => (
        <RenderWidget key={key} widget={widgets} />
      ))}
    </VStack>
  );
}

function ActionEditor({ editAction }: { editAction: EditAction }) {
  const [conditionWidgets, setConditionsWidgets] = React.useState<
    EditWidgetData[]
  >([]);
  useEffect(() => {
    setConditionsWidgets(getEditWidgetsData(editAction));
  }, [editAction]);
  console.log(editAction);
  return (
    <VStack p={2} space={2} bg="gray.700" rounded="md">
      {conditionWidgets.map((widgets, key) => (
        <RenderWidget key={key} widget={widgets} />
      ))}
    </VStack>
  );
}

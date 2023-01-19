import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
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
  EditConditionFaceCompare,
  EditRule,
} from "@systemic-games/pixels-edit-animation";
import {
  Card,
  createPixelTheme,
  createSwipeableSideButton,
  PixelTheme,
  ProfileRulesCard,
  PxAppPage,
  RuleCardInfo,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  HStack,
  Image,
  Pressable,
  VStack,
  Text,
  Input,
} from "native-base";
import React, { useEffect } from "react";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";

import { selectedProfile } from "./ProfilesListScreen";

import {
  //ProfileScreenRouteProp,
  ProfilesScreenStackParamList,
} from "~/Navigation";
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

const rules: RuleCardInfo[] = [
  {
    condition: "roll is equal to 20",
    actions: ["do this", "do that"],
    ruleKey: 98479283749,
  },
  {
    condition: "roll is equal to 10",
    actions: ["do this", "do that", "also do that"],
    ruleKey: 90397459843,
  },
  {
    condition: "roll is equal to 6",
    actions: ["do this"],
    ruleKey: 328739487,
  },
  {
    condition: "roll is less than 15",
    actions: ["do this", "do that", "also do that"],
    ruleKey: 6743975948,
  },
  {
    condition: "roll is equal to 7",
    actions: ["do this", "do that", "also do that"],
    ruleKey: 7487587,
  },
  {
    condition: "roll is equal to 5",
    actions: ["do this", "do that", "also do that"],
    ruleKey: 4899847598,
  },
];

// const DefaultRule: RuleCardInfo = {
//   ruleKey: 7487584890487,
//   condition: "roll is equal to 1",
//   actions: [" trigger patterns : Red To Blue "],
// };

export let lastSelectedRule: EditRule;

interface CreateRuleWidgetProps {
  onPress?: () => void;
}

/**
 * JSX pressable to create a new editable rule.
 * @param props See {@link CreateRuleWidgetProps} for props params.
 * @returns
 */
function _CreateRuleWidget(props: CreateRuleWidgetProps) {
  return (
    <Pressable
      onPress={() => {
        props.onPress?.();
      }}
    >
      <Card bg={null} minW="100%" minH="50px">
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text isTruncated bold>
          CREATE NEW RULE
        </Text>
      </Card>
    </Pressable>
  );
}

function GetActionTitles(actions: EditAction[]): string[] {
  const actionsTitles: any[] = [];

  actions.forEach(function (action) {
    if (action.type === ActionTypeValues.playAnimation) {
      actionsTitles.push(
        "Play " + (action as EditActionPlayAnimation).animation?.name
      );
    } else {
      actionsTitles.push(
        "Play " + (action as EditActionPlayAudioClip).clip?.name
      );
    }
  });
  return actionsTitles;
}
function GetConditionTitle(condition: EditCondition | undefined): string {
  let conditionTitle: string = "No action selected";
  let faceCompareFlag;
  let batteryFlag;
  if (condition) {
    switch (condition.type) {
      case ConditionTypeValues.handling:
        conditionTitle = "die is picked up";
        break;
      case ConditionTypeValues.catteryState:
        batteryFlag = (condition as EditConditionBatteryState).flags;
        if (batteryFlag === 0) {
          conditionTitle = "battery is ok ";
        } else if (batteryFlag === 1) {
          conditionTitle = "battery is low ";
        } else if (batteryFlag === 3) {
          conditionTitle = "battery is charging";
        } else if (batteryFlag === 4) {
          conditionTitle = "battery is done charging";
        }
        // TODO add the variations with multiple selections at once

        break;
      case ConditionTypeValues.connectionState:
        conditionTitle =
          "die is " + (condition as EditConditionConnectionState).flags;

        break;
      case ConditionTypeValues.crooked:
        conditionTitle = "die is crooked";

        break;
      case ConditionTypeValues.faceCompare:
        faceCompareFlag = (condition as EditConditionFaceCompare).flags;
        if (faceCompareFlag === 0) {
          const faceIndex =
            (condition as EditConditionFaceCompare).faceIndex + 1;
          conditionTitle = "die roll is less than " + faceIndex;
        } else if (faceCompareFlag === 1) {
          const faceIndex =
            (condition as EditConditionFaceCompare).faceIndex + 1;
          conditionTitle = "die roll is equal to " + faceIndex;
        } else if (faceCompareFlag === 2) {
          const faceIndex =
            (condition as EditConditionFaceCompare).faceIndex + 1;
          conditionTitle = "die roll is greater than " + faceIndex;
        } else if (faceCompareFlag === 3) {
          const faceIndex =
            (condition as EditConditionFaceCompare).faceIndex + 1;
          conditionTitle = "die roll is less or equal to " + faceIndex;
        } else if (faceCompareFlag === 4) {
          const faceIndex =
            (condition as EditConditionFaceCompare).faceIndex + 1;
          conditionTitle = "die roll is less or greater than " + faceIndex;
        } else if (faceCompareFlag === 5) {
          const faceIndex =
            (condition as EditConditionFaceCompare).faceIndex + 1;
          conditionTitle = "die roll is equal or greater than " + faceIndex;
        } else {
          conditionTitle = "die is any";
        }
        break;
      case ConditionTypeValues.helloGoodbye:
        if ((condition as EditConditionConnectionState).flags === 0) {
          conditionTitle = "Die is waking up";
        } else if ((condition as EditConditionConnectionState).flags === 1) {
          conditionTitle = "Die is going to sleep";
        } else {
          conditionTitle = "Die is waking up or going to sleep";
        }
        break;
      case ConditionTypeValues.idle:
        conditionTitle = "Die is idle";

        break;
      case ConditionTypeValues.rolling:
        conditionTitle = "Die is rolling";

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

export default function ProfilesRulesScreen() {
  const navigation =
    useNavigation<StackNavigationProp<ProfilesScreenStackParamList>>();

  // Get the editProfile info from the selected profile
  // const route = useRoute<ProfileScreenRouteProp>();

  // const [rulesList, setRulesList] = React.useState<EditRule[]>([]);
  // useEffect(() => {
  //   setRulesList(route.params.rules);
  // }, [route.params.rules]);

  const [rulesList, setRulesList] = React.useState<EditRule[]>([]);
  useEffect(() => {
    setRulesList(selectedProfile.profile.rules);
  }, []);

  function _addRule() {
    const newRule = new EditRule();
    // Register rule
    EditableStore.getKey(newRule);
    setRulesList([...rulesList, newRule]);
  }

  function duplicateRule(ruleToDuplicate: EditRule, index: number) {
    const duplicatedRule = ruleToDuplicate.duplicate();
    // Register duplicated rule
    EditableStore.getKey(duplicatedRule);
    rulesList.splice(index + 1, 0, duplicatedRule);
    setRulesList([...rulesList]);
  }

  function deleteRule(ruleToDelete: EditRule) {
    const ruleKey = EditableStore.getKey(ruleToDelete);
    rulesList.splice(
      rulesList.findIndex((ruleToDelete) => {
        return EditableStore.getKey(ruleToDelete) === ruleKey;
      }),
      1
    );
    setRulesList([...rulesList]);
    // Delete rule from register
    EditableStore.unregister(ruleToDelete);
  }
  const renderItem = ({ item, drag, isActive }: RenderItemParams<EditRule>) => {
    return (
      <ScaleDecorator>
        <Swipeable
          key={EditableStore.getKey(item)}
          renderRightActions={createSwipeableSideButton({
            w: 120,
            buttons: [
              {
                onPress: () => duplicateRule(item, rules.length),
                bg: "blue.500",
                icon: (
                  <MaterialIcons name="content-copy" size={24} color="white" />
                ),
              },
              {
                onPress: () => deleteRule(item),
                bg: "red.500",
                icon: (
                  <MaterialIcons
                    name="delete-outline"
                    size={24}
                    color="white"
                  />
                ),
              },
            ],
          })}
        >
          <Pressable
            onPress={() => {
              lastSelectedRule = item;
              navigation.navigate("ProfileEditRuleScreen");
            }}
            onLongPress={() => {
              console.log("long pressed");
              drag();
            }}
            disabled={isActive}
          >
            <ProfileRulesCard
              key={EditableStore.getKey(item)}
              ruleCardInfo={{
                ruleKey: EditableStore.getKey(item),
                actions: GetActionTitles(item.actions),
                condition: GetConditionTitle(item.condition),
              }}
            />
          </Pressable>
        </Swipeable>
      </ScaleDecorator>
    );
  };

  function SeparatorItem() {
    return <Box h={2} />;
  }
  return (
    <PxAppPage scrollable={false} theme={paleBluePixelTheme}>
      <VStack space={2} width="100%">
        <HStack alignItems="center" width="100%">
          <Box flex={1}>
            <Image
              size={100}
              alt="profileDiceImage"
              source={require("../../../../assets/RainbowDice.png")}
            />
          </Box>
          <Box flex={2.5}>
            {/* TODO check for text color not to be white */}
            <Input
              bg="white"
              variant="filled"
              placeholder="Edit profile description"
              placeholderTextColor="gray.400"
            />
          </Box>
        </HStack>
        <Text bold>Rules for this profile : </Text>
        <Box h="78%" p={1}>
          <DraggableFlatList
            data={rulesList}
            onDragEnd={({ data }) => setRulesList(data)}
            keyExtractor={(item) => EditableStore.getKey(item)?.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={SeparatorItem}
          />
        </Box>
      </VStack>
    </PxAppPage>
  );
}

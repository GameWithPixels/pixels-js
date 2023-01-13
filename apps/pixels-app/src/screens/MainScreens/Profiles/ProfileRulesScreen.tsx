import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  Card,
  createPixelTheme,
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
import React from "react";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";

import { createSwipeableSideButton } from "./ProfilesListScreen";

import { ProfilesScreenParamList } from "~/Navigation";

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

const DefaultRule: RuleCardInfo = {
  ruleKey: 7487584890487,
  condition: "roll is equal to 1",
  actions: [" trigger patterns : Red To Blue "],
};

interface CreateRuleWidgetProps {
  onPress?: () => void;
}

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

export default function ProfilesRulesScreen() {
  const navigation =
    useNavigation<StackNavigationProp<ProfilesScreenParamList>>();
  const [rulesList, setRulesList] = React.useState<RuleCardInfo[]>(rules);

  function _addRule() {
    const ruleKey = Math.random() * 1000;
    const ruleToAdd = DefaultRule;
    ruleToAdd.ruleKey = ruleKey;
    setRulesList([...rulesList, ruleToAdd]);
  }

  function duplicateRule(ruleToDuplicate: RuleCardInfo, index: number) {
    const duplicateRule = { ...ruleToDuplicate };
    duplicateRule.ruleKey = Math.random() * 1000;
    rulesList.splice(index + 1, 0, duplicateRule);
    setRulesList([...rulesList]);
  }

  function deleteRule(ruleToDelete: RuleCardInfo) {
    console.log("delete");
    const ruleKey = ruleToDelete.ruleKey;
    console.log("rule key :" + ruleKey);
    rulesList.splice(
      rulesList.findIndex((ruleToDelete) => {
        return ruleToDelete.ruleKey === ruleKey;
      }),
      1
    );
    console.log(rulesList);
    setRulesList([...rulesList]);
  }
  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<RuleCardInfo>) => {
    return (
      <ScaleDecorator>
        <Swipeable
          key={item.ruleKey}
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
            onPress={() => navigation.navigate("ProfileEditRuleScreen")}
            onLongPress={() => {
              console.log("long pressed");
              drag();
            }}
            disabled={isActive}
          >
            <ProfileRulesCard
              onPress={() => navigation.navigate("ProfileEditRuleScreen")}
              key={item.ruleKey}
              ruleCardInfo={item}
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
            keyExtractor={(item) => item.ruleKey?.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={SeparatorItem}
          />
        </Box>
      </VStack>
    </PxAppPage>
  );
}

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  EditRule,
  EditConditionFaceCompare,
} from "@systemic-games/pixels-edit-animation";
import {
  Card,
  createPixelTheme,
  createSwipeableSideButton,
  PixelTheme,
  ProfileRulesCard,
  PxAppPage,
} from "@systemic-games/react-native-pixels-components";
import { Box, HStack, Pressable, VStack, Text, Input } from "native-base";
import React from "react";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";

import { selectedProfile } from "./ProfilesListScreen";
import getActionTitles from "./getActionTitles";
import getConditionTitle from "./getConditionTitle";

import { ProfilesScreenStackParamList } from "~/Navigation";
import EditableStore from "~/features/EditableStore";
import DieRenderer from "~/features/render3d/DieRenderer";

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

export let lastSelectedRule: EditRule;

interface CreateRuleWidgetProps {
  onPress?: () => void;
}

/**
 * JSX pressable to create a new editable rule.
 * @param props See {@link CreateRuleWidgetProps} for props params.
 * @returns
 */
function CreateRuleWidget(props: CreateRuleWidgetProps) {
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

function SeparatorItem() {
  return <Box h={2} />;
}

export default function ProfilesRulesScreen() {
  const navigation =
    useNavigation<StackNavigationProp<ProfilesScreenStackParamList>>();

  const [rulesList, setRulesList] = React.useState<EditRule[]>([]);
  useFocusEffect(
    // Refresh rules list
    React.useCallback(
      () => setRulesList([...selectedProfile.profile.rules]),
      []
    )
  );

  function addRule() {
    const newRule = new EditRule(new EditConditionFaceCompare());
    // Register rule
    EditableStore.getKey(newRule);
    setRulesList([...rulesList, newRule]);
  }

  function duplicateRule(ruleToDuplicate: EditRule, index: number) {
    const duplicatedRule = ruleToDuplicate.duplicate();
    // Register duplicated rule
    EditableStore.getKey(duplicatedRule);
    const rules = [...rulesList];
    rules.splice(index + 1, 0, duplicatedRule);
    setRulesList(rules);
  }

  function deleteRule(ruleToDelete: EditRule) {
    const ruleKey = EditableStore.getKey(ruleToDelete);
    const rules = [...rulesList];
    rules.splice(
      rules.findIndex((ruleToDelete) => {
        return EditableStore.getKey(ruleToDelete) === ruleKey;
      }),
      1
    );
    setRulesList(rules);
    // Delete rule from register
    EditableStore.unregister(ruleToDelete);
  }

  function RenderItem({ item, drag, isActive }: RenderItemParams<EditRule>) {
    return (
      <ScaleDecorator>
        <Swipeable
          key={EditableStore.getKey(item)}
          renderRightActions={createSwipeableSideButton({
            w: 120,
            buttons: [
              {
                onPress: () => duplicateRule(item, rulesList.length),
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
              drag();
            }}
            disabled={isActive}
          >
            <ProfileRulesCard
              key={EditableStore.getKey(item)}
              ruleCardInfo={{
                ruleKey: EditableStore.getKey(item),
                actions: getActionTitles(item.actions),
                condition: getConditionTitle(item.condition),
              }}
            />
          </Pressable>
        </Swipeable>
      </ScaleDecorator>
    );
  }

  return (
    <PxAppPage scrollable={false} theme={paleBluePixelTheme}>
      <VStack space={2} width="100%">
        <HStack alignItems="center" width="100%">
          <Box flex={1}>
            <Box w={100} h={100}>
              <DieRenderer />
              {/* TODO animationData={ }  */}
            </Box>
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
        <CreateRuleWidget onPress={addRule} />
        <Box h="68%" p={1}>
          <DraggableFlatList
            data={rulesList}
            onDragEnd={({ data }) => setRulesList(data)}
            keyExtractor={(item) => EditableStore.getKey(item)?.toString()}
            renderItem={RenderItem}
            ItemSeparatorComponent={SeparatorItem}
          />
        </Box>
      </VStack>
    </PxAppPage>
  );
}

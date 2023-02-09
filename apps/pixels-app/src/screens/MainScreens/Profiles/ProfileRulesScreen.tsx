import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  EditRule,
  EditConditionFaceCompare,
  EditProfile,
} from "@systemic-games/pixels-edit-animation";
import {
  Card,
  createSwipeableSideButton,
  ProfileRulesCard,
  PixelAppPage,
  getActionTitles,
  getConditionTitle,
} from "@systemic-games/react-native-pixels-components";
import { Box, HStack, Pressable, VStack, Text, Input } from "native-base";
import React from "react";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";

import EditableStore from "~/features/EditableStore";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfileRulesScreenProps } from "~/navigation";

/**
 * JSX pressable to create a new editable rule.
 * @param props See {@link CreateRuleWidgetProps} for props params.
 * @returns
 */
function CreateRuleWidget({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        onPress();
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

export default function ProfilesRulesScreen({
  navigation,
  route,
}: ProfileRulesScreenProps) {
  const profile = EditableStore.getEditable<EditProfile>(
    route.params.profileId
  );
  const [rulesList, setRulesList] = React.useState<EditRule[]>([]);
  useFocusEffect(
    // Refresh rules list
    React.useCallback(() => setRulesList([...profile.rules]), [profile])
  );

  function addRule() {
    const newRule = new EditRule(new EditConditionFaceCompare());
    profile.rules.push(newRule);
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
              navigation.navigate("ProfileEditRule", {
                ruleId: EditableStore.getKey(item),
              });
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
    <PixelAppPage>
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
    </PixelAppPage>
  );
}

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  EditRule,
  EditConditionFaceCompare,
} from "@systemic-games/pixels-edit-animation";
import {
  Card,
  createSwipeableSideButton,
  ProfileRulesCard,
  PixelAppPage,
  getActionDescription,
  getConditionDescription,
} from "@systemic-games/react-native-pixels-components";
import { Box, HStack, Pressable, VStack, Text } from "native-base";
import React from "react";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";

import { getTempProfileFromUuid, useAppUpdateProfile } from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
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
  const profile = React.useMemo(
    () => getTempProfileFromUuid(route.params.profileUuid),
    [route.params.profileUuid]
  );

  const updateProfile = useAppUpdateProfile();
  React.useEffect(() => {
    return () => {
      // TODO update profile when leaving screen
      updateProfile(profile);
    };
  }, [profile, updateProfile]);

  const [_, forceUpdate] = React.useReducer((b) => !b, false);
  useFocusEffect(
    // TODO refresh screen when coming back from edit rule
    React.useCallback(() => {
      forceUpdate();
    }, [])
  );

  const addRule = React.useCallback(() => {
    const rule = new EditRule(new EditConditionFaceCompare());
    profile.rules.push(rule);
    forceUpdate();
  }, [profile.rules]);

  const duplicateRule = React.useCallback(
    (rule: EditRule) => {
      const dupRule = rule.duplicate();
      profile.rules.splice(profile.rules.indexOf(rule) + 1, 0, dupRule);
      forceUpdate();
    },
    [profile.rules]
  );

  const deleteRule = React.useCallback(
    (rule: EditRule) => {
      const index = profile.rules.indexOf(rule);
      if (index >= 0) {
        profile.rules.splice(index, 1);
        forceUpdate();
      }
    },
    [profile.rules]
  );

  // Simple key generation for DraggableFlatList
  const rulesArrayForKeys = React.useRef<EditRule[]>([]);
  const getKeyForRule = React.useCallback((rule: EditRule) => {
    const arr = rulesArrayForKeys.current;
    let index = arr.indexOf(rule);
    if (index < 0) {
      index = arr.length;
      arr.push(rule);
    }
    return index.toString();
  }, []);

  function RenderItem({
    item: rule,
    drag,
    isActive,
  }: RenderItemParams<EditRule>) {
    return (
      <ScaleDecorator>
        <Swipeable
          renderRightActions={createSwipeableSideButton({
            w: 120,
            buttons: [
              {
                onPress: () => duplicateRule(rule),
                bg: "blue.500",
                icon: (
                  <MaterialIcons name="content-copy" size={24} color="white" />
                ),
              },
              {
                onPress: () => deleteRule(rule),
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
                profileUuid: profile.uuid,
                ruleIndex: profile.rules.indexOf(rule),
              });
            }}
            onLongPress={() => {
              drag();
            }}
            disabled={isActive}
          >
            <ProfileRulesCard
              ruleCardInfo={{
                actions: rule.actions.map(getActionDescription),
                condition: getConditionDescription(rule.condition),
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
              <DieRenderer renderData={getCachedDataSet(profile)} />
            </Box>
          </Box>
          {/* <Box flex={2.5}>
            <Input
              bg="pixelColors.highlightGray"
              variant="filled"
              placeholder="Type Name"
              placeholderTextColor="gray.400"
              value={name}
              onChangeText={(t) => {
                setName(t);
                profile.name = t;
              }}
            />
            <Input
              bg="pixelColors.highlightGray"
              variant="filled"
              placeholder="Type Description"
              placeholderTextColor="gray.400"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                profile.description = t;
              }}
              multiline
            />
          </Box> */}
        </HStack>
        <Text bold>Rules for this profile : </Text>
        <CreateRuleWidget onPress={addRule} />
        <Box h="68%" p={1}>
          <DraggableFlatList
            data={profile.rules}
            onDragEnd={({ data }) => {
              profile.rules.length = 0;
              profile.rules.push(...data);
            }}
            keyExtractor={getKeyForRule}
            renderItem={RenderItem}
            ItemSeparatorComponent={SeparatorItem}
          />
        </Box>
      </VStack>
    </PixelAppPage>
  );
}

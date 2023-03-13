import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  EditRule,
  EditConditionFaceCompare,
} from "@systemic-games/pixels-edit-animation";
import {
  Card,
  ProfileRulesCard,
  PixelAppPage,
  getActionDescription,
  getConditionDescription,
  SwipeableButtons,
  FastVStack,
} from "@systemic-games/react-native-pixels-components";
import { Box, Pressable, Text } from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { StyleSheet } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
  DragEndParams,
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

function DraggableRuleItem({
  navigation,
  rule,
  profileUuid,
  ruleIndex,
  drag,
  isActive,
  duplicateRule,
  deleteRule,
}: {
  navigation: ProfileRulesScreenProps["navigation"];
  rule: EditRule;
  profileUuid: string;
  ruleIndex: number;
  drag: () => void;
  isActive: boolean;
  duplicateRule?: (rule: EditRule) => void;
  deleteRule?: (rule: EditRule) => void;
}) {
  const onPress = React.useCallback(() => {
    navigation.navigate("ProfileEditRule", {
      profileUuid,
      ruleIndex,
    });
  }, [navigation, profileUuid, ruleIndex]);

  const buttons = React.useMemo(
    () => [
      {
        onPress: () => duplicateRule?.(rule),
        bg: "blue.500",
        children: <MaterialIcons name="content-copy" size={24} color="white" />,
      },
      {
        onPress: () => deleteRule?.(rule),
        bg: "red.500",
        children: (
          <MaterialIcons name="delete-outline" size={24} color="white" />
        ),
      },
    ],
    [deleteRule, duplicateRule, rule]
  );

  const renderActions = React.useCallback(
    () => <SwipeableButtons width={120} buttons={buttons} />,
    [buttons]
  );

  const condition = React.useMemo(
    () => getConditionDescription(rule.condition),
    [rule.condition]
  );
  const actions = React.useMemo(
    () => rule.actions.map(getActionDescription),
    [rule.actions]
  );

  return (
    <ScaleDecorator>
      <Swipeable
        containerStyle={styles.ruleItemContainerStyle}
        renderRightActions={renderActions}
      >
        <Pressable onPress={onPress} onLongPress={drag} disabled={isActive}>
          <ProfileRulesCard condition={condition} actions={actions} />
        </Pressable>
      </Swipeable>
    </ScaleDecorator>
  );
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

  const renderItem = React.useCallback(
    ({ item: rule, drag, isActive }: RenderItemParams<EditRule>) => (
      <DraggableRuleItem
        navigation={navigation}
        rule={rule}
        profileUuid={profile.uuid}
        ruleIndex={profile.rules.indexOf(rule)}
        drag={drag}
        isActive={isActive}
        duplicateRule={duplicateRule}
        deleteRule={deleteRule}
      />
    ),
    [deleteRule, duplicateRule, navigation, profile.rules, profile.uuid]
  );

  const onDragEnd = React.useCallback(
    ({ data }: DragEndParams<EditRule>) => {
      profile.rules.length = 0;
      profile.rules.push(...data);
    },
    [profile.rules]
  );
  const containerStyle = React.useMemo(() => ({ flex: 1 }), []);

  return (
    <PixelAppPage>
      <FastVStack w="100%" h="100%">
        <Box alignSelf="center" w={100} h={100}>
          <DieRenderer renderData={getCachedDataSet(profile)} />
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
        <CreateRuleWidget onPress={addRule} />
        <Text bold>Rules for this profile:</Text>
        <DraggableFlatList
          data={profile.rules}
          renderItem={renderItem}
          keyExtractor={getKeyForRule}
          containerStyle={containerStyle}
          onDragEnd={onDragEnd}
        />
      </FastVStack>
    </PixelAppPage>
  );
}

const styles = StyleSheet.create({
  ruleItemContainerStyle: { marginVertical: 4 },
});

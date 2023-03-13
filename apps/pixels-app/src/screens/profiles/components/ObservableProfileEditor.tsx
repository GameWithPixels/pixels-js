import { MaterialIcons } from "@expo/vector-icons";
import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditRule,
  EditConditionFaceCompare,
  EditProfile,
} from "@systemic-games/pixels-edit-animation";
import {
  ProfileRulesCard,
  getActionDescription,
  getConditionDescription,
  SwipeableButtons,
  FastVStack,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import { Box, Input, Pressable, Text } from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { StyleSheet } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
  DragEndParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";

import CreateEntityButton from "~/components/CreateEntityButton";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfileEditScreenProps } from "~/navigation";

const ObservableInputProfileName = observer(function ({
  observableProfile,
}: {
  observableProfile: EditProfile;
}) {
  return (
    <Input
      bg="pixelColors.highlightGray"
      variant="filled"
      placeholder="Type Name"
      placeholderTextColor="gray.400"
      value={observableProfile.name}
      onChangeText={(text) => (observableProfile.name = text)}
    />
  );
});

const ObservableInputProfileDescription = observer(function ({
  observableProfile,
}: {
  observableProfile: EditProfile;
}) {
  return (
    <Input
      bg="pixelColors.highlightGray"
      variant="filled"
      placeholder="Type Description"
      placeholderTextColor="gray.400"
      value={observableProfile.description}
      onChangeText={(text) => (observableProfile.description = text)}
      multiline
    />
  );
});

const ObservableRuleCard = observer(function ({
  observableRule,
}: {
  observableRule: EditRule;
}) {
  return (
    <ProfileRulesCard
      condition={getConditionDescription(observableRule.condition)}
      actions={observableRule.actions.map(getActionDescription)}
    />
  );
});

interface DraggableRuleItemProps {
  navigation: ProfileEditScreenProps["navigation"];
  observableRule: EditRule;
  drag: () => void;
  isActive: boolean;
  duplicate?: (rule: EditRule) => void;
  remove?: (rule: EditRule) => void;
}

const ObservableDraggableRuleItem = observer(function ({
  navigation,
  observableRule,
  drag,
  isActive,
  duplicate,
  remove,
}: DraggableRuleItemProps) {
  const onPress = React.useCallback(() => {
    navigation.navigate("RuleEdit", {
      observableRule,
    });
  }, [navigation, observableRule]);

  const buttons = React.useMemo(
    () => [
      {
        onPress: () => duplicate?.(observableRule),
        bg: "blue.500",
        children: <MaterialIcons name="content-copy" size={24} color="white" />,
      },
      {
        onPress: () => remove?.(observableRule),
        bg: "red.500",
        children: (
          <MaterialIcons name="delete-outline" size={24} color="white" />
        ),
      },
    ],
    [remove, duplicate, observableRule]
  );

  const renderActions = React.useCallback(
    () => <SwipeableButtons width={120} buttons={buttons} />,
    [buttons]
  );

  return (
    <ScaleDecorator>
      <Swipeable
        containerStyle={styles.ruleItemContainerStyle}
        renderRightActions={renderActions}
      >
        <Pressable onPress={onPress} onLongPress={drag} disabled={isActive}>
          <ObservableRuleCard observableRule={observableRule} />
        </Pressable>
      </Swipeable>
    </ScaleDecorator>
  );
});

const ObservableRulesListEditor = observer(function ({
  navigation,
  observableProfile,
}: {
  navigation: ProfileEditScreenProps["navigation"];
  observableProfile: EditProfile;
}) {
  const duplicate = React.useCallback(
    (rule: EditRule) => {
      const rules = [...observableProfile.rules];
      rules.splice(
        observableProfile.rules.indexOf(rule) + 1,
        0,
        rule.duplicate()
      );
      observableProfile.rules = rules;
    },
    [observableProfile]
  );

  const remove = React.useCallback(
    (rule: EditRule) => {
      const index = observableProfile.rules.indexOf(rule);
      assert(index >= 0, "Trying to delete unknown rule");
      const rules = [...observableProfile.rules];
      rules.splice(index, 1);
      observableProfile.rules = rules;
    },
    [observableProfile]
  );

  const renderItem = React.useCallback(
    ({ item: observableRule, drag, isActive }: RenderItemParams<EditRule>) => (
      <ObservableDraggableRuleItem
        navigation={navigation}
        observableRule={observableRule}
        drag={drag}
        isActive={isActive}
        duplicate={duplicate}
        remove={remove}
      />
    ),
    [remove, duplicate, navigation]
  );

  const onDragEnd = React.useCallback(
    ({ data }: DragEndParams<EditRule>) => {
      observableProfile.rules = [...data];
    },
    [observableProfile]
  );

  // Key generator for actions
  const ruleIdsMap = React.useMemo(() => new Map<EditRule, string>(), []);
  const getKey = React.useCallback(
    (rule: EditRule): string => {
      let id = ruleIdsMap.get(rule);
      if (!id) {
        id = (ruleIdsMap.size + 1).toString();
        ruleIdsMap.set(rule, id);
      }
      return id;
    },
    [ruleIdsMap]
  );

  return (
    <DraggableFlatList
      data={observableProfile.rules}
      renderItem={renderItem}
      keyExtractor={getKey}
      containerStyle={styles.rulesListContainerStyle}
      onDragEnd={onDragEnd}
    />
  );
});

// Only children components are observers
export default function ({
  navigation,
  observableProfile,
}: {
  navigation: ProfileEditScreenProps["navigation"];
  observableProfile: EditProfile;
}) {
  const add = React.useCallback(
    () =>
      (observableProfile.rules = [
        ...observableProfile.rules,
        new EditRule(new EditConditionFaceCompare()),
      ]),
    [observableProfile]
  );

  return (
    <FastVStack w="100%" h="100%">
      <Box alignSelf="center" w={100} h={100}>
        <DieRenderer renderData={getCachedDataSet(observableProfile)} />
      </Box>
      <ObservableInputProfileName observableProfile={observableProfile} />
      <ObservableInputProfileDescription
        observableProfile={observableProfile}
      />
      <CreateEntityButton mt={2} onPress={add}>
        CREATE NEW RULE
      </CreateEntityButton>
      <Text mt={2} bold>
        Rules for this profile:
      </Text>
      <ObservableRulesListEditor
        navigation={navigation}
        observableProfile={observableProfile}
      />
    </FastVStack>
  );
}

const styles = StyleSheet.create({
  ruleItemContainerStyle: { marginVertical: 4 },
  rulesListContainerStyle: { flex: 1, marginTop: 4 },
});

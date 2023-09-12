import { MaterialIcons } from "@expo/vector-icons";
import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditRule,
  EditConditionFaceCompare,
  EditProfile,
} from "@systemic-games/pixels-edit-animation";
import {
  ProfileRuleCard,
  getActionDescription,
  getConditionDescription,
  SwipeableButtons,
  BaseVStack,
  BaseBox,
  BaseHStack,
  BaseFlexProps,
  ProfileRuleCardProps,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import React from "react";
import { View } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
  DragEndParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";

import AppStyles from "~/AppStyles";
import IconButton from "~/components/IconButton";
import { TextInputClear } from "~/components/TextInputClear";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";
import { ProfileEditScreenProps } from "~/navigation";

const ObservableInputProfileName = observer(function ({
  observableProfile,
}: {
  observableProfile: EditProfile;
}) {
  return (
    <TextInputClear
      isTitle
      placeholder="Type Name"
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
    <TextInputClear
      multiline
      placeholder="Type Description"
      value={observableProfile.description}
      onChangeText={(text) => (observableProfile.description = text)}
    />
  );
});

const ObservableRuleCard = observer(function ({
  observableRule,
  ...props
}: {
  observableRule: EditRule;
} & ProfileRuleCardProps) {
  return (
    <ProfileRuleCard
      condition={getConditionDescription(observableRule.condition)}
      actions={observableRule.actions.map(getActionDescription)}
      {...props}
    />
  );
});

interface DraggableRuleItemProps extends BaseFlexProps {
  navigation: ProfileEditScreenProps["navigation"];
  observableRule: EditRule;
  drag: () => void;
  isDragged: boolean;
  duplicate?: (rule: EditRule) => void;
  remove?: (rule: EditRule) => void;
}

const ObservableDraggableRuleItem = observer(function ({
  navigation,
  observableRule,
  drag,
  isDragged,
  duplicate,
  remove,
  ...props
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
        bg: "blue",
        children: <MaterialIcons name="content-copy" size={24} color="white" />,
      },
      {
        onPress: () => remove?.(observableRule),
        bg: "red",
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
      <Swipeable renderRightActions={renderActions}>
        <ObservableRuleCard
          onPress={onPress}
          onLongPress={drag}
          disabled={isDragged}
          observableRule={observableRule}
          {...props}
        />
      </Swipeable>
    </ScaleDecorator>
  );
});

function Separator() {
  return <View style={{ height: 10 }} />;
}

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

  const theme = useTheme();
  const renderItem = React.useCallback(
    ({ item: observableRule, drag, isActive }: RenderItemParams<EditRule>) => (
      <ObservableDraggableRuleItem
        borderRadius={(theme.isV3 ? 5 : 1) * theme.roundness}
        borderWidth={1}
        borderColor={theme.colors.primary}
        bg={theme.colors.background}
        p={10}
        navigation={navigation}
        observableRule={observableRule}
        drag={drag}
        isDragged={isActive}
        duplicate={duplicate}
        remove={remove}
      />
    ),
    [remove, duplicate, navigation, theme]
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
      containerStyle={AppStyles.flex}
      onDragEnd={onDragEnd}
      ItemSeparatorComponent={Separator}
    />
  );
});

const ObservableDieRender = observer(function ({
  observableProfile,
}: {
  observableProfile: EditProfile;
}) {
  return (
    <BaseBox w="60%" aspectRatio={1} alignSelf="center">
      <DieRenderer renderData={getCachedDataSet(observableProfile)} />
    </BaseBox>
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
  const createRule = React.useCallback(
    () =>
      (observableProfile.rules = [
        ...observableProfile.rules,
        new EditRule(new EditConditionFaceCompare()),
      ]),
    [observableProfile]
  );

  return (
    <BaseVStack w="100%" h="100%">
      <ObservableInputProfileName observableProfile={observableProfile} />
      <ObservableDieRender observableProfile={observableProfile} />
      <ObservableInputProfileDescription
        observableProfile={observableProfile}
      />
      <BaseHStack mb={5} alignItems="center" justifyContent="space-between">
        <Text variant="bodyLarge">Rules:</Text>
        <IconButton icon="add" onPress={createRule} />
      </BaseHStack>
      <ObservableRulesListEditor
        navigation={navigation}
        observableProfile={observableProfile}
      />
    </BaseVStack>
  );
}

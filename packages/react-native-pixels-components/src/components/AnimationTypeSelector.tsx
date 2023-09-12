import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActionsheetList,
  ActionsheetListItemData,
  BaseFlexProps,
  BaseVStack,
  RoundedBox,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { Text, TouchableRipple } from "react-native-paper";

interface TriggerProps {
  title: string;
}
/**
 * Default trigger component for the AnimationTypeSelection component.
 * @param props See {@link TriggerProps} for props parameters.
 */
function TriggerElement(props: TriggerProps) {
  return (
    <RoundedBox flexDir="row" w="100%" p={2} fill alignItems="center" gap={3}>
      <MaterialCommunityIcons name="light-flood-up" size={24} color="white" />
      <Text>{props.title}</Text>
    </RoundedBox>
  );
}

/**
 * Props for {@link AnimationTypeSelector} component.
 */
interface AnimationTypeSelectorProps extends BaseFlexProps {
  label: string;
  itemsData: ActionsheetListItemData[];
}

/**
 * Component for selecting pattern lighting styles inside an Actionsheet drawer.
 * @param props See {@link AnimationTypeSelectorProps} for props parameters.
 */
export function AnimationTypeSelector({
  label,
  itemsData,
  ...flexProps
}: AnimationTypeSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <BaseVStack gap={5} {...flexProps}>
        <Text>Lighting Style</Text>
        <TouchableRipple onPress={onOpen}>
          <TriggerElement title={label} />
        </TouchableRipple>
      </BaseVStack>

      <ActionsheetList
        isOpen={isOpen}
        onClose={onClose}
        itemsData={itemsData}
      />
    </>
  );
}

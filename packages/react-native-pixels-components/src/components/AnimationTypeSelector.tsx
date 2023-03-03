import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActionSheetList,
  ActionSheetListItemData,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Text,
  HStack,
  ChevronRightIcon,
  Spacer,
  VStack,
  Pressable,
} from "native-base";
import React from "react";

interface TriggerProps {
  title: string;
}
/**
 * Default trigger component for the AnimationTypeSelection component.
 * @param props See {@link TriggerProps} for props parameters.
 */
function TriggerElement(props: TriggerProps) {
  return (
    <HStack
      w="100%"
      p={2}
      bg="primary.700"
      rounded="lg"
      space={2}
      alignItems="center"
    >
      <MaterialCommunityIcons name="light-flood-up" size={24} color="white" />
      <Text>{props.title}</Text>
      <Spacer />
      <ChevronRightIcon tintColor="white" />
    </HStack>
  );
}

/**
 * Props for {@link AnimationTypeSelector} component.
 */
interface AnimationTypeSelectorProps {
  label: string;
  itemsData: ActionSheetListItemData[];
  onSelect?: (() => void) | null;
}

/**
 * Component for selecting pattern lighting styles inside an Actionsheet drawer.
 * @param props See {@link AnimationTypeSelectorProps} for props parameters.
 */
export function AnimationTypeSelector(props: AnimationTypeSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <VStack space={1}>
        <Text bold>Lighting Style</Text>
        <Pressable onPress={onOpen}>
          <TriggerElement title={props.label} />
        </Pressable>
      </VStack>

      <ActionSheetList
        itemsData={props.itemsData}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
}

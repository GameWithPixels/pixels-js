import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActionsheetList,
  ActionsheetListItemData,
  FastBoxProps,
  FastVStack,
  HView,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Text, ChevronRightIcon, Spacer, Pressable } from "native-base";
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
    <HView w="100%" p={2} bg="primary.700" rounded="lg" alignItems="center">
      <MaterialCommunityIcons name="light-flood-up" size={24} color="white" />
      <Text ml={2}>{props.title}</Text>
      <Spacer />
      <ChevronRightIcon tintColor="white" />
    </HView>
  );
}

/**
 * Props for {@link AnimationTypeSelector} component.
 */
interface AnimationTypeSelectorProps extends FastBoxProps {
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
  ...props
}: AnimationTypeSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastVStack {...props}>
        <Text bold>Lighting Style</Text>
        <Pressable mt={1} onPress={onOpen}>
          <TriggerElement title={label} />
        </Pressable>
      </FastVStack>

      <ActionsheetList
        itemsData={itemsData}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
}

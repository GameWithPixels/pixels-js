import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActionSheet } from "@systemic-games/react-native-base-components";
import {
  Box,
  Text,
  HStack,
  ChevronRightIcon,
  Spacer,
  VStack,
} from "native-base";
import React, { ReactNode } from "react";

interface TriggerProps {
  title: string;
}
/**
 * Default trigger component fro the LightingStyleSelection component.
 * @param props See {@link TriggerProps} for props parameters.
 */
function TriggerElement(props: TriggerProps) {
  return (
    <Box w="100%" p={2} bg="primary.700" rounded="lg">
      <HStack space={2} alignItems="center">
        <MaterialCommunityIcons name="light-flood-up" size={24} color="white" />
        <Text>{props.title}</Text>
        <Spacer />
        <ChevronRightIcon tintColor="white" />
      </HStack>
    </Box>
  );
}

/**
 * Props for {@link LightingStyleSelection} component.
 */
interface LightingStyleSelectionProps {
  trigger?: ReactNode; // trigger element to replace the default LightingStyleSelection trigger if needed
}

/**
 * Component for selecting pattern lighting styles inside an Actionsheet drawer.
 * @param props See {@link LightingStyleSelectionProps} for props parameters.
 */
export function LightingStyleSelection(props: LightingStyleSelectionProps) {
  const [lightingTypeText, setLightingType] = React.useState("Simple Flashes");
  return (
    <>
      <VStack space={1}>
        <Text bold>Lighting Style</Text>
        <ActionSheet
          trigger={
            !props.trigger ? (
              <TriggerElement title={lightingTypeText} />
            ) : (
              props.trigger
            )
          }
          title={lightingTypeText}
          itemsData={[
            {
              label: "Simple Flashes",
              onPress: () => {
                setLightingType("Simple Flashes");
              },
            },
            {
              label: "Colorful Rainbow",
              onPress: () => {
                setLightingType("Colorful Rainbow");
              },
            },
            {
              label: "Simple Gradient",
              onPress: () => {
                setLightingType("Simple Gradient");
              },
            },
            {
              label: "Color LED Pattern",
              onPress: () => {
                setLightingType("Color LED Pattern");
              },
            },
            {
              label: "Gradient LED Pattern",
              onPress: () => {
                setLightingType("Gradient LED Pattern");
              },
            },
          ]}
        />
      </VStack>
    </>
  );
}

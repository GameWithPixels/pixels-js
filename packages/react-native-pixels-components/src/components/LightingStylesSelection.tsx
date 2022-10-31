import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActionSheet } from "@systemic-games/react-native-base-components";
import {
  Box,
  Text,
  ChevronDownIcon,
  HStack,
  ChevronRightIcon,
  Spacer,
  VStack,
} from "native-base";
import React from "react";

interface triggerProps {
  title: string;
}
function TriggerElement(props: triggerProps) {
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

// TODO eslint annotation shouldn't be needed here, also function name should start with lower case
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LightingStyleSelection() {
  const [lightingTypeText, SetLightingType] = React.useState("Simple Flashes");
  // TODO just remove unused code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selected, setSelected] = React.useState(1);
  // TODO just remove unused code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [buttonIcon, SetChevronIcon] = React.useState(
    <ChevronDownIcon alignSelf="center" />
  );
  return (
    <>
      <VStack space={1}>
        <Text bold>Lighting Style</Text>
        <ActionSheet
          trigger={<TriggerElement title={lightingTypeText} />}
          title={lightingTypeText}
          triggerLabel={lightingTypeText}
          itemsData={[
            {
              label: "Simple Flashes",
              onPress: () => {
                SetLightingType("Simple Flashes");
              },
            },
            {
              label: "Colorful Rainbow",
              onPress: () => {
                SetLightingType("Colorful Rainbow");
              },
            },
            {
              label: "Simple Gradient",
              onPress: () => {
                SetLightingType("Simple Gradient");
              },
            },
            {
              label: "Color LED Pattern",
              onPress: () => {
                SetLightingType("Color LED Pattern");
              },
            },
            {
              label: "Gradient LED Pattern",
              onPress: () => {
                SetLightingType("Gradient LED Pattern");
              },
            },
          ]}
        />
      </VStack>
    </>
  );
}

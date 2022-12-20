import { ActionSheet } from "@systemic-games/react-native-base-components";
import { HStack, Text } from "native-base";

export default function RuleConditionSelection() {
  return (
    <HStack width="100%" alignItems="center">
      <Text>When</Text>
      <ActionSheet />
    </HStack>
  );
}

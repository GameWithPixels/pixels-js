import { FastHStack } from "@systemic-games/react-native-base-components";
import { Text, View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";

export interface ProfileRulesCardProps extends IViewProps {
  condition?: string;
  actions?: string[];
}

export function ProfileRulesCard({
  condition,
  actions,
  ...flexProps
}: ProfileRulesCardProps) {
  return (
    <View w="100%" rounded="lg" px={3} py={3} bg="darkBlue.800" {...flexProps}>
      <FastHStack flex={1} alignItems="center">
        <Text bold flex={1.5}>
          When
        </Text>
        <Text
          bold
          ml={3}
          flex={8}
          rounded="lg"
          h={35}
          bg="darkBlue.900"
          p={1.5}
        >
          {condition}
        </Text>
      </FastHStack>
      <View mt={2} bg="gray.600" rounded="lg" p={1.5}>
        {actions?.map((action, i) => (
          <FastHStack key={i} mt={i > 0 ? 2 : 0} flex={1} alignItems="center">
            <Text flex={1}>Then</Text>
            <Text ml={3} flex={7} rounded="lg" bg="darkBlue.900" p={1.5}>
              {action}
            </Text>
          </FastHStack>
        ))}
      </View>
    </View>
  );
}

import {
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { Text, View } from "native-base";

export interface ProfileRulesCardProps {
  onPress?: (() => void) | null | undefined;
  condition?: string;
  actions?: string[];
}

export function ProfileRulesCard(props: ProfileRulesCardProps) {
  return (
    <View
      flexDir="row"
      w="100%"
      rounded="lg"
      px={5}
      py={3}
      minH={90}
      bg="darkBlue.800"
    >
      <FastVStack w="100%">
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
            {props.condition}
          </Text>
        </FastHStack>
        <View mt={2} bg="gray.600" rounded="lg" p={1.5}>
          {props.actions?.map((action, i) => (
            <FastHStack key={i} mt={i > 0 ? 2 : 0} flex={1} alignItems="center">
              <Text flex={1}>Then</Text>
              <Text ml={3} flex={7} rounded="lg" bg="darkBlue.900" p={1.5}>
                {action}
              </Text>
            </FastHStack>
          ))}
        </View>
      </FastVStack>
    </View>
  );
}

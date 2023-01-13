import { HStack, VStack, Box, Text } from "native-base";

export interface RuleCardInfo {
  ruleKey: number;
  condition?: string;
  actions?: string[];
}

export interface ProfileRulesCardProps {
  onPress?: (() => void) | null | undefined;
  ruleCardInfo?: RuleCardInfo;
}

export function ProfileRulesCard(props: ProfileRulesCardProps) {
  return (
    <Box rounded="lg" px={5} py={3} minH={90} bg="darkBlue.800">
      <HStack width="100%">
        <VStack space={2} width="100%">
          <HStack space={3} flex={1} alignItems="center">
            <Box flex={1.5}>
              <Text bold>When</Text>
            </Box>
            <Box flex={8} rounded="lg" h={35} bg="darkBlue.900" p={1.5}>
              <Text bold>{props.ruleCardInfo?.condition}</Text>
            </Box>
          </HStack>
          <VStack space={2} bg="gray.600" rounded="lg" p={1.5}>
            {props.ruleCardInfo?.actions?.map((action, i) => (
              <HStack key={i} space={3} flex={1} alignItems="center">
                <Box flex={1}>
                  <Text>Then</Text>
                </Box>
                <Box
                  flex={7}
                  rounded="lg"
                  h={35}
                  w="70%"
                  bg="darkBlue.900"
                  p={1.5}
                >
                  <Text>{action}</Text>
                </Box>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </HStack>
    </Box>
  );
}

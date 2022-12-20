import {
  Box,
  Button,
  VStack,
  Text,
  HStack,
  ChevronDownIcon,
  Actionsheet,
  Spacer,
  useDisclose,
  Pressable,
  ScrollView,
} from "native-base";
import React from "react";

export function RuleComparisonWidget() {
  const [lessSelected, setLessSelected] = React.useState(false);
  const [equalSelected, setEqualSelected] = React.useState(true);
  const [greaterSelected, setGreaterSelected] = React.useState(false);
  return (
    <VStack>
      <Text>Comparison</Text>
      <Box w="100%">
        <Button.Group isAttached>
          <Button
            bg={lessSelected ? "pixelColors.blue" : undefined}
            borderRightWidth={2}
            flex={1}
            onPress={() => {
              setLessSelected(!lessSelected);
            }}
          >
            Less
          </Button>
          <Button
            bg={equalSelected ? "pixelColors.blue" : undefined}
            borderRightWidth={2}
            flex={1}
            onPress={() => {
              setEqualSelected(!equalSelected);
            }}
          >
            Equal
          </Button>
          <Button
            bg={greaterSelected ? "pixelColors.blue" : undefined}
            flex={1}
            onPress={() => {
              setGreaterSelected(!greaterSelected);
            }}
          >
            Greater
          </Button>
        </Button.Group>
      </Box>
    </VStack>
  );
}

export interface RuleConditionSelectionProps {
  //Temporary
  conditions: string[];
  conditionIndex: number;
  widgetIndexInList: number;
}

export function RuleConditionSelection(props: RuleConditionSelectionProps) {
  const [condition, _setCondition] = React.useState(
    props.conditions[props.conditionIndex]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  let title = "When";
  if (props.widgetIndexInList === 0) {
    title = "When";
  } else if (props.widgetIndexInList === 1) {
    title = "Then";
  } else {
    title = "And";
  }

  return (
    <>
      <HStack h={70} width="100%" alignItems="center">
        <Box flex={1}>
          <Text fontSize="2xl">{title}</Text>
        </Box>
        <Pressable flex={2} onPress={onOpen}>
          <HStack
            p={3}
            paddingLeft={4}
            w="100%"
            alignItems="center"
            rounded="lg"
            bg="darkBlue.800"
          >
            <Box flex={2}>
              <Text fontSize="sm">{condition}</Text>
            </Box>
            <Spacer />
            <Box>
              <ChevronDownIcon />
            </Box>
          </HStack>
        </Pressable>
      </HStack>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <ScrollView w="100%">
            {props.conditions.map((condition, key) => (
              <Actionsheet.Item alignItems="center" key={key} width="100%">
                <Text fontSize="md">{condition}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

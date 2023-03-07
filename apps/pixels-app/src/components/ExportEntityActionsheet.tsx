import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { FastHStack } from "@systemic-games/react-native-pixels-components";
import { Actionsheet, IActionsheetProps, Text } from "native-base";
import React from "react";

export function ExportEntityActionsheet(props: IActionsheetProps) {
  return (
    <Actionsheet {...props}>
      <Actionsheet.Content h={180} w="100%">
        <Actionsheet.Item
          w="100%"
          bg="gray.500"
          rounded="md"
          alignItems="center"
        >
          <FastHStack>
            <Text mr={3} fontSize="lg">
              Copy
            </Text>
            <MaterialIcons name="content-copy" size={24} color="white" />
          </FastHStack>
        </Actionsheet.Item>
        <Actionsheet.Item
          w="100%"
          bg="gray.500"
          rounded="md"
          alignItems="center"
        >
          <FastHStack>
            <Text mr={3} fontSize="lg">
              Save as JSON
            </Text>
            <MaterialCommunityIcons name="code-json" size={24} color="white" />
          </FastHStack>
        </Actionsheet.Item>
      </Actionsheet.Content>
    </Actionsheet>
  );
}

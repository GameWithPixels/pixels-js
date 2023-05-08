/* eslint-disable @typescript-eslint/no-unused-vars */
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { FastHStack } from "@systemic-games/react-native-pixels-components";
import React from "react";

export interface ExportEntityActionsheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportEntityActionsheet(props: ExportEntityActionsheetProps) {
  return (
    <></>
    // <Actionsheet {...props}>
    //   <Actionsheet.Content h={180} w="100%">
    //     <Actionsheet.Item
    //       w="100%"
    //       bg="gray"
    //       rounded="md"
    //       alignItems="center"
    //     >
    //       <FastHStack>
    //         <Text>
    //           Copy
    //         </Text>
    //         <MaterialIcons name="content-copy" size={24} color="white" />
    //       </FastHStack>
    //     </Actionsheet.Item>
    //     <Actionsheet.Item
    //       w="100%"
    //       bg="gray"
    //       rounded="md"
    //       alignItems="center"
    //     >
    //       <FastHStack>
    //         <Text>
    //           Save as JSON
    //         </Text>
    //         <MaterialCommunityIcons name="code-json" size={24} color="white" />
    //       </FastHStack>
    //     </Actionsheet.Item>
    //   </Actionsheet.Content>
    // </Actionsheet>
  );
}

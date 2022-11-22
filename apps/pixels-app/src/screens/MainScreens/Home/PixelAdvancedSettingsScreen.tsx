import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PixelTheme,
  createPixelTheme,
  PxAppPage,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  Button,
  Divider,
  HStack,
  Spacer,
  Text,
  VStack,
} from "native-base";
import React from "react";

const paleBluePixelThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#1b94ff",
    "100": "#0081f2",
    "200": "#006cca",
    "300": "#0256a0",
    "400": "#024178",
    "500": "#04345e",
    "600": "#062846",
    "700": "#051b2e",
    "800": "#040f18",
    "900": "#010204",
  },
};
const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);

export default function PixelAdvancedSettingsScreen() {
  return (
    <PxAppPage theme={paleBluePixelTheme}>
      <VStack space={4} paddingTop={5}>
        {/* {Firmware infos} */}
        <Box maxWidth="100%" bg="pixelColors.highlightGray" rounded="md">
          <VStack space={4} p={3} rounded="md" maxWidth="100%">
            <HStack
              alignItems="center"
              rounded="md"
              flex={1}
              space={2}
              maxW="100%"
            >
              <Text isTruncated bold>
                Firmware date :
              </Text>
              <Spacer />
              <Box bg="gray.400" rounded="md" p={2} maxW="100%">
                <Text isTruncated>{new Date().toUTCString()}</Text>
              </Box>
            </HStack>
            <Button
              alignSelf="center"
              w="95%"
              leftIcon={
                <MaterialCommunityIcons name="update" size={24} color="white" />
              }
            >
              <Text bold>Update firmware</Text>
            </Button>
          </VStack>
        </Box>
        <Box>
          <Divider bg="primary.200" width="90%" alignSelf="center" />
          <Text bold paddingBottom={2} paddingTop={5} fontSize="sm">
            Die storage :
          </Text>
          <VStack bg="pixelColors.highlightGray" rounded="md" space={3} p={2}>
            <HStack rounded="md">
              <HStack flex={1} space={2}>
                <Text bold>Available : </Text>
                <Text>2045 bytes</Text>
              </HStack>
              <HStack flex={1} space={2}>
                <Text bold>Total storage : </Text>
                <Text>6349 bytes</Text>
              </HStack>
            </HStack>
            <Divider />
            <HStack space={1}>
              <VStack
                flex={1}
                space={1}
                alignItems="center"
                p={1}
                bg="gray.500"
                rounded="md"
              >
                <Text bold>Patterns </Text>
                <Text>2834 bytes</Text>
              </VStack>
              <VStack
                flex={1}
                space={1}
                alignItems="center"
                p={1}
                bg="gray.500"
                rounded="md"
              >
                <Text bold>LED Patterns </Text>
                <Text>3123 bytes</Text>
              </VStack>
              <VStack
                flex={1}
                space={1}
                alignItems="center"
                p={1}
                bg="gray.500"
                rounded="md"
              >
                <Text bold>Rules </Text>
                <Text>392 bytes</Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>
        <Divider bg="primary.200" width="90%" alignSelf="center" />
        <Button
          w="100%"
          alignSelf="center"
          leftIcon={
            <MaterialCommunityIcons name="target" size={24} color="white" />
          }
        >
          <Text bold>Calibrate</Text>
        </Button>
        <Divider bg="primary.200" width="90%" alignSelf="center" />
        {/* <Button
          w="90%"
          alignSelf="center"
          leftIcon={
            <MaterialIcons
              name="settings-backup-restore"
              size={24}
              color="white"
            />
          }
        >
          <Text bold>Reset Settings</Text>
        </Button>
        <Divider bg="primary.200" width="90%" alignSelf="center" /> */}
        <Button
          w="100%"
          alignSelf="center"
          leftIcon={
            <MaterialCommunityIcons name="restart" size={24} color="white" />
          }
        >
          <Text bold>Reboot</Text>
        </Button>
      </VStack>
    </PxAppPage>
  );
}

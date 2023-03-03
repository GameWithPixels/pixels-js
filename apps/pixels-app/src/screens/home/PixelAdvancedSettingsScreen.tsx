import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import { Color, getPixel } from "@systemic-games/react-native-pixels-connect";
import {
  Box,
  Button,
  Divider,
  HStack,
  ScrollView,
  Spacer,
  Text,
  VStack,
} from "native-base";
import React from "react";

import { PixelAdvancedSettingsScreenProps } from "~/navigation";

export default function PixelAdvancedSettingsScreen(
  props: PixelAdvancedSettingsScreenProps
) {
  const { pixelId } = props.route.params;
  const pixel = getPixel(pixelId);
  return (
    <PixelAppPage>
      <ScrollView height="100%" width="100%">
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
                <Text bold>Firmware Date:</Text>
                <Spacer />
                <Box bg="gray.400" rounded="md" p={2} maxW="100%">
                  <Text isTruncated>{pixel.firmwareDate.toUTCString()}</Text>
                </Box>
              </HStack>
              <Button
                alignSelf="center"
                w="95%"
                leftIcon={
                  <MaterialCommunityIcons
                    name="update"
                    size={24}
                    color="white"
                  />
                }
              >
                <Text bold>Update Firmware</Text>
              </Button>
            </VStack>
          </Box>
          <Box>
            <Text bold paddingBottom={2} paddingTop={5} fontSize="sm">
              Die Storage:
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
                  <Text bold>Patterns</Text>
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
                  <Text bold>Profiles</Text>
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
                  <Text bold>Rules</Text>
                  <Text>392 bytes</Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
          <Button
            w="100%"
            alignSelf="center"
            leftIcon={
              <MaterialCommunityIcons name="target" size={24} color="white" />
            }
          >
            <Text bold>Calibrate</Text>
          </Button>
          <Button
            w="100%"
            alignSelf="center"
            leftIcon={
              <MaterialCommunityIcons name="restart" size={24} color="white" />
            }
            onPress={() => pixel.blink(Color.red)}
          >
            <Text bold>Reboot</Text>
          </Button>
        </VStack>
      </ScrollView>
    </PixelAppPage>
  );
}

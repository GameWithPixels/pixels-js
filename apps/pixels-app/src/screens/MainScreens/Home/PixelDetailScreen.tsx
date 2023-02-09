import {
  FontAwesome5,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  AnimationRainbow,
  Color,
  Constants,
} from "@systemic-games/pixels-edit-animation";
import {
  BatteryLevel,
  LoadingPopup,
  ProfilesScrollView,
  PixelAppPage,
  RSSIStrength,
  sr,
} from "@systemic-games/react-native-pixels-components";
import {
  AnimationBits,
  getPixel,
  usePixel,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import {
  Box,
  Center,
  Text,
  VStack,
  HStack,
  Input,
  Spacer,
  Divider,
  Button,
  ChevronRightIcon,
  Pressable,
  ScrollView,
} from "native-base";
import React from "react";

import DieStatistics from "~/components/DieStatistics";
import { extractDataSet, MyAppDataSet } from "~/features/profiles";
import DieRenderer, { DieRendererProps } from "~/features/render3d/DieRenderer";
import { PixelDetailScreenProps } from "~/navigation";

export default function PixelDetailScreen({
  navigation,
  route,
}: PixelDetailScreenProps) {
  const { systemId } = route.params;
  const pixel = getPixel(systemId);
  const [status, lastError] = usePixel(pixel);
  const [rollState] = usePixelValue(pixel, "rollState");

  const [showLoadingPopup, setShowLoadingPopup] = React.useState(false);
  const [transferProgress, setTransferProgress] = React.useState(0);

  const [animData, setAnimData] = React.useState<
    DieRendererProps["animationData"]
  >(() => {
    const anim = new AnimationRainbow();
    anim.duration = 10000;
    anim.count = 1;
    anim.traveling = true;
    anim.faceMask = Constants.faceMaskAllLEDs;
    const animationBits = new AnimationBits();
    return { animations: anim, animationBits };
  });

  return (
    <>
      <PixelAppPage>
        <ScrollView height="100%" width="100%">
          <VStack space={6} width="100%" maxW="100%">
            <Center bg="white" rounded="lg" px={2}>
              <Input
                InputRightElement={
                  <FontAwesome5 name="pen" size={20} color="black" />
                }
                size="2xl"
                variant="unstyled"
                placeholder={pixel?.name}
                color="black"
              />
            </Center>
            <Center w="100%">
              <HStack space={0} alignItems="center" paddingLeft={5}>
                <Box w="50%" paddingLeft={0}>
                  <Box w={sr(200)} h={sr(200)}>
                    <DieRenderer animationData={animData} />
                  </Box>
                </Box>
                <Spacer />
                <VStack flex={2} space={sr(11)} p={2} rounded="md" w="40%">
                  <Button onPress={() => pixel?.blink(Color.dimOrange)}>
                    <MaterialCommunityIcons
                      name="lightbulb-on-outline"
                      size={24}
                      color="white"
                    />
                  </Button>
                  <VStack bg="pixelColors.highlightGray" rounded="md" p={2}>
                    <BatteryLevel
                      size="xl"
                      percentage={pixel?.batteryLevel ?? 0}
                    />
                    <RSSIStrength percentage={pixel?.rssi ?? 0} size="xl" />
                  </VStack>
                  <Box bg="pixelColors.highlightGray" rounded="md" p={2}>
                    <VStack space={2}>
                      {lastError ? (
                        <Text bold color="red.500" fontSize="md">
                          {`${lastError}`}
                        </Text>
                      ) : (
                        <>
                          <HStack>
                            <Text bold>Face Up:</Text>
                            <Spacer />
                            <Text bold color="green.500" fontSize="md">
                              {`${rollState?.face ?? ""}`}
                            </Text>
                          </HStack>
                          <HStack>
                            <Text bold>Status:</Text>
                            <Spacer />
                            <Text bold color="green.500" fontSize="md">
                              {status}
                            </Text>
                          </HStack>
                        </>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </HStack>
            </Center>

            {/* {Profiles horizontal scroll list} */}
            <Box>
              <HStack alignItems="center" space={2} paddingBottom={2}>
                <AntDesign name="profile" size={24} color="white" />
                <Text bold>Recent Profiles:</Text>
              </HStack>
              <ProfilesScrollView
                profiles={MyAppDataSet.profiles}
                dieRender={(profile) => (
                  <DieRenderer animationData={extractDataSet(profile)} />
                )}
                onPress={(profile) => {
                  if (pixel?.isReady) {
                    setTransferProgress(0);
                    setShowLoadingPopup(true);
                    pixel
                      ?.transferDataSet(
                        extractDataSet(profile),
                        setTransferProgress
                      )
                      .then(() => setAnimData(extractDataSet(profile)))
                      .catch(console.error)
                      .finally(() => setShowLoadingPopup(false));
                  }
                }}
              />
            </Box>

            {/* Dice Stats is used without params until we switch to real data */}
            <DieStatistics />
            {/* {Advanced Settings infos} */}
            <Divider bg="primary.200" width="90%" alignSelf="center" />
            <Pressable
              onPress={() => {
                navigation.navigate("PixelAdvancedSettings", { systemId });
              }}
            >
              <HStack
                alignItems="center"
                bg="primary.500"
                p={3}
                rounded="md"
                w="100%"
                alignSelf="center"
              >
                <Text bold>Advanced Settings</Text>
                <Spacer />
                <ChevronRightIcon />
              </HStack>
            </Pressable>

            <Divider bg="primary.200" width="90%" alignSelf="center" />
            <Button
              leftIcon={<AntDesign name="disconnect" size={24} color="white" />}
              w="100%"
              alignSelf="center"
            >
              <Text bold>Unpair</Text>
            </Button>
          </VStack>
        </ScrollView>
      </PixelAppPage>

      <LoadingPopup
        title="Uploading profile..."
        isOpen={showLoadingPopup}
        progress={transferProgress}
      />
    </>
  );
}

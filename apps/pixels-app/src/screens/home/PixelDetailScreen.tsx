import {
  FontAwesome5,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  Color,
  EditActionMakeWebRequest,
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

import {
  useAppProfiles,
  useAppPairedDice,
  useAppRemovePairedDie,
  useAppUpdatePairedDie,
} from "~/app/hooks";
import DieStatistics from "~/components/DieStatistics";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import httpPost from "~/features/httpPost";
import DieRenderer from "~/features/render3d/DieRenderer";
import { PixelDetailScreenProps } from "~/navigation";

export default function PixelDetailScreen({
  navigation,
  route,
}: PixelDetailScreenProps) {
  const { systemId } = route.params;
  const pixel = getPixel(systemId);
  const [status, lastError] = usePixel(pixel);
  const [rollState] = usePixelValue(pixel, "rollState", { minInterval: 100 });

  const pairedDice = useAppPairedDice();
  const updatePairedDie = useAppUpdatePairedDie();
  const removePairedDie = useAppRemovePairedDie();

  const profiles = useAppProfiles();
  const activeProfile = React.useMemo(() => {
    const die = pairedDice.find((d) => d.systemId === systemId);
    return profiles.find((p) => p.uuid === die?.profileUuid);
  }, [pairedDice, profiles, systemId]);

  React.useEffect(() => {
    if (pixel) {
      const onRemoteAction = (actionId: number) => {
        if (activeProfile) {
          const action = activeProfile.getRemoteAction(actionId);
          if (action instanceof EditActionMakeWebRequest) {
            console.log(
              `Running remote action for web request with id=${actionId} at URL "${action.url}" with value "${action.value}"`
            );
            if (!__DEV__) {
              httpPost(
                action.url,
                pixel.name,
                action.value,
                activeProfile.name
              ).then((status) =>
                console.log(
                  `Post request to ${action.url} returned with status ${status}`
                )
              );
            } else {
              console.log(
                "Running web request actions is disabled in development builds"
              );
            }
          } else {
            console.warn(
              `Ignoring running action with id ${actionId} for profile ${
                activeProfile.name
              } because ${
                action
                  ? "the action is not a web request"
                  : "there is no such action"
              }`
            );
          }
        }
      };
      pixel.addEventListener("remoteAction", onRemoteAction);
      return () => {
        pixel.removeEventListener("remoteAction", onRemoteAction);
      };
    }
  }, [activeProfile, pixel]);

  const [sessionRolls, setSessionRolls] = React.useState<number[]>(() =>
    new Array(20).fill(0)
  );
  React.useEffect(() => {
    if (rollState && rollState.state === "onFace") {
      setSessionRolls((rolls) => {
        const newRolls = [...rolls];
        const i = rollState.face - 1;
        newRolls[i] = newRolls[i] + 1;
        return newRolls;
      });
    }
  }, [rollState]);

  const lifetimeRolls = React.useMemo(
    () => [
      30, 25, 21, 42, 32, 65, 78, 88, 98, 83, 51, 32, 94, 93, 45, 91, 12, 56,
      35, 45,
    ],
    []
  );

  const [showLoadingPopup, setShowLoadingPopup] = React.useState(false);
  const [transferProgress, setTransferProgress] = React.useState(0);

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
                placeholder={pixel.name}
                color="black"
              />
            </Center>
            <Center w="100%">
              <HStack space={0} alignItems="center" paddingLeft={5}>
                <Box w="50%" paddingLeft={0}>
                  <Box w={sr(200)} h={sr(200)}>
                    <DieRenderer
                      renderData={
                        activeProfile && getCachedDataSet(activeProfile)
                      }
                    />
                  </Box>
                </Box>
                <Spacer />
                <VStack flex={2} space={sr(11)} p={2} rounded="md" w="40%">
                  <Button onPress={() => pixel.blink(Color.dimOrange)}>
                    <MaterialCommunityIcons
                      name="lightbulb-on-outline"
                      size={24}
                      color="white"
                    />
                  </Button>
                  <VStack bg="pixelColors.highlightGray" rounded="md" p={2}>
                    <BatteryLevel
                      size="xl"
                      percentage={pixel.batteryLevel}
                      isCharging={pixel.isCharging}
                    />
                    <RSSIStrength percentage={pixel.rssi} size="xl" />
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
                              {`\n${rollState?.state ?? ""}`}
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

            {/* Profiles horizontal scroll list */}
            <Box>
              <HStack alignItems="center" space={2} paddingBottom={2}>
                <AntDesign name="profile" size={24} color="white" />
                <Text bold>Recent Profiles:</Text>
              </HStack>
              <ProfilesScrollView
                profiles={profiles}
                dieRender={(profile) => (
                  <DieRenderer renderData={getCachedDataSet(profile)} />
                )}
                onPress={(profile) => {
                  if (pixel.isReady) {
                    setTransferProgress(0);
                    setShowLoadingPopup(true);
                    pixel
                      ?.transferDataSet(
                        getCachedDataSet(profile),
                        setTransferProgress
                      )
                      .then(() =>
                        updatePairedDie({ systemId, profileUuid: profile.uuid })
                      )
                      .catch(console.error)
                      .finally(() => setShowLoadingPopup(false));
                  }
                }}
              />
            </Box>

            {/* Die Stats */}
            <DieStatistics
              sessionRolls={sessionRolls}
              lifetimeRolls={lifetimeRolls}
            />

            {/* Advanced Settings infos */}
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
              onPress={() => {
                removePairedDie(systemId);
                navigation.goBack();
              }}
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

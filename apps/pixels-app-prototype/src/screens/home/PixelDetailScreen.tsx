import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Color,
  EditActionMakeWebRequest,
} from "@systemic-games/pixels-edit-animation";
import {
  BatteryLevel,
  BaseBox,
  BaseButton,
  BaseHStack,
  BaseVStack,
  LoadingPopup,
  PixelAppPage,
  RSSIStrength,
} from "@systemic-games/react-native-pixels-components";
import {
  getPixelOrThrow,
  usePixel,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import {
  useAppProfiles,
  useAppPairedDice,
  useAppRemovePairedDie,
  useAppUpdatePairedDie,
} from "~/app/hooks";
import { DieStatistics } from "~/components/DieStatistics";
import { ProfileCarousel } from "~/components/ProfileCarousel";
import { TextInputClear } from "~/components/TextInputClear";
import { getCachedDataSet } from "~/features/appDataSet/getCachedDataSet";
import { httpPost } from "~/features/httpPost";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { PixelDetailScreenProps } from "~/navigation";

export function PixelDetailScreen({
  navigation,
  route,
}: PixelDetailScreenProps) {
  const { pixelId } = route.params;
  const pixel = getPixelOrThrow(pixelId);
  const [status, lastError] = usePixel(pixel);
  const [rollState] = usePixelValue(pixel, "rollState", { minInterval: 100 });

  const pairedDice = useAppPairedDice();
  const updatePairedDie = useAppUpdatePairedDie();
  const removePairedDie = useAppRemovePairedDie();

  const profiles = useAppProfiles();
  const activeProfile = React.useMemo(() => {
    const die = pairedDice.find((d) => d.pixelId === pixelId);
    return profiles.find((p) => p.uuid === die?.profileUuid);
  }, [pairedDice, profiles, pixelId]);

  // Web request handling
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

  // Stats
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
  const theme = useTheme();

  return (
    <>
      <PixelAppPage>
        <ScrollView style={AppStyles.fullSizeFlex}>
          <TextInputClear isTitle placeholder={pixel.name} />
          <BaseHStack w="100%">
            <BaseBox w="60%" aspectRatio={1}>
              <DieRenderer
                renderData={activeProfile && getCachedDataSet(activeProfile)}
              />
            </BaseBox>
            <BaseVStack
              flex={1}
              alignItems="center"
              justifyContent="space-around"
              gap={5}
            >
              <BaseButton onPress={() => pixel.blink(Color.dimOrange)}>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={24}
                  color={theme.colors.onPrimaryContainer}
                />
              </BaseButton>
              <BaseHStack
                w="100%"
                alignItems="center"
                justifyContent="space-around"
              >
                <BatteryLevel
                  level={pixel.batteryLevel}
                  isCharging={pixel.isCharging}
                  iconSize={24}
                />
                <RSSIStrength strength={pixel.rssi} iconSize={24} />
              </BaseHStack>
              {lastError ? (
                <Text style={{ color: theme.colors.error }}>
                  {`${lastError}`}
                </Text>
              ) : (
                <>
                  {rollState && (
                    <Text variant="bodyLarge">{`Face: ${rollState.face}\n${rollState.state}`}</Text>
                  )}
                  <Text variant="bodyLarge">{status}</Text>
                </>
              )}
            </BaseVStack>
          </BaseHStack>

          <BaseVStack gap={10} w="100%" marginBottom={10}>
            {/* Profiles horizontal scroll list */}
            <BaseVStack>
              <BaseHStack alignItems="center" gap={5}>
                <AntDesign name="profile" size={24} color="white" />
                <Text variant="titleMedium">Recent Profiles:</Text>
              </BaseHStack>
              <ProfileCarousel
                height={100}
                dieViewSize={50}
                profiles={profiles}
                dieRenderer={(profile) => (
                  <DieRenderer renderData={getCachedDataSet(profile)} />
                )}
                onProfileSelect={(profile) => {
                  if (pixel.isReady) {
                    setTransferProgress(0);
                    setShowLoadingPopup(true);
                    pixel
                      ?.transferDataSet(
                        getCachedDataSet(profile),
                        setTransferProgress
                      )
                      .then(() =>
                        updatePairedDie({ pixelId, profileUuid: profile.uuid })
                      )
                      .catch(console.error)
                      .finally(() => setShowLoadingPopup(false));
                  }
                }}
              />
            </BaseVStack>

            {/* Die Stats */}
            <DieStatistics
              sessionRolls={sessionRolls}
              lifetimeRolls={lifetimeRolls}
            />

            {/* Advanced Settings infos */}
            <BaseButton
              // icon="chevron"
              onPress={() => {
                navigation.navigate("PixelAdvancedSettings", { pixelId });
              }}
            >
              Advanced Settings
            </BaseButton>

            <BaseButton
              // icon={<AntDesign name="disconnect" size={24} color="white" />}
              onPress={() => {
                removePairedDie(pixelId);
                navigation.goBack();
              }}
            >
              Unpair
            </BaseButton>
          </BaseVStack>
        </ScrollView>
      </PixelAppPage>

      <LoadingPopup
        title="Uploading profile..."
        visible={showLoadingPopup}
        progress={transferProgress / 100}
      />
    </>
  );
}

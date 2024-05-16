import {
  Pixel,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React, { useEffect } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";

import { EditProfile } from "../profiles/components/EditProfile";
import { ProfileMenu } from "../profiles/components/ProfileMenu";
import { RuleIndex } from "../profiles/components/RuleCard";

import { useAppSelector, useAppStore } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { makeTransparent } from "~/components/colors";
import { programProfile } from "~/features/dice";
import {
  useActiveProfile,
  useCommitEditableProfile,
  useEditableProfile,
  useWatchedPixel,
} from "~/hooks";
import { EditDieProfileScreenProps } from "~/navigation";

function AutoProgramProfile({
  pixel,
  profileUuid,
}: {
  pixel: Pixel;
  profileUuid: string;
}) {
  const store = useAppStore();
  const version = useAppSelector(
    (state) => state.appTransient.editableProfile?.version ?? 0
  );
  const profile = useEditableProfile(profileUuid);
  useEffect(() => {
    if (version > 0) {
      programProfile(pixel, profile, store);
    }
  }, [pixel, profile, store, version]);
  return <></>;
}

function EditDieProfilePage({
  pixel,
  navigation,
}: {
  pixel: Pixel;
  navigation: EditDieProfileScreenProps["navigation"];
}) {
  const [pixelName] = usePixelValue(pixel, "name");
  const activeProfile = useActiveProfile(pixel);

  // Discard changes when leaving the screen
  // Note: all changes should have already been saved automatically
  const { discardProfile } = useCommitEditableProfile();
  useEffect(() => {
    return () => discardProfile(activeProfile.uuid);
  }, [activeProfile.uuid, discardProfile]);

  const editRule = React.useCallback(
    (ruleIndex: RuleIndex) => {
      if (ruleIndex.conditionType === "rolled") {
        navigation.navigate("editRollRules", ruleIndex);
      } else {
        navigation.navigate("editRule", ruleIndex);
      }
    },
    [navigation]
  );
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const color = actionsMenuVisible
    ? colors.onSurfaceDisabled
    : colors.onSurface;
  const profileUuid = activeProfile.uuid;
  return (
    <View style={{ height: "100%" }}>
      <AutoProgramProfile pixel={pixel} profileUuid={profileUuid} />
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        <Pressable
          sentry-label="actions-menu"
          style={{
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
          onPress={() => setActionsMenuVisible(true)}
        >
          <Text variant="bodyLarge" style={{ paddingHorizontal: 5, color }}>
            {`${pixelName}'s Profile`}
          </Text>
          <ChevronDownIcon
            size={18}
            color={color}
            backgroundColor={makeTransparent(colors.onBackground, 0.2)}
            style={{ marginBottom: 3 }}
          />
          <ProfileMenu
            visible={actionsMenuVisible}
            anchor={{ x: (windowWidth - 230) / 2, y: 40 }}
            onDismiss={() => setActionsMenuVisible(false)}
            onAdvancedOptions={() =>
              navigation.navigate("editAdvancedSettings", { profileUuid })
            }
          />
        </Pressable>
      </PageHeader>
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
        automaticallyAdjustKeyboardInsets
      >
        <EditProfile profileUuid={profileUuid} unnamed onEditRule={editRule} />
      </GHScrollView>
    </View>
  );
}

export function EditDieProfileScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: EditDieProfileScreenProps) {
  const pixel = useWatchedPixel(pixelId);
  return (
    <AppBackground>
      {pixel && <EditDieProfilePage pixel={pixel} navigation={navigation} />}
    </AppBackground>
  );
}

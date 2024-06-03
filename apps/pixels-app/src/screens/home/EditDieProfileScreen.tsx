import { Serializable } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Alert, Pressable, useWindowDimensions, View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";

import { EditProfile } from "../profiles/components/EditProfile";
import { ProfileMenu } from "../profiles/components/ProfileMenu";
import { RuleIndex } from "../profiles/components/RuleCard";

import { PairedDie } from "~/app/PairedDie";
import { useAppStore } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { makeTransparent } from "~/components/colors";
import { Library } from "~/features/store";
import { readProfile } from "~/features/store/profiles";
import { usePairedDieProfileUuid, useSetSelectedPairedDie } from "~/hooks";
import { EditDieProfileScreenProps } from "~/navigation";

function EditDieProfilePage({
  pairedDie,
  navigation,
}: {
  pairedDie: PairedDie;
  navigation: EditDieProfileScreenProps["navigation"];
}) {
  const profileUuid = usePairedDieProfileUuid(pairedDie);

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
  return (
    <View style={{ height: "100%" }}>
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
            {`${pairedDie.name}'s Profile`}
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
  const store = useAppStore();
  const pairedDie = useSetSelectedPairedDie(pixelId);
  React.useEffect(() => {
    if (pairedDie) {
      return navigation.addListener("beforeRemove", (e) => {
        const item = store
          .getState()
          .pairedDice.paired.find((i) => i.die.pixelId === pixelId);
        const sourceUuid = item?.profile.sourceUuid;
        if (sourceUuid) {
          const name =
            store.getState().library.profiles.entities[sourceUuid]?.name;
          if (name) {
            e.preventDefault();
            Alert.alert(
              `Copy changes to profile '${name}'?`,
              "You have made changes to your die profile, do you want to update the original profile as well?",
              [
                {
                  text: "Yes",
                  style: "default",
                  onPress: () => {
                    store.dispatch(
                      Library.Profiles.update({
                        ...Serializable.fromProfile(
                          readProfile(
                            item.die.profileUuid,
                            store.getState().library
                          )
                        ),
                        uuid: sourceUuid,
                      })
                    );
                    readProfile(sourceUuid, store.getState().library);
                    navigation.dispatch(e.data.action);
                  },
                },
                {
                  text: "No",
                  style: "cancel",
                  onPress: () => navigation.dispatch(e.data.action),
                },
              ]
            );
          }
        }
      });
    }
  }, [navigation, pairedDie, pixelId, store]);
  if (!pairedDie) {
    navigation.goBack();
    return null;
  }
  return (
    <AppBackground>
      <EditDieProfilePage pairedDie={pairedDie} navigation={navigation} />
    </AppBackground>
  );
}

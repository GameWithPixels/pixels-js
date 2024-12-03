import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text } from "react-native-paper";

import { useAppSelector, useAppStore } from "~/app/hooks";
import { DiceRollerSettingsScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { FloatingAddButton, OutlineButton } from "~/components/buttons";
import { EmptyRollerSettingsCard } from "~/components/cards";
import { CompositeProfilesList } from "~/components/compositeProfile";
import { generateProfileUuid } from "~/features/profiles";
import { setActiveRollerProfileUuid } from "~/features/store";
import { useOptionalCompositeProfile } from "~/hooks";
import {
  useCompositeProfilesList,
  useEditCompositeProfilesList,
} from "~/hooks/useCompositeProfilesList";

function DiceRollerSettingsPage({
  navigation,
}: {
  navigation: DiceRollerSettingsScreenProps["navigation"];
}) {
  const store = useAppStore();
  const profiles = useCompositeProfilesList();

  const activeProfile = useOptionalCompositeProfile(
    useAppSelector((state) => state.diceRoller.activeProfileUuid)
  );
  const { addProfile } = useEditCompositeProfilesList();
  const createProfile = () => {
    const uuid = generateProfileUuid(store.getState().library);
    addProfile(
      new Profiles.CompositeProfile({
        uuid,
        name: `Composite Profile #${profiles.length + 1}`,
      })
    );
    navigation.navigate("editCompositeProfile", {
      profileUuid: uuid,
    });
  };

  return (
    <>
      <PageHeader mode="arrow-left" onGoBack={navigation.goBack}>
        Dice Roller Settings
      </PageHeader>
      <GHScrollView
        style={{ height: "100%" }}
        contentContainerStyle={{
          padding: 10,
          paddingBottom: 90, // Leave room for the FAB "+" button
          gap: 10,
        }}
        scrollEventThrottle={16}
        snapToEnd={false}
      >
        {profiles.length ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="titleMedium" style={{ marginLeft: 10 }}>
                Composite Profiles
              </Text>
              <View style={{ flex: 1 }} />
              {activeProfile && (
                <OutlineButton
                  onPress={() => store.dispatch(setActiveRollerProfileUuid(""))}
                  style={{ alignSelf: "flex-end" }}
                >
                  Use None
                </OutlineButton>
              )}
            </View>
            <CompositeProfilesList
              profiles={profiles}
              selected={activeProfile}
              onSelectProfile={(p) =>
                store.dispatch(setActiveRollerProfileUuid(p.uuid))
              }
              onLongPressProfile={(p) =>
                navigation.navigate("editCompositeProfile", {
                  profileUuid: p.uuid,
                })
              }
            />
          </>
        ) : (
          <EmptyRollerSettingsCard onPress={createProfile} />
        )}
      </GHScrollView>
      {profiles.length > 0 && (
        <FloatingAddButton
          sentry-label="add-composite-profile"
          onPress={createProfile}
        />
      )}
    </>
  );
}

export function DiceRollerSettingsScreen({
  navigation,
}: DiceRollerSettingsScreenProps) {
  return (
    <AppBackground topLevel>
      <DiceRollerSettingsPage navigation={navigation} />
    </AppBackground>
  );
}

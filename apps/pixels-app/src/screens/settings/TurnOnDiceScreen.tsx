import React from "react";
import { ScrollView, View } from "react-native";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { TurnOnDiceHelp } from "~/components/TunOnDiceHelp";
import { TurnOnDiceScreenProps } from "~/navigation";

function TurnOnDicePage({
  navigation,
}: {
  navigation: TurnOnDiceScreenProps["navigation"];
}) {
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        How To Turn On Your Dice
      </PageHeader>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <TurnOnDiceHelp />
      </ScrollView>
    </View>
  );
}
export function TurnOnDiceScreen({ navigation }: TurnOnDiceScreenProps) {
  return (
    <AppBackground>
      <TurnOnDicePage navigation={navigation} />
    </AppBackground>
  );
}

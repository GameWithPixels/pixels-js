import { StackNavigationProp } from "@react-navigation/stack";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ScrollView } from "react-native";

import { AppBackground } from "~/components/AppBackground";
import { ColorDesignPicker } from "~/components/ColorDesignPicker";
import { PageHeader } from "~/components/PageHeader";
import {
  AnimationsStackParamList,
  PickColorDesignScreenProps,
} from "~/navigation";

function PickColorDesignPage({
  pattern,
  onSelectPattern,
  navigation,
}: {
  pattern?: Readonly<Profiles.Pattern>;
  onSelectPattern?: (pattern: Readonly<Profiles.Pattern>) => void;
  navigation: StackNavigationProp<AnimationsStackParamList>;
}) {
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        mode="chevron-down"
        title="Select a Scheme.ColorDesign"
        onGoBack={() => navigation.goBack()}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <ColorDesignPicker
          pattern={pattern}
          onSelectPattern={onSelectPattern}
          style={{ flex: 1, flexGrow: 1, marginHorizontal: 10 }}
        />
      </ScrollView>
    </View>
  );
}

export function PickColorDesignScreen({
  route: {
    params: { pattern, onSelectPattern },
  },
  navigation,
}: PickColorDesignScreenProps) {
  return (
    <AppBackground>
      <PickColorDesignPage
        pattern={pattern}
        onSelectPattern={onSelectPattern}
        navigation={navigation}
      />
    </AppBackground>
  );
}

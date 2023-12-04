import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View, ScrollView } from "react-native";

import { AppBackground } from "~/components/AppBackground";
import { ColorDesignPicker } from "~/components/ColorDesignPicker";
import { PageHeader } from "~/components/PageHeader";
import {
  AnimationsStackParamList,
  PickColorDesignScreenProps,
} from "~/navigation";
import { ColorDesign } from "~/temp";

function PickColorDesignPage({
  colorDesign,
  onSelectDesign,
  navigation,
}: {
  colorDesign?: ColorDesign;
  onSelectDesign?: (colorDesign: ColorDesign) => void;
  navigation: StackNavigationProp<AnimationsStackParamList>;
}) {
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        mode="chevron-down"
        title="Select a ColorDesign"
        onGoBack={() => navigation.goBack()}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <ColorDesignPicker
          colorDesign={colorDesign}
          onSelectDesign={onSelectDesign}
          style={{ flex: 1, flexGrow: 1, marginHorizontal: 10 }}
        />
      </ScrollView>
    </View>
  );
}

export function PickColorDesignScreen({
  route: {
    params: { colorDesign, onSelectDesign },
  },
  navigation,
}: PickColorDesignScreenProps) {
  return (
    <AppBackground>
      <PickColorDesignPage
        colorDesign={colorDesign}
        onSelectDesign={onSelectDesign}
        navigation={navigation}
      />
    </AppBackground>
  );
}

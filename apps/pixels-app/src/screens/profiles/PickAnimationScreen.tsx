import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { ScrollView, View } from "react-native";

import { AnimationPicker } from "@/components/AnimationPicker";
import { AppBackground } from "@/components/AppBackground";
import { PageHeader } from "@/components/PageHeader";
import {
  EditProfileSubStackParamList,
  PickAnimationScreenProps,
} from "@/navigation";
import { PixelAnimation } from "@/temp";

function PickAnimationPage({
  animation,
  onSelectAnimation,
  navigation,
}: {
  animation?: PixelAnimation;
  onSelectAnimation?: (animation: PixelAnimation) => void;
  navigation: StackNavigationProp<EditProfileSubStackParamList>;
}) {
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        mode="chevron-down"
        title="Select an Animation"
        onGoBack={() => navigation.goBack()}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <AnimationPicker
          animation={animation}
          onSelectAnimation={onSelectAnimation}
          style={{
            flex: 1,
            flexGrow: 1,
            marginHorizontal: 10,
            marginBottom: 10,
          }}
        />
      </ScrollView>
    </View>
  );
}

export function PickAnimationScreen({
  route: {
    params: { animation, onSelectAnimation },
  },
  navigation,
}: PickAnimationScreenProps) {
  return (
    <AppBackground>
      <PickAnimationPage
        animation={animation}
        onSelectAnimation={onSelectAnimation}
        navigation={navigation}
      />
    </AppBackground>
  );
}

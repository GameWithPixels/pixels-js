import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View } from "react-native";

import { AppBackground } from "@/components/AppBackground";
import { PageHeader } from "@/components/PageHeader";
import { ProfilePicker } from "@/components/ProfilePicker";
import { usePixelProfile, usePairedPixel } from "@/hooks";
import {
  HomeStackParamList,
  PickProfileAndroidScreenProps,
  PickProfileScreenProps,
} from "@/navigation";

function PickProfilePage({
  pixelId,
  navigation,
}: {
  pixelId: number;
  navigation: StackNavigationProp<HomeStackParamList>;
}) {
  const pixel = usePairedPixel(pixelId);
  const { profile, changeProfile } = usePixelProfile(pixel);
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        mode="chevron-down"
        title="Select a Profile"
        onGoBack={() => navigation.goBack()}
      />
      <ProfilePicker
        selected={profile}
        onSelectProfile={(profile) => {
          // TODO check if already transferring
          changeProfile(profile);
          navigation.goBack();
        }}
        style={{ flex: 1, flexGrow: 1, marginHorizontal: 10 }}
      />
    </View>
  );
}

export function PickProfileScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: PickProfileScreenProps) {
  return (
    <AppBackground>
      <PickProfilePage pixelId={pixelId} navigation={navigation} />
    </AppBackground>
  );
}

export function PickProfileScreenAndroid({
  route: {
    params: { pixelId },
  },
  navigation,
}: PickProfileAndroidScreenProps) {
  return (
    <AppBackground>
      <PickProfilePage pixelId={pixelId} navigation={navigation} />
    </AppBackground>
  );
}

import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";

import { EditProfile } from "../profiles/components/EditProfile";

import { AppBackground } from "@/components/AppBackground";
import { PageHeader } from "@/components/PageHeader";
import { usePixelProfile, usePairedPixel } from "@/hooks";
import { EditDieProfileScreenProps, HomeStackParamList } from "@/navigation";

function EditDieProfilePage({
  pixelId,
  navigation,
}: {
  pixelId: number;
  navigation: StackNavigationProp<HomeStackParamList>;
}) {
  const pixel = usePairedPixel(pixelId);
  const { profile } = usePixelProfile(pixel);
  if (!profile) {
    // TODO create profile
    navigation.goBack();
    console.warn("No profile found for pixel", pixelId);
    return null;
  }
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        mode="chevron-down"
        title={`${pixel?.name}'s Profile`}
        onGoBack={() => navigation.goBack()}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile profileUuid={profile.uuid} unnamed />
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
  return (
    <AppBackground>
      <EditDieProfilePage pixelId={pixelId} navigation={navigation} />
    </AppBackground>
  );
}

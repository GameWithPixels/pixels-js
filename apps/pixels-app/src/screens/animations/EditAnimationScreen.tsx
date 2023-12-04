import { StackNavigationProp } from "@react-navigation/stack";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import React from "react";
import { View, ScrollView } from "react-native";
import { Switch, Text, TextInput, useTheme } from "react-native-paper";

import { AppBackground } from "@/components/AppBackground";
import { PageHeader } from "@/components/PageHeader";
import { SliderWithTitle } from "@/components/SliderWithTitle";
import {
  ButtonWithCarets,
  GradientButton,
  MenuButton,
  OutlineButton,
} from "@/components/buttons";
import { useAnimation, useAnimations, useConfirmActionSheet } from "@/hooks";
import {
  AnimationsStackParamList,
  EditAnimationScreenProps,
} from "@/navigation";
import { DieRenderer } from "@/render3d/DieRenderer";
import { ColorDesign } from "@/temp";

function EditAnimationPage({
  animationUuid,
  navigation,
}: {
  animationUuid: string;
  navigation: StackNavigationProp<AnimationsStackParamList>;
}) {
  const { animations, removeAnimation } = useAnimations();
  const { name } = useAnimation(animationUuid, animations);
  const showConfirmDelete = useConfirmActionSheet("Delete", () => {
    removeAnimation(animationUuid);
    navigation.popToTop();
  });
  const [duration, setDuration] = React.useState(1);
  const [repeatCount, setRepeatCount] = React.useState(1);
  const [colorOverride, setColorOverride] = React.useState(false);
  const [colorDesign, setColorDesign] = React.useState<ColorDesign>();
  const [travelingOrder, setTravelingOrder] = React.useState(false);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <AppBackground>
      <View style={{ flex: 1 }}>
        <PageHeader
          mode="chevron-down"
          title={name}
          onGoBack={() => navigation.goBack()}
        />
        <ScrollView
          contentContainerStyle={{
            gap: 10,
            paddingHorizontal: 10,
            paddingBottom: 20,
          }}
        >
          <View style={{ width: 200, aspectRatio: 1, alignSelf: "center" }}>
            <DieRenderer dieType="d20" colorway="hematiteGrey" />
          </View>
          <GradientButton
            style={{ width: "50%", alignSelf: "center" }}
            onPress={() => {}}
          >
            Preview on die
          </GradientButton>
          <Text>Profile Name</Text>
          <TextInput
            mode="outlined"
            dense
            style={{ backgroundColor: colors.elevation.level0 }}
            value={name}
          />
          <SliderWithTitle
            title="Duration"
            unit=" s"
            fractionDigits={1}
            value={duration}
            minimumValue={1}
            maximumValue={15}
            step={0.1}
            onValueChange={setDuration}
          />
          <Text>Apply to Faces</Text>
          <ButtonWithCarets onLeftPress={() => {}} onRightPress={() => {}}>
            All
          </ButtonWithCarets>
          <Text>Repeat Count</Text>
          <ButtonWithCarets
            onLeftPress={() => setRepeatCount((c) => Math.max(1, c - 1))}
            onRightPress={() => setRepeatCount((c) => Math.min(15, c + 1))}
          >
            {repeatCount.toString()}
          </ButtonWithCarets>
          <Text>Color</Text>
          <View
            style={{ height: 40, borderRadius, backgroundColor: "yellow" }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Switch
              value={colorOverride}
              onValueChange={setColorOverride}
              thumbColor={colors.onSurface}
              trackColor={{
                false: colors.onSurfaceDisabled,
                true: colors.primary,
              }}
            />
            <Text>Override Color Based on Face</Text>
          </View>
          <Text>Color Design</Text>
          <MenuButton
            style={{ backgroundColor: "transparent" }}
            onPress={() =>
              navigation.navigate("pickColorDesign", {
                colorDesign,
                onSelectDesign: (c) => {
                  setColorDesign(c);
                  navigation.goBack();
                },
              })
            }
          >
            {colorDesign ? colorDesign.name : "Select Color Design"}
          </MenuButton>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Switch
              value={travelingOrder}
              onValueChange={setTravelingOrder}
              thumbColor={colors.onSurface}
              trackColor={{
                false: colors.onSurfaceDisabled,
                true: colors.primary,
              }}
            />
            <Text>Traveling Order</Text>
          </View>
          <OutlineButton
            style={{
              minWidth: "50%",
              alignSelf: "center",
              marginTop: 20,
            }}
            onPress={() => showConfirmDelete()}
          >
            Delete Animation
          </OutlineButton>
        </ScrollView>
      </View>
    </AppBackground>
  );
}

export function EditAnimationScreen({
  route: {
    params: { animationUuid },
  },
  navigation,
}: EditAnimationScreenProps) {
  return (
    <AppBackground>
      <EditAnimationPage
        animationUuid={animationUuid}
        navigation={navigation}
      />
    </AppBackground>
  );
}

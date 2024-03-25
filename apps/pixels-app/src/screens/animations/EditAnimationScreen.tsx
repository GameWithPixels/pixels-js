import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ScrollView } from "react-native";
import {
  MD3Theme,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { AnimationDieRenderer } from "~/components/DieRenderer";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithTitle } from "~/components/SliderWithTitle";
import {
  ButtonWithCarets,
  GradientButton,
  MenuButton,
  OutlineButton,
} from "~/components/buttons";
import { useConfirmActionSheet, useEditableAnimation } from "~/hooks";
import { EditAnimationScreenProps } from "~/navigation";

const Header = observer(function Header({
  animation,
  onGoBack,
}: {
  animation: Readonly<Profiles.Animation>;
  onGoBack: () => void;
}) {
  return (
    <PageHeader mode="chevron-down" onGoBack={onGoBack}>
      {animation.name}
    </PageHeader>
  );
});

const EditAnimationName = observer(function EditAnimationName({
  animation,
  colors,
}: {
  animation: Profiles.Animation;
  colors: MD3Theme["colors"];
}) {
  return (
    <TextInput
      mode="outlined"
      dense
      maxLength={20}
      style={{ backgroundColor: colors.elevation.level0 }}
      value={animation.name}
      onChangeText={(t) => runInAction(() => (animation.name = t))}
    />
  );
});

function EditAnimationPage({
  animationUuid,
  navigation,
}: {
  animationUuid: string;
  navigation: EditAnimationScreenProps["navigation"];
}) {
  const animation = useEditableAnimation(animationUuid);
  const showConfirmDelete = useConfirmActionSheet("Delete", () => {
    //removeAnimation(animationUuid);
    navigation.popToTop();
  });
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  const [duration, setDuration] = React.useState(1);
  const [repeatCount, setRepeatCount] = React.useState(1);
  const [colorOverride, setColorOverride] = React.useState(false);
  const [pattern, setPattern] = React.useState<Readonly<Profiles.Pattern>>();
  const [travelingOrder, setTravelingOrder] = React.useState(false);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <AppBackground>
      <View style={{ flex: 1 }}>
        <Header animation={animation} onGoBack={goBack} />
        <ScrollView
          contentContainerStyle={{
            gap: 10,
            paddingHorizontal: 10,
            paddingBottom: 20,
          }}
        >
          <View style={{ width: 200, aspectRatio: 1, alignSelf: "center" }}>
            <AnimationDieRenderer dieType="d20" animation={animation} />
          </View>
          <GradientButton
            sentry-label="preview-on-die"
            style={{ width: "50%", alignSelf: "center" }}
            onPress={() => {}}
          >
            Preview on die
          </GradientButton>
          <Text>Animation Name</Text>
          <EditAnimationName animation={animation} colors={colors} />
          <SliderWithTitle
            title="Duration"
            unit="s"
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
                pattern,
                onSelectPattern: (c) => {
                  setPattern(c);
                  navigation.goBack();
                },
              })
            }
          >
            {pattern ? pattern.name : "Select Color Design"}
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
          {/* TODO check if animation is in use */}
          <OutlineButton
            style={{
              minWidth: "50%",
              alignSelf: "center",
              marginTop: 20,
            }}
            onPress={() => showConfirmDelete()}
          >
            Delete
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

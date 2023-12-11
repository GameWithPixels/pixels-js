import { StackNavigationProp } from "@react-navigation/stack";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { AnimationsGrid } from "~/components/animation";
import { GradientButton, TightTextButton } from "~/components/buttons";
import { useAnimationsList } from "~/hooks";
import {
  AnimationsStackParamList,
  CreateAnimationScreenProps,
} from "~/navigation";

export function createAnimation(name: string): Profiles.Animation {
  return new Profiles.AnimationFlashes({
    uuid: Math.random().toString(),
    name,
  });
}

function CreateAnimationPage({
  navigation,
}: {
  navigation: StackNavigationProp<AnimationsStackParamList>;
}) {
  const animations = useAnimationsList();
  const templates = React.useMemo(
    () => [
      [
        "Flashes",
        "Colorful Rainbow",
        "Gradient",
        "Color Design",
        "Gradient With Grayscale Design",
      ].map(createAnimation),
      animations.slice(10),
      animations.filter((_, i) => i % 3),
    ],
    [animations]
  );
  const filterNames = ["Templates", "Animations", "Favorites"];
  const [filter, setFilter] = React.useState("Templates");
  const { roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        title="Select Template"
        rightElement={() => (
          <TightTextButton onPress={() => navigation.goBack()}>
            Cancel
          </TightTextButton>
        )}
      />
      <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 10 }}>
        <View
          style={{
            alignSelf: "center",
            flexDirection: "row",
            justifyContent: "flex-start",
          }}
        >
          {filterNames.map((f, i) => {
            return (
              <GradientButton
                key={f}
                style={{
                  borderTopLeftRadius: i === 0 ? borderRadius : 0,
                  borderBottomLeftRadius: i === 0 ? borderRadius : 0,
                  borderTopRightRadius:
                    i === filterNames.length - 1 ? borderRadius : 0,
                  borderBottomRightRadius:
                    i === filterNames.length - 1 ? borderRadius : 0,
                }}
                outline={f !== filter}
                onPress={() => setFilter(f)}
              >
                {f}
              </GradientButton>
            );
          })}
        </View>
        <AnimationsGrid
          animations={templates[filterNames.indexOf(filter)]}
          onSelectAnimation={() => {
            const newAnim = createAnimation("New Animation");
            // addAnimation(newAnim);
            const openEdit = () => {
              navigation.navigate("editAnimation", {
                animationUuid: newAnim.uuid,
              });
              navigation.removeListener("focus", openEdit);
            };
            navigation.addListener("transitionEnd", openEdit);
            navigation.goBack();
          }}
        />
      </ScrollView>
    </View>
  );
}

export function CreateAnimationScreen({
  navigation,
}: CreateAnimationScreenProps) {
  return (
    <AppBackground>
      <CreateAnimationPage navigation={navigation} />
    </AppBackground>
  );
}

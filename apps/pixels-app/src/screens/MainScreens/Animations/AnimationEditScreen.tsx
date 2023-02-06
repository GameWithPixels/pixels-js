import { FontAwesome5 } from "@expo/vector-icons";
import {
  AnimationBits,
  AnimationPreset,
  EditAnimation,
  EditAnimationGradient, // simple gradient
  EditAnimationGradientPattern,
  EditAnimationKeyframed, // gradient led pattern
  EditAnimationRainbow, // rainbow
  EditAnimationSimple,
  EditDataSet,
  getEditWidgetsData,
  AnimationTypeValues,
} from "@systemic-games/pixels-edit-animation";
import {
  Card,
  PixelAppPage,
  LightingStyleSelection,
  animationTypeToTitle,
} from "@systemic-games/react-native-pixels-components";
import { VStack, ScrollView, Center, Input, Button, Box } from "native-base";
import React from "react";

import { RenderWidget } from "~/components/RenderWidget";
import EditableStore from "~/features/EditableStore";
import DieRenderer from "~/features/render3d/DieRenderer";
import { AnimationEditScreenProps } from "~/navigation";

/**
 * Container component for {@link RenderWidget} to display widgets for animation edition.
 * @param editAnim type of animation for widgets to display.
 * @returns a scrollview of edition widgets corresponding to the type of animation.
 */
export function AnimationEditor({ editAnim }: { editAnim: EditAnimation }) {
  const animWidgets = React.useMemo(() => {
    return getEditWidgetsData(editAnim);
  }, [editAnim]);

  return (
    <>
      <ScrollView>
        <VStack p={2} h="100%" space={2} bg="gray.700" rounded="md">
          {animWidgets.map((widget, key) => (
            <RenderWidget key={key} widget={widget} />
          ))}
        </VStack>
      </ScrollView>
    </>
  );
}

export default function AnimationEditScreen({
  route,
}: AnimationEditScreenProps) {
  const [editAnim, setEditAnim] = React.useState(
    EditableStore.getEditable<EditAnimation>(route.params.animationId)
  );
  const animTypeText = React.useMemo(
    () => animationTypeToTitle(editAnim.type),
    [editAnim.type]
  );
  const [animData, setAnimData] = React.useState<{
    animations: AnimationPreset;
    animationBits: AnimationBits;
  }>();
  return (
    <PixelAppPage>
      <VStack space={2} h="100%">
        <Center bg="white" rounded="lg" px={2} h={9}>
          <Input
            InputRightElement={
              <FontAwesome5 name="pen" size={18} color="black" />
            }
            size="lg"
            variant="unstyled"
            placeholder={editAnim.name}
            color="black"
          />
        </Center>
        <Card bg="pixelColors.softBlack" shadow={0} w="100%" p={0} />
        <Box p={1} w="100%" h={200} rounded="lg">
          <DieRenderer animationData={animData} />
          <Button
            onPress={() => {
              try {
                const animationBits = new AnimationBits();
                setAnimData({
                  animations: editAnim.toAnimation(
                    new EditDataSet(),
                    animationBits
                  ),
                  animationBits,
                });
              } catch (error) {
                console.error(error);
              }
            }}
          >
            Apply
          </Button>
        </Box>
        <LightingStyleSelection
          title={animTypeText}
          itemsData={[
            {
              label: animationTypeToTitle(AnimationTypeValues.simple),
              onPress: () => {
                setEditAnim(new EditAnimationSimple());
              },
            },
            {
              label: animationTypeToTitle(AnimationTypeValues.rainbow),
              onPress: () => {
                setEditAnim(new EditAnimationRainbow());
              },
            },
            {
              label: animationTypeToTitle(AnimationTypeValues.gradient),
              onPress: () => {
                setEditAnim(new EditAnimationGradient());
              },
            },
            {
              label: animationTypeToTitle(AnimationTypeValues.keyframed),
              onPress: () => {
                setEditAnim(new EditAnimationKeyframed());
              },
            },
            {
              label: animationTypeToTitle(AnimationTypeValues.gradientPattern),
              onPress: () => {
                setEditAnim(new EditAnimationGradientPattern());
              },
            },
          ]}
        />
        {AnimationEditor({ editAnim })}
      </VStack>
    </PixelAppPage>
  );
}

import {
  EditAnimation,
  EditAnimationGradient, // simple gradient
  EditAnimationGradientPattern,
  EditAnimationKeyframed, // gradient led pattern
  EditAnimationRainbow, // rainbow
  EditAnimationSimple,
  getEditWidgetsData,
  AnimationTypeValues,
  EditAnimationNoise,
  EditPattern,
  createDataSetForAnimation,
} from "@systemic-games/pixels-edit-animation";
import {
  AnimationTypeSelector,
  Card,
  PixelAppPage,
  RenderWidget,
  getAnimationTitle,
} from "@systemic-games/react-native-pixels-components";
import { VStack, ScrollView, Button, Box } from "native-base";
import React from "react";

import {
  getTempAnimationFromUuid,
  useAppPatterns,
  useAppUpdateAnimation,
} from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";
import { AnimationEditScreenProps } from "~/navigation";

/**
 * Container component for {@link RenderWidget} to display widgets for animation edition.
 * @param editAnim type of animation for widgets to display.
 * @returns a ScrollView of edition widgets corresponding to the type of animation.
 */
function AnimationEditor({ editAnim }: { editAnim: EditAnimation }) {
  const patterns = useAppPatterns();
  const animWidgets = React.useMemo(
    () => getEditWidgetsData(editAnim),
    [editAnim]
  );
  const patternAnimsRef = React.useRef(
    new Map<Readonly<EditPattern>, EditAnimation>()
  );
  const getRenderData = React.useCallback((pattern: Readonly<EditPattern>) => {
    let anim = patternAnimsRef.current.get(pattern);
    if (!anim) {
      anim = new EditAnimationKeyframed({
        name: pattern.name,
        duration: pattern.duration,
        pattern: pattern as EditPattern, // TODO pattern is readonly
      });
      patternAnimsRef.current.set(pattern, anim);
    }
    return getCachedDataSet(anim);
  }, []);
  return (
    <>
      <ScrollView>
        <VStack p={2} h="100%" space={2} bg="gray.700" rounded="md">
          {animWidgets.map((widget, key) => (
            <RenderWidget
              key={key}
              widget={widget}
              patternsParams={{
                patterns,
                dieRenderer: (pattern) => (
                  <DieRenderer renderData={getRenderData(pattern)} />
                ),
              }}
            />
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
    () => getTempAnimationFromUuid(route.params.animationUuid) // TODO not updated if animationUuid changes
  );

  const [renderData, setRenderData] = React.useState(
    createDataSetForAnimation(editAnim).toDataSet()
  );

  const updateAnim = useAppUpdateAnimation();
  const lastAnimRef = React.useRef(editAnim);
  lastAnimRef.current = editAnim;
  React.useEffect(() => {
    return () => {
      updateAnim(lastAnimRef.current);
    };
  }, [updateAnim]);

  const animTypeText = React.useMemo(
    () => getAnimationTitle(editAnim.type),
    [editAnim.type]
  );

  return (
    <PixelAppPage>
      <VStack space={2} h="100%">
        {/* <Center bg="white" rounded="lg" px={2} h={9}>
          <Input
            InputRightElement={
              <FontAwesome5 name="pen" size={18} color="black" />
            }
            size="lg"
            variant="unstyled"
            placeholder={editAnim.name}
            color="black"
          />
        </Center> */}
        <Card bg="pixelColors.softBlack" shadow={0} w="100%" p={0} />
        <Box p={1} w="100%" h={200} rounded="lg">
          <DieRenderer renderData={renderData} />
          <Button
            onPress={() =>
              setRenderData(createDataSetForAnimation(editAnim).toDataSet())
            }
          >
            Apply
          </Button>
        </Box>
        <AnimationTypeSelector
          label={animTypeText}
          itemsData={[
            {
              label: getAnimationTitle(AnimationTypeValues.simple),
              onSelect: () => {
                setEditAnim(new EditAnimationSimple({ uuid: editAnim.uuid }));
              },
            },
            {
              label: getAnimationTitle(AnimationTypeValues.rainbow),
              onSelect: () => {
                setEditAnim(new EditAnimationRainbow({ uuid: editAnim.uuid }));
              },
            },
            {
              label: getAnimationTitle(AnimationTypeValues.gradient),
              onSelect: () => {
                setEditAnim(new EditAnimationGradient({ uuid: editAnim.uuid }));
              },
            },
            {
              label: getAnimationTitle(AnimationTypeValues.keyframed),
              onSelect: () => {
                setEditAnim(
                  new EditAnimationKeyframed({ uuid: editAnim.uuid })
                );
              },
            },
            {
              label: getAnimationTitle(AnimationTypeValues.gradientPattern),
              onSelect: () => {
                setEditAnim(
                  new EditAnimationGradientPattern({ uuid: editAnim.uuid })
                );
              },
            },
            {
              label: getAnimationTitle(AnimationTypeValues.noise),
              onSelect: () => {
                setEditAnim(new EditAnimationNoise({ uuid: editAnim.uuid }));
              },
            },
          ]}
        />
        <AnimationEditor editAnim={editAnim} />
      </VStack>
    </PixelAppPage>
  );
}

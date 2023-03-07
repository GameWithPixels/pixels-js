// import { FontAwesome5 } from "@expo/vector-icons";
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
  EditWidgetData,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelAppPage,
  AnimationTypeSelector,
  RenderWidget,
  getAnimationTitle,
  FastVStack,
  FastButton,
  FastBox,
} from "@systemic-games/react-native-pixels-components";
import { FlatList, Box } from "native-base";
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

  const Separator = React.useCallback(() => {
    return <FastBox h={2} />;
  }, []);

  const patternsParams = React.useMemo(
    () => ({
      patterns,
      dieRenderer: (pattern: Readonly<EditPattern>) => (
        <DieRenderer renderData={getRenderData(pattern)} />
      ),
    }),
    [getRenderData, patterns]
  );

  const renderItem = React.useCallback(
    ({
      item: widget,
      index,
    }: {
      item: Readonly<EditWidgetData>;
      index: number;
    }) => (
      <RenderWidget
        key={index}
        widget={widget}
        patternsParams={patternsParams}
      />
    ),
    [patternsParams]
  );

  return (
    <FlatList
      data={animWidgets}
      renderItem={renderItem}
      ItemSeparatorComponent={Separator}
      p={2}
      h="100%"
      bg="gray.700"
      rounded="md"
    />
  );
}

export default function AnimationEditScreen({
  route,
}: AnimationEditScreenProps) {
  const [editAnim, setEditAnim] = React.useState(
    () => getTempAnimationFromUuid(route.params.animationUuid) // TODO not updated if animationUuid changes
  );

  const updateAnim = useAppUpdateAnimation();
  const lastAnimRef = React.useRef(editAnim);
  lastAnimRef.current = editAnim;
  React.useEffect(() => {
    return () => {
      // TODO update anim on leave
      updateAnim(lastAnimRef.current);
    };
  }, [updateAnim]);

  const [renderData, setRenderData] = React.useState(
    createDataSetForAnimation(editAnim).toDataSet()
  );
  const updateDieRender = React.useCallback(
    () => setRenderData(createDataSetForAnimation(editAnim).toDataSet()),
    [editAnim]
  );

  const animTypeText = React.useMemo(
    () => getAnimationTitle(editAnim.type),
    [editAnim.type]
  );

  const animTypes = React.useMemo(
    () => [
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
          setEditAnim(new EditAnimationKeyframed({ uuid: editAnim.uuid }));
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
    ],
    [editAnim.uuid]
  );

  return (
    <PixelAppPage>
      <FastVStack h="100%">
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
        <Box p={1} w="100%" h={200} rounded="lg">
          <DieRenderer renderData={renderData} />
          <FastButton onPress={updateDieRender}>Apply</FastButton>
        </Box>
        <AnimationTypeSelector
          my={2}
          label={animTypeText}
          itemsData={animTypes}
        />
        <AnimationEditor editAnim={editAnim} />
      </FastVStack>
    </PixelAppPage>
  );
}

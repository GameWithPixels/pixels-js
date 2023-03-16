import { FontAwesome5 } from "@expo/vector-icons";
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
  getAnimationTitle,
  FastVStack,
  FastBox,
  createWidgetComponent,
} from "@systemic-games/react-native-pixels-components";
import { observer } from "mobx-react-lite";
import { FlatList, Input, View } from "native-base";
import React from "react";

import { useAppPatterns, useAppUpdateAnimation } from "~/app/hooks";
import FromStore from "~/features/FromStore";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import { makeObservable } from "~/features/makeObservable";
import DieRenderer from "~/features/render3d/DieRenderer";
import { AnimationEditScreenProps } from "~/navigation";

const penIcon = <FontAwesome5 name="pen" size={18} color="black" />;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ObservableInputAnimName = observer(function ({
  observableAnim,
}: {
  observableAnim: EditAnimation;
}) {
  return (
    <Input
      bg="white"
      rounded="lg"
      px={2}
      h={9}
      InputRightElement={penIcon}
      size="lg"
      variant="unstyled"
      value={observableAnim.name}
      onChangeText={(text) => (observableAnim.name = text)}
      color="black"
    />
  );
});

function Separator() {
  return <FastBox h={5} />;
}

/**
 * Container component for {@link RenderWidget} to display widgets for animation edition.
 * @param editAnim type of animation for widgets to display.
 * @returns a ScrollView of edition widgets corresponding to the type of animation.
 */
function AnimationEditor({
  observableAnim,
}: {
  observableAnim: EditAnimation;
}) {
  const patterns = useAppPatterns();
  const animWidgets = React.useMemo(
    () => getEditWidgetsData(observableAnim),
    [observableAnim]
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
      item: widgetData,
      index,
    }: {
      item: Readonly<EditWidgetData>;
      index: number;
    }) => {
      const Widget = createWidgetComponent(widgetData, { patternsParams });
      return <Widget key={index} />;
    },
    [patternsParams]
  );

  return (
    <FlatList
      p={2}
      h="100%"
      bg="gray.700"
      rounded="md"
      data={animWidgets}
      renderItem={renderItem}
      ItemSeparatorComponent={Separator}
    />
  );
}

const ObservableDieRender = observer(function ({
  observableAnim,
}: {
  observableAnim: EditAnimation;
}) {
  return (
    <DieRenderer
      renderData={createDataSetForAnimation(observableAnim).toDataSet()}
    />
  );
});

export default function AnimationEditScreen({
  route,
}: AnimationEditScreenProps) {
  const [observableAnim, setEditAnim] = React.useState(() =>
    makeObservable(FromStore.loadAnimation(route.params.animationUuid))
  );
  const updateAnim = useAppUpdateAnimation();

  // TODO anim is always saved on leaving screen
  const lastAnimRef = React.useRef(observableAnim);
  lastAnimRef.current = observableAnim;
  React.useEffect(() => {
    return () => {
      updateAnim(lastAnimRef.current);
    };
  }, [updateAnim]);

  const animTypeText = React.useMemo(
    () => getAnimationTitle(observableAnim.type),
    [observableAnim]
  );

  const uuid = observableAnim.uuid;
  const animTypes = React.useMemo(
    () => [
      {
        label: getAnimationTitle(AnimationTypeValues.simple),
        onSelect: () => {
          setEditAnim(makeObservable(new EditAnimationSimple({ uuid })));
        },
      },
      {
        label: getAnimationTitle(AnimationTypeValues.rainbow),
        onSelect: () => {
          setEditAnim(makeObservable(new EditAnimationRainbow({ uuid })));
        },
      },
      {
        label: getAnimationTitle(AnimationTypeValues.gradient),
        onSelect: () => {
          setEditAnim(makeObservable(new EditAnimationGradient({ uuid })));
        },
      },
      {
        label: getAnimationTitle(AnimationTypeValues.keyframed),
        onSelect: () => {
          setEditAnim(makeObservable(new EditAnimationKeyframed({ uuid })));
        },
      },
      {
        label: getAnimationTitle(AnimationTypeValues.gradientPattern),
        onSelect: () => {
          setEditAnim(
            makeObservable(new EditAnimationGradientPattern({ uuid }))
          );
        },
      },
      {
        label: getAnimationTitle(AnimationTypeValues.noise),
        onSelect: () => {
          setEditAnim(makeObservable(new EditAnimationNoise({ uuid })));
        },
      },
    ],
    [uuid]
  );

  return (
    <PixelAppPage>
      <FastVStack h="100%">
        {/* <ObservableInputAnimName observableAnim={observableAnim} /> */}
        <View p={1} w="100%" h={200} rounded="lg">
          <ObservableDieRender observableAnim={observableAnim} />
        </View>
        <AnimationTypeSelector
          my={2}
          label={animTypeText}
          itemsData={animTypes}
        />
        <AnimationEditor observableAnim={observableAnim} />
      </FastVStack>
    </PixelAppPage>
  );
}

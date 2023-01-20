import { FontAwesome5 } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  AnimationBits,
  AnimationPreset,
  EditAnimation,
  EditAnimationGradient, // simple gradient
  EditAnimationGradientPattern,
  EditAnimationKeyframed, // gradient led pattern
  EditAnimationNoise as _EditAnimationNoise, // noise
  EditAnimationRainbow, // rainbow
  EditAnimationSimple,
  EditDataSet, // simple flash
  EditWidgetData,
  getEditWidgetsData,
} from "@systemic-games/pixels-edit-animation";
import {
  Card,
  FaceMask,
  PixelTheme,
  PxAppPage,
  createPixelTheme,
  LightingStyleSelection,
  SliderComponent,
  ColorSelection,
  Toggle,
  RuleComparisonWidget,
  FaceIndex,
  PlayBackFace,
  PatternActionSheet,
} from "@systemic-games/react-native-pixels-components";
import {
  VStack,
  ScrollView,
  Center,
  Input,
  Text,
  Button,
  Box,
} from "native-base";
import React, { useEffect } from "react";
import { GradientColorSelection } from "~/../../../packages/react-native-pixels-components/src/components/ColorSelection";

import { lastSelectedLightingPattern } from "./PatternsScreen";

import StandardProfiles from "~/features/StandardProfile";
import DieRenderer from "~/features/render3d/DieRenderer";
const standardPatterns = [...StandardProfiles.patterns];

const paleBluePixelThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#1b94ff",
    "100": "#0081f2",
    "200": "#006cca",
    "300": "#0256a0",
    "400": "#024178",
    "500": "#04345e",
    "600": "#062846",
    "700": "#051b2e",
    "800": "#040f18",
    "900": "#010204",
  },
};
const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);

/**
 * Render a widget corresponding to a widget type from {@link EditWidgetData}.
 * @param widget widget information object.
 * @returns a JSX element as a corresponding edition widget.
 */
export function RenderWidget({ widget }: { widget: EditWidgetData }) {
  const type = widget.type;
  switch (type) {
    case "count": {
      const step = widget.step ? widget.step : undefined;
      return (
        <>
          <SliderComponent
            sliderTitle={widget.displayName}
            minValue={widget?.min ?? 0}
            maxValue={widget?.max ?? 1}
            value={widget.getValue()}
            step={step ?? 1}
            unitType={widget.unit ? widget.unit : undefined}
            unitTextColor={undefined}
            sliderThumbColor={undefined}
            onSelectedValue={widget.update}
          />
        </>
      );
    }
    case "slider": {
      const step = widget.step ? widget.step : undefined;
      return (
        <>
          <SliderComponent
            sliderTitle={widget.displayName}
            minValue={widget?.min ?? 0}
            maxValue={widget?.max ?? 1}
            value={widget.getValue()}
            step={step ?? 0.1}
            unitType={widget.unit ? widget.unit : undefined}
            sliderBoxColor="PixelColors.accentPurple"
            sliderTrackColor="PixelColors.pink"
            unitTextColor={undefined}
            sliderThumbColor={undefined}
            onSelectedValue={widget.update}
          />
        </>
      );
    }
    case "color":
      return (
        <>
          {/* TODO use widget.update function with string to color in order to work */}
          <ColorSelection />
        </>
      );

    case "faceMask":
      return (
        <>
          {/* TODO Check what is supposed to tell the number of faces */}
          <FaceMask
            //maskNumber={widget.getValue()}
            dieFaces={20}
            onCloseAction={widget.update}
          />
        </>
      );

    case "gradient":
      return (
        <>
          {/* TODO use widget.update function with string to color in order to work */}
          <GradientColorSelection triggerW="100%" />
        </>
      );

    case "rgbPattern":
      return <PatternActionSheet Patterns={standardPatterns} />;
    case "grayscalePattern":
      return <PatternActionSheet Patterns={standardPatterns} />;

    case "bitField": {
      // for rules : flags
      return (
        <>
          <RuleComparisonWidget
            title={widget.displayName}
            values={widget.values}
          />
        </>
      );
    }
    case "faceIndex": {
      return (
        <>
          {/* //TODO check how to initialize default mask from widget */}
          <FaceIndex faces={20} onIndexSelected={widget.update} />
        </>
      );
    } // for rules : condition on face, select one face
    case "playbackFace": {
      return (
        <>
          <PlayBackFace title={widget.displayName} />
        </>
      );
    } // for rules : condition on face, select one face or current face
    case "toggle": {
      return (
        <>
          <Toggle
            value={widget.getValue()}
            title={widget.displayName}
            onToggle={widget.update}
          />
        </>
      );
    }

    case "animation":
      return <Text>Animation Selector Placeholder</Text>;

    case "audioClip":
      return <Text>Audi Clip Selector Placeholder</Text>;

    default:
      assertNever(type);
  }
}
/**
 * Container component for {@link RenderWidget} to display widgets for animation edition.
 * @param editAnim type of animation for widgets to display.
 * @returns a scrollview of edition widgets corresponding to the type of animation.
 */
export function AnimationEditor({ editAnim }: { editAnim: EditAnimation }) {
  const [animWidgets, setAnimWidgets] = React.useState<EditWidgetData[]>([]);
  useEffect(() => {
    setAnimWidgets(getEditWidgetsData(editAnim));
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

export default function AnimationSettingsScreen() {
  //const route = useRoute<AnimationSettingsScreenRouteProps>();
  // const patternInfo = route.params;
  const [editAnim, setEditAnim] = React.useState<EditAnimation>(
    new EditAnimationSimple()
  );

  const [animation, setAnimation] = React.useState<AnimationPreset>();

  useEffect(() => {
    setEditAnim(lastSelectedLightingPattern);
  }, []);
  const [lightingTypeText, setLightingType] = React.useState("Simple Flashes");
  return (
    <PxAppPage theme={paleBluePixelTheme} h="100%">
      <VStack space={1} h="100%">
        <Center bg="white" rounded="lg" px={2} h={9}>
          <Input
            InputRightElement={
              <FontAwesome5 name="pen" size={18} color="black" />
            }
            size="lg"
            variant="unstyled"
            placeholder={lastSelectedLightingPattern.name}
            color="black"
          />
        </Center>
        <Card bg="pixelColors.softBlack" shadow={0} w="100%" p={0}>
          {/* <Image
            // PlaceHolderImage
            source={require("../../../../assets/BlueDice.png")}
            size={160}
            alt="description of image"
          /> */}
        </Card>
        <Box w="100%" h={200}>
          <DieRenderer animation={animation} />
          <Button
            onPress={() => {
              try {
                let animation;
                setAnimation(
                  (animation = lastSelectedLightingPattern.toAnimation(
                    new EditDataSet(),
                    new AnimationBits()
                  ))
                );
                console.log(animation);
              } catch (error) {
                console.error(error);
              }
            }}
          >
            Apply
          </Button>
        </Box>
        <LightingStyleSelection
          title={lightingTypeText}
          itemsData={[
            {
              label: "Simple Flashes",
              onPress: () => {
                setLightingType("Simple Flashes");
                setEditAnim(new EditAnimationSimple());
              },
            },
            {
              label: "Colorful Rainbow",
              onPress: () => {
                setLightingType("Colorful Rainbow");
                setEditAnim(new EditAnimationRainbow());
              },
            },
            {
              label: "Simple Gradient",
              onPress: () => {
                setLightingType("Simple Gradient");
                setEditAnim(new EditAnimationGradient());
              },
            },
            {
              label: "Color LED Pattern",
              onPress: () => {
                setLightingType("Color LED Pattern");
                setEditAnim(new EditAnimationKeyframed());
              },
            },
            {
              label: "Gradient LED Pattern",
              onPress: () => {
                setLightingType("Gradient LED Pattern");
                setEditAnim(new EditAnimationGradientPattern());
              },
            },
          ]}
        />
        {AnimationEditor({ editAnim })}
      </VStack>
    </PxAppPage>
  );
}

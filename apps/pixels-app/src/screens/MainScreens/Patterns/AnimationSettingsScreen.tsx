import { FontAwesome5 } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  AnimationBits,
  AnimationPreset,
  Color,
  ColorTypeValues,
  EditAnimation,
  EditAnimationGradient, // simple gradient
  EditAnimationGradientPattern,
  EditAnimationKeyframed, // gradient led pattern
  EditAnimationNoise as _EditAnimationNoise, // noise
  EditAnimationRainbow, // rainbow
  EditAnimationSimple,
  EditColor,
  EditDataSet,
  EditRgbGradient, // simple flash
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
  AnimationTypeToTitle,
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
            defaultValue={widget.getValue()}
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
            defaultValue={widget.getValue()}
            step={step ?? 0.1}
            unitType={widget.unit ? widget.unit : undefined}
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
          <ColorSelection
            initialColor={widget.getValue().color.toString()}
            onColorSelected={(color) =>
              widget.update(
                new EditColor(ColorTypeValues.rgb, new Color(color))
              )
            }
          />
        </>
      );

    case "faceMask":
      return (
        <>
          <FaceMask
            maskNumber={widget.getValue()}
            dieFaces={20}
            onCloseAction={widget.update}
          />
        </>
      );

    case "gradient":
      return (
        <>
          {/* TODO use widget.update function */}
          <GradientColorSelection
            triggerW="100%"
            onColorSelected={(keyFrames) =>
              widget.update(new EditRgbGradient(keyFrames))
            }
          />
        </>
      );

    case "rgbPattern":
      return (
        <PatternActionSheet
          initialPattern={widget.getValue()}
          Patterns={standardPatterns}
          onSelectPattern={(pattern) => {
            widget.update(pattern);
          }}
        />
      );
    case "grayscalePattern":
      return (
        <PatternActionSheet
          initialPattern={widget.getValue()}
          Patterns={standardPatterns}
          onSelectPattern={(pattern) => {
            widget.update(pattern);
          }}
        />
      );

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
          <FaceIndex faces={20} onIndexSelected={widget.update} />
        </>
      );
    } // for rules : condition on face, select one face
    case "playbackFace": {
      return (
        <>
          <PlayBackFace
            currentValue={widget.getValue()}
            onValueChange={widget.update}
            title={widget.displayName}
          />
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

  // const [animation, setAnimation] = React.useState<AnimationPreset>();
  // const [animationBits, setAnimationBits] = React.useState<AnimationBits>(
  //   new AnimationBits()
  // );

  const [animData, setAnimData] = React.useState<{
    animation: AnimationPreset;
    bits: AnimationBits;
  }>();

  useEffect(() => {
    setEditAnim(lastSelectedLightingPattern);
    setLightingType(AnimationTypeToTitle(lastSelectedLightingPattern));
  }, []);
  const [lightingTypeText, setLightingType] = React.useState("Simple Flashes");
  return (
    <PxAppPage theme={paleBluePixelTheme} h="100%">
      <VStack space={2} h="100%">
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
        <Card bg="pixelColors.softBlack" shadow={0} w="100%" p={0} />
        <Box p={1} w="100%" h={200} rounded="lg">
          <DieRenderer animationData={animData} />
          <Button
            onPress={() => {
              try {
                const bits = new AnimationBits();
                const animation = lastSelectedLightingPattern.toAnimation(
                  new EditDataSet(),
                  bits
                );
                const animData = { animation, bits };
                setAnimData(animData);
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

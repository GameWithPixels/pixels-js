import { FontAwesome5 } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  AnimationBits,
  AnimationPreset,
  Color,
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
  SimpleColorSelection,
  Toggle,
  RuleComparisonWidget,
  FaceIndex,
  PlayBackFace,
  PatternActionSheet,
  animationTypeToTitle,
  AnimationsActionSheet,
  valuesToKeys,
  keysToValues,
  GradientColorSelection,
  combineBits,
  bitsToFlags,
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

import { lastSelectedLightingPattern } from "./PatternsScreen";

import { MyAppDataSet } from "~/features/profiles";
import DieRenderer from "~/features/render3d/DieRenderer";

const standardPatterns = [...MyAppDataSet.patterns];

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

const defaultAnim = new EditAnimationRainbow();
const animDataMap = new Map<
  EditAnimation,
  {
    animations: AnimationPreset;
    animationBits: AnimationBits;
  }
>();

function getAnimData(anim?: EditAnimation) {
  if (!anim) {
    anim = defaultAnim;
  }
  let data = animDataMap.get(anim);
  if (!data) {
    const animationBits = new AnimationBits();
    data = {
      animationBits,
      animations: anim.toAnimation(new EditDataSet(), animationBits),
    };
    animDataMap.set(anim, data);
  }
  return data;
}

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
            step={step ?? 0.001}
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
          <SimpleColorSelection
            initialColor={widget.getValue().color.toString()}
            onColorSelected={(color) =>
              widget.update(new EditColor(new Color(color)))
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
          patterns={standardPatterns}
          dieRenderer={() => <DieRenderer animationData={getAnimData()} />}
          onSelectPattern={(pattern) => {
            widget.update(pattern);
          }}
        />
      );
    case "grayscalePattern":
      return (
        <PatternActionSheet
          initialPattern={widget.getValue()}
          patterns={standardPatterns}
          dieRenderer={() => <DieRenderer animationData={getAnimData()} />}
          onSelectPattern={(pattern) => {
            widget.update(pattern);
          }}
        />
      );

    case "bitField": {
      // for rules : flags

      // Values for buttons
      const valuesTitles = valuesToKeys(
        Object.values(widget.values),
        widget.values
      );

      // Initial selected values
      const initialValues = valuesToKeys(
        bitsToFlags(widget.getValue()),
        widget.values
      );

      return (
        <>
          <RuleComparisonWidget
            title={widget.displayName}
            values={valuesTitles}
            initialValues={initialValues}
            onChange={(keys) => {
              const changedValues = keysToValues(keys, widget.values, 0);
              const bits =
                changedValues.length < 1 ? 0 : combineBits(changedValues);
              widget.update(bits);
            }}
          />
        </>
      );
    }
    case "face": {
      return (
        <>
          <FaceIndex
            initialFaceIndex={widget.getValue()}
            faceCount={20}
            onIndexSelected={widget.update}
          />
        </>
      );
    } // for rules : condition on face, select one face
    case "playbackFace": {
      return (
        <>
          <PlayBackFace
            initialFaceIndex={widget.getValue()}
            faceCount={20}
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
            onValueChange={widget.update}
          />
        </>
      );
    }

    case "animation":
      return (
        <AnimationsActionSheet
          animations={MyAppDataSet.animations}
          dieRenderer={(anim: EditAnimation) => (
            <DieRenderer animationData={getAnimData(anim)} />
          )}
          initialAnimation={widget.getValue()}
          onSelectAnimation={widget.update}
        />
      );

    case "audioClip":
      return <Text>Audio Clip Selector Placeholder</Text>;

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

export default function AnimationSettingsScreen() {
  //const route = useRoute<AnimationSettingsScreenRouteProps>();
  // const patternInfo = route.params;
  const [editAnim, setEditAnim] = React.useState<EditAnimation>(
    new EditAnimationSimple()
  );

  const [animData, setAnimData] = React.useState<{
    animations: AnimationPreset;
    animationBits: AnimationBits;
  }>();

  useEffect(() => {
    setEditAnim(lastSelectedLightingPattern);
    setLightingType(animationTypeToTitle(lastSelectedLightingPattern.type));
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
                const animationBits = new AnimationBits();
                const anim = lastSelectedLightingPattern.toAnimation(
                  new EditDataSet(),
                  animationBits
                );
                setAnimData({ animations: anim, animationBits });
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

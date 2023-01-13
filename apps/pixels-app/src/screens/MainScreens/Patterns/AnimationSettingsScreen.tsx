import { FontAwesome5 } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  EditAnimation,
  EditAnimationGradient, // simple gradient
  EditAnimationGradientPattern, // gradient led pattern
  EditAnimationKeyframed as _EditAnimationKeyframed, // color led pattern
  EditAnimationNoise as _EditAnimationNoise, // noise
  EditAnimationRainbow, // rainbow
  EditAnimationSimple, // simple flash
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
} from "@systemic-games/react-native-pixels-components";
import { VStack, Image, ScrollView, Center, Input, Text } from "native-base";
import React, { useEffect } from "react";
import { GradientColorSelection } from "~/../../../packages/react-native-pixels-components/src/components/ColorSelection";

import { AnimationSettingsScreenRouteProps } from "~/Navigation";
import EditAnimationSandbox from "~/features/EditAnimationSandbox";

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
      console.log(step);
      return (
        <>
          <SliderComponent
            sliderTitle={widget.displayName}
            minValue={widget?.min ?? 0}
            maxValue={widget?.max ?? 1}
            //value={widget.getValue()}
            step={step ?? 1}
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
    case "slider": {
      const step = widget.step ? widget.step : undefined;
      return (
        <>
          <SliderComponent
            sliderTitle={widget.displayName}
            minValue={widget?.min ?? 0}
            maxValue={widget?.max ?? 1}
            //value={widget.getValue()}
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
            dieFaces={20}
            //TODO check what is supposed to get returned for the facemask "update"
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
    case "grayscalePattern":
      return (
        <Text>
          {" "}
          {widget.displayName} Placeholder until component is defined and/or
          done
        </Text>
      );

    case "bitField": {
      // for rules : flags
      console.log(widget.values);
      console.log(Object.keys(widget.values));
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
          <FaceIndex faces={20} />
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
          <Toggle title={widget.displayName} onToggle={widget.update} />
        </>
      );
    }

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
  const route = useRoute<AnimationSettingsScreenRouteProps>();
  const patternInfo = route.params;
  const [editAnim, setEditAnim] = React.useState<EditAnimation>(
    new EditAnimationSimple()
  );
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
            placeholder={patternInfo.name}
            color="black"
          />
        </Center>
        <Card bg="pixelColors.softBlack" shadow={0} w="100%" p={0}>
          <Image
            source={patternInfo.imageRequirePath}
            size={160}
            alt="description of image"
          />
        </Card>
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
                setEditAnim(new EditAnimationGradientPattern());
              },
            },
            {
              label: "Gradient LED Pattern",
              onPress: () => {
                setLightingType("Gradient LED Pattern");
                setEditAnim(new EditAnimationGradientPattern());
              },
            },
            {
              label: "Test anim type",
              onPress: () => {
                setLightingType("Test anim type");
                setEditAnim(new EditAnimationSandbox());
              },
            },
          ]}
        />
        {AnimationEditor({ editAnim })}
      </VStack>
    </PxAppPage>
  );
}

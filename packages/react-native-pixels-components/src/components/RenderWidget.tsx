import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import {
  Color,
  EditAnimation,
  EditColor,
  EditPattern,
  EditRgbGradient,
  EditWidgetData,
} from "@systemic-games/pixels-edit-animation";
import {
  SliderComponent,
  Toggle,
} from "@systemic-games/react-native-base-components";
import { Text } from "native-base";
import React from "react";

import { bitsToFlags, combineFlags } from "../bitMasksUtils";
import { keysToValues, valuesToKeys } from "../keyValuesUtils";
import { GradientColorSelection, SimpleColorSelection } from "./ColorSelection";
import { FaceMask } from "./FaceMask";
import { FaceSelector, PlayBackFace } from "./FaceSelector";
import {
  AnimationsActionSheet,
  PatternActionSheet,
} from "./PatternsActionSheet";
import { RuleComparisonWidget } from "./RuleComparisonWidget";

export interface RenderWidgetProps {
  widget: EditWidgetData;
  patternsParams?: {
    patterns: EditPattern[];
    dieRenderer?: (pattern: EditPattern) => React.ReactNode;
  };
  animationsParams?: {
    animations: EditAnimation[];
    dieRenderer?: (anim: EditAnimation) => React.ReactNode;
  };
}

/**
 * Render a widget corresponding to a widget type from {@link EditWidgetData}.
 * @param widget widget information object.
 * @returns a JSX element as a corresponding edition widget.
 */
export function RenderWidget({
  widget,
  patternsParams,
  animationsParams,
}: RenderWidgetProps) {
  const type = widget.type;
  switch (type) {
    case "count": {
      const step = widget.step ? widget.step : undefined;
      return (
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
      );
    }

    case "slider": {
      const step = widget.step ? widget.step : undefined;
      return (
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
      );
    }

    case "color":
      return (
        <SimpleColorSelection
          initialColor={widget.getValue().color.toString()}
          onColorSelected={(color) =>
            widget.update(new EditColor(new Color(color)))
          }
        />
      );

    case "faceMask":
      return (
        <FaceMask
          maskNumber={widget.getValue()}
          dieFaces={20}
          onCloseAction={widget.update}
        />
      );

    case "gradient":
      return (
        <GradientColorSelection
          triggerW="100%"
          onColorSelected={(keyFrames) =>
            widget.update(new EditRgbGradient(keyFrames))
          }
        />
      );

    case "rgbPattern":
      assert(
        patternsParams,
        "RenderWidget requires `patternsParams` to be set to render a RGB pattern"
      );
      return (
        <PatternActionSheet
          initialPattern={widget.getValue()}
          patterns={patternsParams?.patterns}
          dieRenderer={patternsParams.dieRenderer}
          onSelectPattern={(pattern) => {
            widget.update(pattern);
          }}
        />
      );

    case "grayscalePattern":
      assert(
        patternsParams,
        "RenderWidget requires `patternsParams` to be set to render a grayscale pattern"
      );
      return (
        <PatternActionSheet
          initialPattern={widget.getValue()}
          patterns={patternsParams?.patterns}
          dieRenderer={patternsParams.dieRenderer}
          onSelectPattern={(pattern) => {
            widget.update(pattern);
          }}
        />
      );

    case "bitField": {
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
        <RuleComparisonWidget
          title={widget.displayName}
          values={valuesTitles}
          initialValues={initialValues}
          onChange={(keys) => {
            const changedValues = keysToValues(keys, widget.values, 0);
            const bits =
              changedValues.length < 1 ? 0 : combineFlags(changedValues);
            widget.update(bits);
          }}
        />
      );
    }
    case "face":
      return (
        <FaceSelector
          initialFace={widget.getValue()}
          faceCount={20}
          onSelect={widget.update}
        />
      );

    case "playbackFace":
      return (
        <PlayBackFace
          initialFaceIndex={widget.getValue()}
          faceCount={20}
          onValueChange={widget.update}
          title={widget.displayName}
        />
      );

    case "toggle":
      return (
        <Toggle
          value={widget.getValue()}
          title={widget.displayName}
          onValueChange={widget.update}
        />
      );

    case "animation":
      assert(
        animationsParams,
        "RenderWidget requires `animationsParams` to be set to render a grayscale pattern"
      );
      return (
        <AnimationsActionSheet
          animations={animationsParams?.animations}
          dieRenderer={animationsParams.dieRenderer}
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

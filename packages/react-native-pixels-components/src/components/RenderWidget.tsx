import {
  assert,
  assertNever,
  bitsToFlags,
  combineFlags,
  keysToValues,
  valuesToKeys,
} from "@systemic-games/pixels-core-utils";
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

import { GradientColorSelection, SimpleColorSelection } from "./ColorSelection";
import { FaceMask } from "./FaceMask";
import { FaceSelector, PlayBackFace } from "./FaceSelector";
import {
  AnimationsActionSheet,
  PatternActionSheet,
} from "./PatternsActionSheet";
import { RuleComparisonWidget } from "./RuleComparisonWidget";
import { UserTextSelection } from "./UserTextSelection";

export interface RenderWidgetProps {
  widget: EditWidgetData;
  patternsParams?: {
    patterns: Readonly<EditPattern>[];
    dieRenderer?: (pattern: Readonly<EditPattern>) => React.ReactNode;
  };
  animationsParams?: {
    animations: Readonly<EditAnimation>[];
    dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  };
  userTextsParams?: {
    availableTexts: string[];
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
  userTextsParams,
}: RenderWidgetProps) {
  // Trigger a re-render whenever the value is updated
  const [_, forceUpdate] = React.useReducer((b) => !b, false);
  const update = (value: any) => {
    // @ts-ignore
    widget.update(value);
    forceUpdate();
  };
  const type = widget.type;
  switch (type) {
    case "toggle":
      return (
        <Toggle
          value={widget.getValue()}
          title={widget.displayName}
          onValueChange={update}
        />
      );

    case "string":
      return (
        <UserTextSelection
          title={widget.displayName}
          value={widget.getValue()}
          onValueChange={update}
        />
      );

    case "count":
      return (
        <SliderComponent
          sliderTitle={widget.displayName}
          minValue={widget?.min ?? 0}
          maxValue={widget?.max ?? 1}
          defaultValue={widget.getValue()}
          step={widget.step ?? 1}
          unitType={widget.unit}
          unitTextColor={undefined}
          sliderThumbColor={undefined}
          onSelectedValue={update}
        />
      );

    case "slider":
      return (
        <SliderComponent
          sliderTitle={widget.displayName}
          minValue={widget?.min ?? 0}
          maxValue={widget?.max ?? 1}
          defaultValue={widget.getValue()}
          step={widget.step ?? 0.001}
          unitType={widget.unit}
          unitTextColor={undefined}
          sliderThumbColor={undefined}
          onSelectedValue={update}
        />
      );

    case "color":
      return (
        <SimpleColorSelection
          initialColor={widget.getValue().color.toString()}
          onColorSelected={(color) => update(new EditColor(new Color(color)))}
        />
      );

    case "faceMask":
      return (
        <FaceMask
          maskNumber={widget.getValue()}
          dieFaces={widget.max ?? 20}
          onCloseAction={update}
        />
      );

    case "gradient":
      return (
        <GradientColorSelection
          triggerW="100%"
          onColorSelected={(keyframes) =>
            update(new EditRgbGradient({ keyframes }))
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
            update(pattern as EditPattern); // TODO pattern is readonly
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
            update(pattern as EditPattern); // TODO pattern is readonly
          }}
        />
      );

    case "bitField": {
      // Values for buttons
      const valuesTitles = valuesToKeys(
        Object.values(widget.values),
        widget.values
      ) as string[];

      // Initial selected values
      const initialValues = valuesToKeys(
        bitsToFlags(widget.getValue()),
        widget.values
      ) as string[];
      return (
        <RuleComparisonWidget
          title={widget.displayName}
          values={valuesTitles}
          initialValues={initialValues}
          onChange={(keys) => {
            const changedValues = keysToValues(keys, widget.values);
            const bits =
              changedValues.length < 1 ? 0 : combineFlags(changedValues);
            update(bits);
          }}
        />
      );
    }

    case "face":
      return (
        <FaceSelector
          initialFace={widget.getValue()}
          faceCount={20}
          onSelect={update}
        />
      );

    case "playbackFace":
      return (
        <PlayBackFace
          initialFaceIndex={widget.getValue()}
          faceCount={20}
          onValueChange={update}
          title={widget.displayName}
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
          onSelectAnimation={(anim) => update(anim as EditAnimation)} // TODO readonly animation
        />
      );

    case "audioClip":
      return <Text>Audio Clip Selector Placeholder</Text>;

    case "userText":
      assert(
        userTextsParams,
        "RenderWidget requires `userTextsParams` to be set to render a user text"
      );
      return (
        <UserTextSelection
          title={widget.displayName}
          value={widget.getValue()}
          onValueChange={update}
          availableTexts={userTextsParams.availableTexts}
        />
      );

    default:
      assertNever(type);
  }
}

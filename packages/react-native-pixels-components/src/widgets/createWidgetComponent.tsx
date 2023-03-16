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
  facesMaskToValues,
  getFaceMask,
} from "@systemic-games/pixels-edit-animation";
import {
  FastBoxProps,
  SliderComponent,
  Toggle,
} from "@systemic-games/react-native-base-components";
import { Text } from "native-base";
import React from "react";

import { AnimationSelector } from "../components/AnimationSelector";
import {
  GradientColorSelector,
  SimpleColorSelector,
} from "../components/ColorSelector";
import { FaceSelector } from "../components/FaceSelector";
import { PatternSelector } from "../components/PatternSelector";
import { FaceMaskWidget } from "./FaceMaskWidget";
import { PlaybackFaceWidget } from "./PlaybackFaceWidget";
import { RuleComparisonWidget } from "./RuleComparisonWidget";
import { UserTextWidget } from "./UserTextWidget";

export type CreateWidgetComponentOptionals = Required<
  Exclude<Parameters<typeof createWidgetComponent>[1], undefined>
>;

/**
 * Render a widget corresponding to a widget type from {@link EditWidgetData}.
 * @param widget widget information object.
 * @returns a JSX element as a corresponding edition widget.
 */
export function createWidgetComponent(
  widgetData: EditWidgetData,
  opt?: {
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
): (props: FastBoxProps) => JSX.Element {
  const type = widgetData.type;
  switch (type) {
    case "toggle":
      return (props: FastBoxProps) => (
        <Toggle
          {...props}
          value={widgetData.getValue()}
          title={widgetData.displayName}
          onValueChange={widgetData.update}
        />
      );

    case "string":
      return (props: FastBoxProps) => (
        <UserTextWidget
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onValueChange={widgetData.update}
        />
      );

    case "count":
      return (props: FastBoxProps) => (
        <SliderComponent
          {...props}
          sliderTitle={widgetData.displayName}
          minValue={widgetData?.min ?? 0}
          maxValue={widgetData?.max ?? 1}
          defaultValue={widgetData.getValue()}
          step={widgetData.step ?? 1}
          unitType={widgetData.unit}
          onValueChange={widgetData.update}
        />
      );

    case "slider":
      return (props: FastBoxProps) => (
        <SliderComponent
          {...props}
          sliderTitle={widgetData.displayName}
          minValue={widgetData?.min ?? 0}
          maxValue={widgetData?.max ?? 1}
          defaultValue={widgetData.getValue()}
          step={widgetData.step ?? 0.001}
          unitType={widgetData.unit}
          onValueChange={widgetData.update}
        />
      );

    case "color":
      return (props: FastBoxProps) => (
        <SimpleColorSelector
          {...props}
          initialColor={widgetData.getValue().color.toString()}
          onColorChange={(color) =>
            widgetData.update(new EditColor(new Color(color)))
          }
        />
      );

    case "faceMask":
      return (props: FastBoxProps) => (
        <FaceMaskWidget
          {...props}
          faces={facesMaskToValues(widgetData.getValue())}
          onFaceMaskChange={(faces) => widgetData.update(getFaceMask(faces))}
          faceCount={20}
        />
      );

    case "gradient":
      return (props: FastBoxProps) => (
        <GradientColorSelector
          {...props}
          triggerW="100%"
          onGradientChange={(keyframes) =>
            widgetData.update(new EditRgbGradient({ keyframes }))
          }
        />
      );

    case "rgbPattern": {
      const patternsParams = opt?.patternsParams;
      assert(
        patternsParams,
        "createWidgetComponent: `patternsParams` required to render a RGB pattern widget"
      );
      return (props: FastBoxProps) => (
        <PatternSelector
          {...props}
          title={widgetData.displayName}
          initialPattern={widgetData.getValue()}
          patterns={patternsParams?.patterns}
          dieRenderer={patternsParams.dieRenderer}
          onPatternChange={(pattern) => {
            widgetData.update(pattern as EditPattern); // TODO pattern is readonly
          }}
        />
      );
    }

    case "grayscalePattern": {
      const patternsParams = opt?.patternsParams;
      assert(
        patternsParams,
        "createWidgetComponent: `patternsParams` required to render a grayscale pattern widget"
      );
      return (props: FastBoxProps) => (
        <PatternSelector
          {...props}
          title={widgetData.displayName}
          initialPattern={widgetData.getValue()}
          patterns={patternsParams?.patterns}
          dieRenderer={patternsParams.dieRenderer}
          onPatternChange={(pattern) => {
            widgetData.update(pattern as EditPattern); // TODO pattern is readonly
          }}
        />
      );
    }

    case "bitField": {
      // Values for buttons
      const valuesTitles = valuesToKeys(
        Object.values(widgetData.values),
        widgetData.values
      ) as string[];

      // Initial selected values
      const initialValues = valuesToKeys(
        bitsToFlags(widgetData.getValue()),
        widgetData.values
      ) as string[];

      return (props: FastBoxProps) => (
        <RuleComparisonWidget
          {...props}
          title={widgetData.displayName}
          values={valuesTitles}
          initialValues={initialValues}
          onValuesChange={(values) => {
            const changedValues = keysToValues(values, widgetData.values);
            const bits =
              changedValues.length < 1 ? 0 : combineFlags(changedValues);
            widgetData.update(bits);
          }}
        />
      );
    }

    case "face":
      return (props: FastBoxProps) => (
        <FaceSelector
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onFaceChange={widgetData.update}
          faceCount={20}
        />
      );

    case "playbackFace":
      return (props: FastBoxProps) => (
        <PlaybackFaceWidget
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onFaceChange={widgetData.update}
          faceCount={20}
        />
      );

    case "animation": {
      const animationsParams = opt?.animationsParams;
      assert(
        animationsParams,
        "createWidgetComponent: `animationsParams` required to render a grayscale pattern widget"
      );
      return (props: FastBoxProps) => (
        <AnimationSelector
          {...props}
          title={widgetData.displayName}
          animations={animationsParams?.animations}
          dieRenderer={animationsParams.dieRenderer}
          initialAnimation={widgetData.getValue()}
          onAnimationChange={(anim) => widgetData.update(anim as EditAnimation)} // TODO readonly animation
        />
      );
    }

    case "audioClip":
      return (props: FastBoxProps) => (
        <Text {...props}>Audio Clip Selector Placeholder</Text>
      );

    case "userText": {
      const userTextsParams = opt?.userTextsParams;
      assert(
        userTextsParams,
        "RenderWidget: `userTextsParams` required to render a user text widget"
      );
      return (props: FastBoxProps) => (
        <UserTextWidget
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onValueChange={widgetData.update}
          availableTexts={userTextsParams.availableTexts}
        />
      );
    }

    default:
      assertNever(type);
  }
}

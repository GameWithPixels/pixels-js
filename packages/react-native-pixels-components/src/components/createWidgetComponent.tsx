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
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";

import { AnimationSelector } from "./AnimationSelector";
import { GradientColorSelection, SimpleColorSelection } from "./ColorSelection";
import { FaceMask } from "./FaceMask";
import { FaceSelector } from "./FaceSelector";
import { PatternSelector } from "./PatternSelector";
import { PlaybackFace } from "./PlaybackFace";
import { RuleComparisonWidget } from "./RuleComparisonWidget";
import { UserText } from "./UserText";

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
): (props: IViewProps) => JSX.Element {
  const type = widgetData.type;
  switch (type) {
    case "toggle":
      return (props: IViewProps) => (
        <Toggle
          {...props}
          value={widgetData.getValue()}
          title={widgetData.displayName}
          onValueChange={widgetData.update}
        />
      );

    case "string":
      return (props: IViewProps) => (
        <UserText
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onValueChange={widgetData.update}
        />
      );

    case "count":
      return (props: IViewProps) => (
        <SliderComponent
          {...props}
          sliderTitle={widgetData.displayName}
          minValue={widgetData?.min ?? 0}
          maxValue={widgetData?.max ?? 1}
          defaultValue={widgetData.getValue()}
          step={widgetData.step ?? 1}
          unitType={widgetData.unit}
          onSelectedValue={widgetData.update}
        />
      );

    case "slider":
      return (props: IViewProps) => (
        <SliderComponent
          {...props}
          sliderTitle={widgetData.displayName}
          minValue={widgetData?.min ?? 0}
          maxValue={widgetData?.max ?? 1}
          defaultValue={widgetData.getValue()}
          step={widgetData.step ?? 0.001}
          unitType={widgetData.unit}
          onSelectedValue={widgetData.update}
        />
      );

    case "color":
      return (props: IViewProps) => (
        <SimpleColorSelection
          {...props}
          initialColor={widgetData.getValue().color.toString()}
          onColorSelected={(color) =>
            widgetData.update(new EditColor(new Color(color)))
          }
        />
      );

    case "faceMask":
      return (props: IViewProps) => (
        <FaceMask
          {...props}
          maskNumber={widgetData.getValue()}
          dieFaces={widgetData.max ?? 20}
          onCloseAction={widgetData.update}
        />
      );

    case "gradient":
      return (props: IViewProps) => (
        <GradientColorSelection
          {...props}
          triggerW="100%"
          onColorSelected={(keyframes) =>
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
      return (props: IViewProps) => (
        <PatternSelector
          {...props}
          title={widgetData.displayName}
          initialPattern={widgetData.getValue()}
          patterns={patternsParams?.patterns}
          dieRenderer={patternsParams.dieRenderer}
          onSelectPattern={(pattern) => {
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
      return (props: IViewProps) => (
        <PatternSelector
          {...props}
          title={widgetData.displayName}
          initialPattern={widgetData.getValue()}
          patterns={patternsParams?.patterns}
          dieRenderer={patternsParams.dieRenderer}
          onSelectPattern={(pattern) => {
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
      return (props: IViewProps) => (
        <RuleComparisonWidget
          {...props}
          title={widgetData.displayName}
          values={valuesTitles}
          initialValues={initialValues}
          onChange={(keys) => {
            const changedValues = keysToValues(keys, widgetData.values);
            const bits =
              changedValues.length < 1 ? 0 : combineFlags(changedValues);
            widgetData.update(bits);
          }}
        />
      );
    }

    case "face":
      return (props: IViewProps) => (
        <FaceSelector
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onChange={widgetData.update}
          faceCount={20}
        />
      );

    case "playbackFace":
      return (props: IViewProps) => (
        <PlaybackFace
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onChange={widgetData.update}
          faceCount={20}
        />
      );

    case "animation": {
      const animationsParams = opt?.animationsParams;
      assert(
        animationsParams,
        "createWidgetComponent: `animationsParams` required to render a grayscale pattern widget"
      );
      return (props: IViewProps) => (
        <AnimationSelector
          {...props}
          title={widgetData.displayName}
          animations={animationsParams?.animations}
          dieRenderer={animationsParams.dieRenderer}
          initialAnimation={widgetData.getValue()}
          onSelectAnimation={(anim) => widgetData.update(anim as EditAnimation)} // TODO readonly animation
        />
      );
    }

    case "audioClip":
      return (props: IViewProps) => (
        <Text {...props}>Audio Clip Selector Placeholder</Text>
      );

    case "userText": {
      const userTextsParams = opt?.userTextsParams;
      assert(
        userTextsParams,
        "RenderWidget: `userTextsParams` required to render a user text widget"
      );
      return (props: IViewProps) => (
        <UserText
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

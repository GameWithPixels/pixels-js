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
  EditRgbKeyframe,
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

import { BitFieldWidget } from "./BitFieldWidget";
import { FaceMaskWidget } from "./FaceMaskWidget";
import { PlaybackFaceWidget } from "./PlaybackFaceWidget";
import { UserTextWidget } from "./UserTextWidget";
import { AnimationSelector } from "../components/AnimationSelector";
import {
  GradientColorSelector,
  SimpleColorSelector,
} from "../components/ColorSelector";
import { FaceSelector } from "../components/FaceSelector";
import { PatternSelector } from "../components/PatternSelector";

export type CreateWidgetComponentOptionals = Required<
  Exclude<Parameters<typeof createWidgetComponent>[1], undefined>
>;

// This helper wraps the given widget component to automatically re-render on value change
function makeAutoUpdate<T>(
  update: (value: T) => void,
  widget: (
    props: FastBoxProps & {
      autoUpdate: (value: T) => void;
    }
  ) => JSX.Element
): (props: FastBoxProps) => JSX.Element {
  const WrappedWidget = (props: FastBoxProps) => {
    const [_, forceUpdate] = React.useReducer((b) => !b, false);
    const autoUpdate = React.useCallback((value: T) => {
      update(value);
      forceUpdate();
    }, []);
    return widget({ autoUpdate, ...props });
  };
  return WrappedWidget;
}

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
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <Toggle
          {...props}
          value={widgetData.getValue()}
          title={widgetData.displayName}
          onValueChange={autoUpdate}
        />
      ));

    case "string":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <UserTextWidget
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onValueChange={autoUpdate}
        />
      ));

    case "count":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <SliderComponent
          {...props}
          sliderTitle={widgetData.displayName}
          minValue={widgetData?.min ?? 0}
          maxValue={widgetData?.max ?? 1}
          defaultValue={widgetData.getValue()}
          step={widgetData.step ?? 1}
          unitType={widgetData.unit}
          onValueChange={autoUpdate}
        />
      ));

    case "slider":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <SliderComponent
          {...props}
          sliderTitle={widgetData.displayName}
          minValue={widgetData?.min ?? 0}
          maxValue={widgetData?.max ?? 1}
          defaultValue={widgetData.getValue()}
          step={widgetData.step ?? 0.001}
          unitType={widgetData.unit}
          onValueChange={autoUpdate}
        />
      ));

    case "color":
      return makeAutoUpdate(
        (color: string) => widgetData.update(new EditColor(new Color(color))),
        ({ autoUpdate, ...props }) => (
          <SimpleColorSelector
            {...props}
            initialColor={widgetData.getValue().color.toString()}
            onColorChange={autoUpdate}
          />
        )
      );

    case "faceMask":
      return makeAutoUpdate(
        (faces: number[]) => widgetData.update(getFaceMask(faces)),
        ({ autoUpdate, ...props }) => (
          <FaceMaskWidget
            {...props}
            faces={facesMaskToValues(widgetData.getValue())}
            onFaceMaskChange={autoUpdate}
            faceCount={20}
          />
        )
      );

    case "gradient":
      return makeAutoUpdate(
        (keyframes: EditRgbKeyframe[]) =>
          widgetData.update(new EditRgbGradient({ keyframes })),
        ({ autoUpdate, ...props }) => (
          <GradientColorSelector
            {...props}
            triggerW="100%"
            onGradientChange={autoUpdate}
          />
        )
      );

    case "rgbPattern": {
      const patternsParams = opt?.patternsParams;
      assert(
        patternsParams,
        "createWidgetComponent: `patternsParams` required to render a RGB pattern widget"
      );
      // TODO pattern is readonly
      return makeAutoUpdate(
        (pattern) => widgetData.update(pattern as EditPattern),
        ({ autoUpdate, ...props }) => (
          <PatternSelector
            {...props}
            title={widgetData.displayName}
            initialPattern={widgetData.getValue()}
            patterns={patternsParams?.patterns}
            dieRenderer={patternsParams.dieRenderer}
            onPatternChange={autoUpdate}
          />
        )
      );
    }

    case "grayscalePattern": {
      const patternsParams = opt?.patternsParams;
      assert(
        patternsParams,
        "createWidgetComponent: `patternsParams` required to render a grayscale pattern widget"
      );
      // TODO pattern is readonly
      return makeAutoUpdate(
        (pattern) => widgetData.update(pattern as EditPattern),
        ({ autoUpdate, ...props }) => (
          <PatternSelector
            {...props}
            title={widgetData.displayName}
            initialPattern={widgetData.getValue()}
            patterns={patternsParams?.patterns}
            dieRenderer={patternsParams.dieRenderer}
            onPatternChange={autoUpdate}
          />
        )
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

      return makeAutoUpdate(
        (values: string[]) => {
          const changedValues = keysToValues(values, widgetData.values);
          const bits =
            changedValues.length < 1 ? 0 : combineFlags(changedValues);
          widgetData.update(bits);
        },
        ({ autoUpdate, ...props }) => (
          <BitFieldWidget
            {...props}
            title={widgetData.displayName}
            values={valuesTitles}
            initialValues={initialValues}
            onValuesChange={autoUpdate}
          />
        )
      );
    }

    case "face":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <FaceSelector
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onFaceChange={autoUpdate}
          faceCount={20}
        />
      ));

    case "playbackFace":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <PlaybackFaceWidget
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onFaceChange={autoUpdate}
          faceCount={20}
        />
      ));

    case "animation": {
      const animationsParams = opt?.animationsParams;
      assert(
        animationsParams,
        "createWidgetComponent: `animationsParams` required to render a grayscale pattern widget"
      );
      // TODO readonly animation
      return makeAutoUpdate(
        (anim) => widgetData.update(anim as EditAnimation),
        ({ autoUpdate, ...props }) => (
          <AnimationSelector
            {...props}
            title={widgetData.displayName}
            animations={animationsParams?.animations}
            dieRenderer={animationsParams.dieRenderer}
            initialAnimation={widgetData.getValue()}
            onAnimationChange={autoUpdate}
          />
        )
      );
    }

    case "audioClip":
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <Text {...props}>Audio Clip Selector Placeholder</Text>
      ));

    case "userText": {
      const userTextsParams = opt?.userTextsParams;
      assert(
        userTextsParams,
        "RenderWidget: `userTextsParams` required to render a user text widget"
      );
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <UserTextWidget
          {...props}
          title={widgetData.displayName}
          value={widgetData.getValue()}
          onValueChange={autoUpdate}
          availableTexts={userTextsParams.availableTexts}
        />
      ));
    }

    default:
      assertNever(type);
  }
}

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
  FastBox,
  FastFlexProps,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { Text } from "react-native-paper";

import { AnimationSelector } from "./components/AnimationSelector";
import {
  GradientColorSelector,
  ColorSelector,
} from "./components/ColorSelector";
import { FaceSelector } from "./components/FaceSelector";
import { PatternSelector } from "./components/PatternSelector";
import { BitFieldWidget } from "./widgets/BitFieldWidget";
import { FaceMaskWidget } from "./widgets/FaceMaskWidget";
import { PlaybackFaceWidget } from "./widgets/PlaybackFaceWidget";
import { SliderWidget } from "./widgets/SliderWidget";
import { ToggleWidget } from "./widgets/ToggleWidget";
import { UserTextWidget } from "./widgets/UserTextWidget";

export type CreateWidgetComponentOptionals = Required<
  Exclude<Parameters<typeof createWidgetComponent>[1], undefined>
>;

type FastBoxWithBgProps = Omit<FastFlexProps, "backgroundColor" | "bg">;

// This helper wraps the given widget component to automatically re-render on value change
function makeAutoUpdate<T>(
  update: (value: T) => void,
  widget: (
    props: FastBoxWithBgProps & {
      autoUpdate: (value: T) => void;
    }
  ) => JSX.Element
): (props: FastBoxWithBgProps) => JSX.Element {
  const WrappedWidget = (props: FastBoxWithBgProps) => {
    const [_, forceUpdate] = React.useReducer((x) => x + 1, 0);
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
): (props: FastFlexProps) => JSX.Element {
  const type = widgetData.type;
  switch (type) {
    case "toggle":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <ToggleWidget
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
        <SliderWidget
          {...props}
          title={widgetData.displayName}
          minimumValue={widgetData?.min ?? 0}
          maximumValue={widgetData?.max ?? 1}
          value={widgetData.getValue()}
          step={widgetData.step ?? 1}
          unitType={widgetData.unit}
          onValueChange={autoUpdate}
        />
      ));

    case "slider":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <SliderWidget
          {...props}
          title={widgetData.displayName}
          minimumValue={widgetData?.min ?? 0}
          maximumValue={widgetData?.max ?? 1}
          value={widgetData.getValue()}
          step={widgetData.step ?? 0.001}
          unitType={widgetData.unit}
          onValueChange={autoUpdate}
        />
      ));

    case "color":
      return makeAutoUpdate(
        (color: string) => widgetData.update(new EditColor(new Color(color))),
        ({ autoUpdate, ...props }) => (
          <FastVStack {...props}>
            <Text variant="titleMedium">{widgetData.displayName}</Text>
            <ColorSelector
              color={widgetData.getValue().color}
              onColorSelect={autoUpdate}
            />
          </FastVStack>
        )
      );

    case "faceMask":
      return makeAutoUpdate(
        (faces: number[]) => widgetData.update(getFaceMask(faces, "d20")),
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
          <FastVStack {...props}>
            <Text variant="titleMedium">{widgetData.displayName}</Text>
            <GradientColorSelector onSelect={autoUpdate} />
          </FastVStack>
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
          <FastVStack {...props}>
            <Text variant="titleMedium">{widgetData.displayName}</Text>
            <PatternSelector
              pattern={widgetData.getValue()}
              patterns={patternsParams?.patterns}
              onPatternSelect={autoUpdate}
              dieRenderer={patternsParams.dieRenderer}
              dieViewSize="30%"
            />
          </FastVStack>
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
          <FastVStack {...props}>
            <Text variant="titleMedium">{widgetData.displayName}</Text>
            <PatternSelector
              pattern={widgetData.getValue()}
              patterns={patternsParams?.patterns}
              onPatternSelect={autoUpdate}
              dieRenderer={patternsParams.dieRenderer}
              dieViewSize="30%"
            />
          </FastVStack>
        )
      );
    }

    case "bitField": {
      // Values for buttons
      const valuesTitles = valuesToKeys(
        Object.values(widgetData.values),
        widgetData.values
      ) as string[];

      return makeAutoUpdate(
        (values: string[]) => {
          const changedValues = keysToValues(values, widgetData.values);
          const bits =
            changedValues.length < 1 ? 0 : combineFlags(changedValues);
          widgetData.update(bits);
        },
        ({ autoUpdate, ...props }) => {
          // Selected values
          const values = valuesToKeys(
            bitsToFlags(widgetData.getValue()),
            widgetData.values
          ) as string[];
          // Value toggling function
          const onToggle = React.useCallback(
            (value: string) => {
              const index = values.indexOf(value);
              if (index < 0) {
                const newOptions = [...values, value];
                autoUpdate(newOptions);
              } else {
                const newOptions = [...values];
                newOptions.splice(index, 1);
                autoUpdate(newOptions);
              }
            },
            [autoUpdate, values]
          );
          return (
            <BitFieldWidget
              {...props}
              title={widgetData.displayName}
              availableValues={valuesTitles}
              values={values}
              onToggleValue={onToggle}
            />
          );
        }
      );
    }

    case "face":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <FastVStack {...props}>
          <Text variant="titleMedium">{widgetData.displayName}</Text>
          <FaceSelector
            faceCount={20}
            face={widgetData.getValue()}
            onFaceSelect={autoUpdate}
          />
        </FastVStack>
      ));

    case "playbackFace":
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <PlaybackFaceWidget
          {...props}
          title={widgetData.displayName}
          face={widgetData.getValue()}
          onFaceSelect={autoUpdate}
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
          <FastVStack {...props}>
            <Text variant="titleMedium">{widgetData.displayName}</Text>
            <AnimationSelector
              {...props}
              animations={animationsParams?.animations}
              animation={widgetData.getValue()}
              onAnimationSelect={autoUpdate}
              dieRenderer={animationsParams.dieRenderer}
              dieViewSize="30%"
            />
          </FastVStack>
        )
      );
    }

    case "audioClip":
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return makeAutoUpdate(widgetData.update, ({ autoUpdate, ...props }) => (
        <FastBox {...props}>
          <Text>Audio Clip Selector Placeholder</Text>
        </FastBox>
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

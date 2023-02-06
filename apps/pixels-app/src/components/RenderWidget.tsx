import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  Color,
  EditAnimation,
  EditColor,
  EditRgbGradient,
  EditWidgetData,
} from "@systemic-games/pixels-edit-animation";
import {
  FaceMask,
  SliderComponent,
  SimpleColorSelection,
  Toggle,
  RuleComparisonWidget,
  FaceSelector,
  PlayBackFace,
  PatternActionSheet,
  AnimationsActionSheet,
  valuesToKeys,
  keysToValues,
  GradientColorSelection,
  combineFlags,
  bitsToFlags,
} from "@systemic-games/react-native-pixels-components";
import { Text } from "native-base";
import React from "react";

import { MyAppDataSet, getAnimData } from "~/features/profiles";
import DieRenderer from "~/features/render3d/DieRenderer";

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
          patterns={MyAppDataSet.patterns}
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
          patterns={MyAppDataSet.patterns}
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
                changedValues.length < 1 ? 0 : combineFlags(changedValues);
              widget.update(bits);
            }}
          />
        </>
      );
    }
    case "face": {
      return (
        <>
          <FaceSelector
            initialFace={widget.getValue()}
            faceCount={20}
            onSelect={widget.update}
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

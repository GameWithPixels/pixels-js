import { assert, assertNever } from "@systemic-games/pixels-core-utils";

import {
  decorators,
  EditAnimation,
  EditAudioClip,
  EditColor,
  EditPattern,
  EditRgbGradient,
} from "./edit";

interface BaseWidgetData<T extends decorators.WidgetType, V> {
  propertyKey: string;
  displayName: string;
  type: T;
  getValue: () => V;
  update: (value: V) => void;
}

interface BaseWidgetWithRangeData<T extends decorators.WidgetType>
  extends BaseWidgetData<T, number> {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export type ToggleData = BaseWidgetData<"toggle", boolean>;
export type StringData = BaseWidgetData<"string", string>;
export type CountData = BaseWidgetWithRangeData<"count">;
export type SliderData = BaseWidgetWithRangeData<"slider">;
export type FaceMaskData = BaseWidgetWithRangeData<"faceMask">;
export type FaceData = BaseWidgetData<"face", number>;
export type PlaybackFaceData = BaseWidgetData<"playbackFace", number>;
export type BitFieldData = BaseWidgetData<"bitField", number> & {
  values: { [key: string]: number };
};
export type ColorData = BaseWidgetData<"color", EditColor>;
export type GradientData = BaseWidgetData<
  "gradient",
  EditRgbGradient | undefined
>;
export type GrayscalePatternData = BaseWidgetData<
  "grayscalePattern",
  EditPattern | undefined
>;
export type RgbPattern = BaseWidgetData<"rgbPattern", EditPattern | undefined>;
export type Animation = BaseWidgetData<"animation", EditAnimation | undefined>;
export type AudioClip = BaseWidgetData<"audioClip", EditAudioClip | undefined>;
export type UserText = BaseWidgetData<"userText", string | undefined>;

/** Type union of all possible widget data types. */
export type EditWidgetData =
  | ToggleData
  | StringData
  | CountData
  | SliderData
  | FaceMaskData
  | FaceData
  | PlaybackFaceData
  | BitFieldData
  | ColorData
  | GradientData
  | GrayscalePatternData
  | RgbPattern
  | Animation
  | AudioClip
  | UserText;

/**
 * Iterate other the properties of the given {@link Editable} object
 * and returns the corresponding list of  widgets data.
 * @param editObj The edit animation object for which to get the widgets data.
 * @returns An array of {@link EditWidgetData}.
 */
export default function <T extends object>(
  editObj: T,
  onUpdate?: (key: keyof T, value: T[keyof T], oldValue: T[keyof T]) => void
): EditWidgetData[] {
  const entries = Object.entries(editObj);
  return decorators.getPropsWithWidget(editObj).map(({ type, propertyKey }) => {
    const key = propertyKey as keyof T;
    const entry = entries.find((e) => e[0] === key);
    assert(entry);
    const value = entry[1];

    const getValue = () => editObj[key] as any;
    const update = (newValue: any) => {
      const oldValue = editObj[key];
      if (newValue !== oldValue) {
        editObj[key] = newValue;
        onUpdate?.(key, newValue, oldValue);
      }
    };

    const keyAndName = {
      propertyKey,
      displayName:
        decorators
          .getPropsWithName(editObj)
          .find((p) => p.propertyKey === propertyKey)?.name ?? propertyKey,
    };

    switch (type) {
      case "toggle":
        assert(
          typeof value === "boolean",
          `Property is not a boolean: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      case "string":
        assert(
          typeof value === "string",
          `Property is not a string: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      case "count":
      case "slider":
      case "face":
      case "playbackFace":
      case "bitField": {
        assert(
          typeof value === "number",
          `Property is not a number: ${propertyKey}`
        );
        const range = decorators
          .getPropsWithRange(editObj)
          .find((p) => p.propertyKey === propertyKey);
        const unit = decorators
          .getPropsWithUnit(editObj)
          .find((p) => p.propertyKey === propertyKey)?.unit;
        const data = {
          ...range,
          ...keyAndName,
          unit,
          getValue,
          update,
        };
        if (type === "bitField") {
          const values = decorators
            .getPropsWithValues(editObj)
            .find((p) => p.propertyKey === propertyKey)?.values;
          assert(
            values,
            `Missing values decorator on bitField property ${entries[0]}`
          );
          return { ...data, type, values };
        } else {
          return { ...data, type };
        }
      }

      case "faceMask": {
        assert(
          typeof value === "number",
          `Property is not a number: ${propertyKey}`
        );
        const range = decorators
          .getPropsWithRange(editObj)
          .find((p) => p.propertyKey === propertyKey);
        return {
          ...range,
          ...keyAndName,
          type,
          getValue,
          update,
        };
      }

      case "color":
        assert(
          value instanceof EditColor,
          `Property is not an EditColor: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      case "gradient":
        assert(
          value === undefined || value instanceof EditRgbGradient,
          `Property is not an EditRgbGradient: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      case "grayscalePattern":
      case "rgbPattern":
        assert(
          value === undefined || value instanceof EditPattern,
          `Property is not an EditPattern: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      case "animation":
        assert(
          value === undefined || value instanceof EditAnimation,
          `Property is not an EditAnimation: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      case "audioClip":
        assert(
          value === undefined || value instanceof EditAudioClip,
          `Property is not an EditAudioClip: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      case "userText":
        assert(
          value === undefined || typeof value === "string",
          `Property is not a string: ${propertyKey}`
        );
        return {
          ...keyAndName,
          type,
          getValue,
          update,
        };

      default:
        assertNever(type, `Unsupported widget type ${type}`);
    }
  });
}

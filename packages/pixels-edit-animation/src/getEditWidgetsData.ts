import { assert, assertNever } from "@systemic-games/pixels-core-utils";

import {
  decorators,
  Editable,
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
export type CountData = BaseWidgetWithRangeData<"count">;
export type SliderData = BaseWidgetWithRangeData<"slider">;
export type FaceMaskData = BaseWidgetData<"faceMask", number>;
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

/** Type union of all possible widget data types. */
export type EditWidgetData =
  | ToggleData
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
  | AudioClip;

/**
 * Iterate other the properties of the given {@link Editable} object
 * and returns the corresponding list of  widgets data.
 * @param editAnim The animation for which to get the widgets data.
 * @returns An array of {@link EditWidgetData}.
 */
export default function (editAnim: Editable): EditWidgetData[] {
  const entries = Object.entries(editAnim);
  return decorators
    .getPropsWithWidget(editAnim)
    .map(({ type, propertyKey }) => {
      const entry = entries.find((e) => e[0] === propertyKey);
      assert(entry);
      const value = entry[1];

      const updateProp = (newValue: any) => {
        console.log(`Updating prop ${propertyKey} to ${newValue}`);
        (editAnim as any)[propertyKey] = newValue;
        console.log(editAnim);
      };

      const keyAndName = {
        propertyKey,
        displayName:
          decorators
            .getPropsWithName(editAnim)
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
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as boolean,
            update: (v: boolean) => updateProp(v),
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
            .getPropsWithRange(editAnim)
            .find((p) => p.propertyKey === propertyKey);
          const unit = decorators
            .getPropsWithUnit(editAnim)
            .find((p) => p.propertyKey === propertyKey)?.unit;
          const data = {
            ...range,
            ...keyAndName,
            unit,
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as number,
            update: (v: number) => updateProp(v),
          };
          if (type === "bitField") {
            const values = decorators
              .getPropsWithValues(editAnim)
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

        case "faceMask":
          assert(
            typeof value === "number",
            `Property is not a number: ${propertyKey}`
          );
          return {
            ...keyAndName,
            type,
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as number,
            update: (v: number) => updateProp(v),
          };

        case "color":
          assert(
            value instanceof EditColor,
            `Property is not an EditColor: ${propertyKey}`
          );
          return {
            ...keyAndName,
            type,
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as EditColor,
            update: (v: EditColor) => updateProp(v),
          };

        case "gradient":
          assert(
            value === undefined || value instanceof EditRgbGradient,
            `Property is not an EditRgbGradient: ${propertyKey}`
          );
          return {
            ...keyAndName,
            type,
            getValue: () =>
              // @ts-expect-error Accessing property by index
              editAnim[propertyKey] as EditRgbGradient | undefined,
            update: (v?: EditRgbGradient) => updateProp(v),
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
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as EditPattern | undefined,
            update: (v?: EditPattern) => updateProp(v),
          };

        case "animation":
          assert(
            value === undefined || value instanceof EditAnimation,
            `Property is not an EditAnimation: ${propertyKey}`
          );
          return {
            ...keyAndName,
            type,
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as EditAnimation | undefined,
            update: (v?: EditAnimation) => updateProp(v),
          };

        case "audioClip":
          assert(
            value === undefined || value instanceof EditAudioClip,
            `Property is not an EditAudioClip: ${propertyKey}`
          );
          return {
            ...keyAndName,
            type,
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as EditAudioClip | undefined,
            update: (v?: EditAudioClip) => updateProp(v),
          };

        default:
          assertNever(type, `Unsupported widget type ${type}`);
      }
    });
}

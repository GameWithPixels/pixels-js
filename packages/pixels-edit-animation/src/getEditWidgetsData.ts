import { Color } from "@systemic-games/pixels-core-animation";
import { assert, assertNever } from "@systemic-games/pixels-core-utils";

import {
  decorators,
  Editable,
  EditColor,
  EditPattern,
  EditRgbGradient,
} from "./edit";

interface BaseWidgetData<T extends decorators.WidgetType, V, U = V> {
  propertyKey: string;
  displayName: string;
  type: T;
  getValue: () => V;
  update: (value: U) => void;
}

interface BaseWidgetWithRangeData<T extends decorators.WidgetType>
  extends BaseWidgetData<T, number> {
  min?: number;
  max?: number;
  step?: number;
}

export type ToggleData = BaseWidgetData<"toggle", boolean>;
export type CountData = BaseWidgetWithRangeData<"count">;
export type SliderData = BaseWidgetWithRangeData<"slider">;
export type FaceMaskData = BaseWidgetData<"faceMask", number>;
export type FaceIndexData = BaseWidgetData<"faceIndex", number>;
export type PlaybackFaceData = BaseWidgetData<"playbackFace", number>;
export type BitFieldData = BaseWidgetData<"bitField", number>;
export type ColorData = BaseWidgetData<"color", EditColor, Color>;
export type GradientData = BaseWidgetData<
  "gradient",
  EditRgbGradient | undefined
>;
export type GrayscalePatternData = BaseWidgetData<
  "grayscalePattern",
  EditPattern | undefined
>;
export type RgbPattern = BaseWidgetData<"rgbPattern", EditPattern | undefined>;

/** Type union of all possible widget data types. */
export type EditWidgetData =
  | ToggleData
  | CountData
  | SliderData
  | FaceMaskData
  | FaceIndexData
  | PlaybackFaceData
  | BitFieldData
  | ColorData
  | GradientData
  | GrayscalePatternData
  | RgbPattern;

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
        if (value instanceof EditColor) {
          newValue = EditColor.fromColor(newValue as Color);
        }
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
        case "faceIndex":
        case "playbackFace":
        case "bitField": {
          assert(
            typeof value === "number",
            `Property is not a number: ${propertyKey}`
          );
          const range = decorators
            .getPropsWithRange(editAnim)
            .find((p) => p.propertyKey === propertyKey);
          return {
            ...range,
            ...keyAndName,
            type,
            // @ts-expect-error Accessing property by index
            getValue: () => editAnim[propertyKey] as number,
            update: (v: number) => updateProp(v),
          };
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
            update: (v: Color) => updateProp(v),
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

        default:
          assertNever(type, `Unsupported widget type ${type}`);
      }
    });
}

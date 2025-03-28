export interface PropertyData {
  propertyKey: string; // TODO add typing: keyof T & string
}

function getMetadata<T extends PropertyData>(
  metadataKey: symbol,
  target: object
): T[] {
  return Reflect.getMetadata(metadataKey, target) ?? [];
}

function addMetadata<T extends PropertyData>(
  metadataKey: symbol,
  target: object,
  metadata: T
): void {
  // Always pass new array do defineMetadata
  // so it doesn't pollute the parent object of the target
  Reflect.defineMetadata(
    metadataKey,
    getMetadata(metadataKey, target).concat([metadata]),
    target
  );
}

function createDecorator<T extends PropertyData>(
  metadataKey: symbol,
  data: Omit<T, "propertyKey">
): (target: object, propertyKey: string) => void {
  return function registerProperty(target: object, propertyKey: string): void {
    const metadata = {
      propertyKey,
      ...data,
    } as T; // TODO error without cast
    addMetadata(metadataKey, target, metadata);
  };
}

//
// Name property
//

const nameKey = Symbol.for("PixelsEditAnimationName");

export interface NameProperty extends PropertyData {
  name: string;
}

// Name decorator factory
export function name(
  name: string
): (target: object, propertyKey: string) => void {
  return createDecorator<NameProperty>(nameKey, { name });
}

// Get properties with a name decorator
export function getPropsWithName(target: object): NameProperty[] {
  return getMetadata(nameKey, target);
}

//
// Range property
//

const rangeKey = Symbol.for("PixelsEditAnimationRange");

export interface RangeProperty extends PropertyData {
  min: number;
  max: number;
  step?: number;
}

// Range decorator factory
export function range(
  min: number,
  max: number,
  step?: number
): (target: object, propertyKey: string) => void {
  return createDecorator<RangeProperty>(rangeKey, {
    min,
    max,
    step,
  });
}

// Get properties with a range decorator
export function getPropsWithRange(target: object): RangeProperty[] {
  return getMetadata(rangeKey, target);
}

//
// Unit property
//

const unitKey = Symbol.for("PixelsEditAnimationUnit");

export type UnitType = "s" | "ms";

export interface UnitProperty extends PropertyData {
  unit: UnitType;
}

// Unit decorator factory
export function unit(
  unit: UnitType
): (target: object, propertyKey: string) => void {
  return createDecorator<UnitProperty>(unitKey, { unit });
}

// Get properties with a unit decorator
export function getPropsWithUnit(target: object): UnitProperty[] {
  return getMetadata(unitKey, target);
}

//
// Values property
//

const valuesKey = Symbol.for("PixelsEditAnimationValues");

export type ValuesType = { [key: string]: number };

export interface ValuesProperty extends PropertyData {
  values: ValuesType;
}

// Unit decorator factory
export function values(
  values: ValuesType
): (target: object, propertyKey: string) => void {
  return createDecorator<ValuesProperty>(valuesKey, { values });
}

// Get properties with a values decorator
export function getPropsWithValues(target: object): ValuesProperty[] {
  return getMetadata(valuesKey, target);
}

//
// Widget property
//

const widgetKey = Symbol.for("PixelsEditAnimationWidget");

export type WidgetType =
  | "toggle"
  | "string"
  | "count"
  | "slider"
  | "faceMask"
  | "face"
  | "playbackFace"
  | "bitField"
  | "color"
  | "gradient"
  | "grayscalePattern"
  | "rgbPattern"
  | "animation"
  | "userText";

export interface WidgetProperty extends PropertyData {
  type: WidgetType;
}

// Widget decorator factory
export function widget(
  type: WidgetType
): (target: object, propertyKey: string) => void {
  return createDecorator<WidgetProperty>(widgetKey, { type });
}

// Get properties with a widget decorator
export function getPropsWithWidget(target: object): WidgetProperty[] {
  return getMetadata(widgetKey, target);
}

//
// Display Order property
//

const displayOrderKey = Symbol.for("PixelsEditAnimationDisplayOrder");

export interface DisplayOrderProperty extends PropertyData {
  index: number;
}

// Display order decorator factory
export function displayOrder(
  index: number
): (target: object, propertyKey: string) => void {
  return createDecorator<DisplayOrderProperty>(displayOrderKey, { index });
}

// Get properties with a display order decorator
export function getPropsWithDisplayOrder(
  target: object
): DisplayOrderProperty[] {
  return getMetadata(displayOrderKey, target);
}

//
// Skip Enum property
//

const skipEnumKey = Symbol.for("PixelsEditAnimationSkipEnum");

// Skip decorator
export function skipEnum(target: object, propertyKey: string): void {
  addMetadata(skipEnumKey, target, { propertyKey });
}

// Get properties with a skip enum decorator
export function getPropsWithSkipEnum(target: object): PropertyData[] {
  return getMetadata(skipEnumKey, target);
}

//
// Observable property
//

const observableKey = Symbol.for("PixelsObservable");

// Skip decorator
export function observable(target: object, propertyKey: string): void {
  addMetadata(observableKey, target, { propertyKey });
}

// Get properties with a observable decorator
export function getPropsWithObservable(target: object): PropertyData[] {
  return getMetadata(observableKey, target);
}

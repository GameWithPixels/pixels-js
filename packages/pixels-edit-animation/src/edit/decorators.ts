export interface PropertyData {
  propertyKey: string;
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
    } as T; //TODO error without cast
    addMetadata(metadataKey, target, metadata);
  };
}

const nameKey = Symbol("pixelAnimationName");

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

const rangeKey = Symbol("pixelAnimationRange");

export interface RangeProperty extends PropertyData {
  min: number;
  max: number;
  step: number;
}

// Range decorator factory
export function range(
  min: number,
  max: number,
  step = 0
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

const unitKey = Symbol("pixelAnimationUnits");

export type UnitsType = "s" | "ms";

export interface UnitsProperty extends PropertyData {
  unit: UnitsType;
}

// Units decorator factory
export function units(
  unit: UnitsType
): (target: object, propertyKey: string) => void {
  return createDecorator<UnitsProperty>(unitKey, { unit });
}

// Get properties with a units decorator
export function getPropsWithUnits(target: object): UnitsProperty[] {
  return getMetadata(unitKey, target);
}

const widgetKey = Symbol("pixelAnimationWidget");

export type WidgetType =
  | "toggle"
  | "count"
  | "slider"
  | "faceMask"
  | "faceIndex"
  | "playbackFace"
  | "bitField"
  | "color"
  | "gradient"
  | "grayscalePattern"
  | "rgbPattern";

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

const displayOrderKey = Symbol("pixelAnimationDisplayOrder");

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

const skipEnumKey = Symbol("pixelAnimationSkipEnum");

// Skip decorator
export function skipEnum(target: object, propertyKey: string): void {
  addMetadata(skipEnumKey, target, { propertyKey });
}

// Get properties with a display order decorator
export function getPropsWithSkipEnum(target: object): DisplayOrderProperty[] {
  return getMetadata(displayOrderKey, target);
}

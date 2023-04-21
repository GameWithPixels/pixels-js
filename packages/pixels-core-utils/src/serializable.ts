/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";

import assert from "./assert";
import decodeUtf8 from "./decodeUtf8";

const serializableKey = Symbol("pixelAnimationSerializable");

export interface SerializableProperty {
  propertyKey: string;
  size: number;
  options?: SerializableOptions;
}

export type SerializedNumberFormat = "unsigned" | "signed" | "float";

export interface SerializableOptions {
  // Padding is the number of bytes to be left after the serialized property
  padding?: number;
  // By default numbers are serialized as unsigned integers
  numberFormat?: SerializedNumberFormat;
}

// Decorator factory
export function serializable(
  size: number,
  options?: SerializableOptions
): (target: object, propertyKey: string) => void {
  return function registerProperty(target: object, propertyKey: string): void {
    const properties: SerializableProperty[] = Reflect.getMetadata(
      serializableKey,
      target
    );
    const metaData = { propertyKey, size, options };
    if (properties) {
      properties.push(metaData);
    } else {
      Reflect.defineMetadata(serializableKey, [metaData], target);
    }
  };
}

export function getSerializableProperties(
  target: object
): SerializableProperty[] | undefined {
  return Reflect.getMetadata(serializableKey, target) as SerializableProperty[];
}

export function byteSizeOfProp<T extends object>(
  target: T,
  propertyKey: Extract<keyof T, string>
): number {
  const props = getSerializableProperties(target);
  return props?.find((sp) => sp.propertyKey === propertyKey)?.size ?? 0;
}

export function byteSizeOfPropWithPadding<T extends object>(
  target: T,
  propertyKey: Extract<keyof T, string>
): number {
  const props = getSerializableProperties(target);
  const serializableProp = props?.find((sp) => sp.propertyKey === propertyKey);
  return serializableProp
    ? serializableProp.size + (serializableProp.options?.padding ?? 0)
    : 0;
}

export function byteSizeOf<T extends object>(objOrArray: T | T[]): number {
  if (Array.isArray(objOrArray)) {
    return objOrArray.reduce((acc, obj) => acc + byteSizeOf(obj), 0);
  } else {
    const props = getSerializableProperties(objOrArray);
    return (
      props?.reduce(
        (acc, prop) => acc + prop.size + (prop.options?.padding ?? 0),
        0
      ) ?? 0
    );
  }
}

export class SerializationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "SerializationError";
  }
}

function forEachSerializableProp(
  obj: object,
  callback: (prop: SerializableProperty, value: any) => void
) {
  const props = getSerializableProperties(obj);
  if (!props?.length) {
    throw new SerializationError("Object has no serializable property");
  }
  props.forEach((prop) => {
    //@ts-expect-error Accessing property on unknown type
    const value = obj[prop.propertyKey];
    const isBuffer =
      value instanceof ArrayBuffer ||
      (value.buffer && value.buffer instanceof ArrayBuffer);
    if (
      typeof value !== "number" &&
      typeof value !== "bigint" &&
      typeof value !== "boolean" &&
      typeof value !== "string" &&
      // !Array.isArray(value) &&
      !isBuffer
    ) {
      throw new SerializationError(
        `Invalid property type, got ${typeof value} for ${
          prop.propertyKey
        } but expects number or bigint`
      );
    }
    callback(prop, value);
  });
}

function internalSerialize<T extends object>(
  objOrArray: T | T[],
  dataView: DataView,
  byteOffset = 0
): [DataView, number] {
  if (Array.isArray(objOrArray)) {
    const options = { dataView, byteOffset };
    // Serialize array
    objOrArray.forEach((obj) => {
      const [dataView, byteOffset] = serialize(obj, options);
      options.dataView = dataView;
      options.byteOffset = byteOffset;
    });
    return [options.dataView, options.byteOffset];
  } else {
    // Serialize object
    forEachSerializableProp(objOrArray, (prop, value) => {
      let buffer: ArrayBuffer | undefined;
      if (value instanceof ArrayBuffer) {
        buffer = value;
      } else if (value.buffer && value.buffer instanceof ArrayBuffer) {
        buffer = value.buffer;
      }
      if (buffer) {
        const arr = new Uint8Array(buffer);
        const size = Math.min(arr.byteLength, prop.size);
        for (let i = 0; i < size; ++i) {
          dataView.setUint8(byteOffset, arr[i]);
          ++byteOffset;
        }
        for (let i = size; i < prop.size; ++i) {
          dataView.setUint8(byteOffset, 0);
          ++byteOffset;
        }
      } else {
        const isFloat = prop.options?.numberFormat === "float";
        const isSigned = prop.options?.numberFormat === "signed";
        //TODO check value < max
        switch (prop.size) {
          case 1:
            if (isSigned) {
              dataView.setInt8(byteOffset, Number(value));
            } else {
              dataView.setUint8(byteOffset, Number(value));
            }
            break;
          case 2:
            if (isSigned) {
              dataView.setInt16(byteOffset, Number(value), true);
            } else {
              dataView.setUint16(byteOffset, Number(value), true);
            }
            break;
          case 4:
            if (isFloat) {
              dataView.setFloat32(byteOffset, Number(value), true);
            } else if (isSigned) {
              dataView.setInt32(byteOffset, Number(value), true);
            } else {
              dataView.setInt32(byteOffset, Number(value), true);
            }
            break;
          case 8:
            if (isFloat) {
              dataView.setFloat64(byteOffset, Number(value), true);
            } else throw new SerializationError("BigInt not supported");
            // if (isSigned) {
            //   dataView.setBigInt64(byteOffset, BigInt(value), true);
            // } else {
            //   dataView.setBigUint64(byteOffset, BigInt(value), true);
            // }
            break;
          default:
            throw new SerializationError(
              `Invalid property size, got ${prop.size} but expects 1, 2, 4, or 8`
            );
        }
        byteOffset += prop.size + (prop.options?.padding ?? 0);
      }
    });
    return [dataView, byteOffset];
  }
}

function internalDeserialize<T extends object>(
  obj: T | T[],
  dataView: DataView,
  byteOffset = 0
): [DataView, number] {
  function setProp(
    obj: object,
    prop: SerializableProperty,
    value: any,
    prevValue: any
  ) {
    if (
      typeof prevValue === "boolean" &&
      (typeof value === "number" || typeof value === "bigint")
    ) {
      // Convert number to boolean
      value = Boolean(value);
    } else {
      assert(
        typeof value === typeof prevValue,
        `Incorrect value type, got ${typeof value} but was expecting ${typeof prevValue}`
      );
    }
    //@ts-expect-error Accessing property on unknown type
    obj[prop.propertyKey] = value;
  }
  forEachSerializableProp(obj, (prop, value) => {
    if (typeof value === "string") {
      //TODO this code assumes that the string is the last property to read!
      const msgArr = dataView.buffer.slice(dataView.byteOffset + byteOffset);
      setProp(obj, prop, decodeUtf8(new Uint8Array(msgArr)), value);
    } else {
      const isFloat = prop.options?.numberFormat === "float";
      const isSigned = prop.options?.numberFormat === "signed";
      let newVal: number | bigint;
      switch (prop.size) {
        case 1:
          newVal = isSigned
            ? dataView.getInt8(byteOffset)
            : dataView.getUint8(byteOffset);
          break;
        case 2:
          newVal = isSigned
            ? dataView.getInt16(byteOffset, true)
            : dataView.getUint16(byteOffset, true);
          break;
        case 4:
          newVal = isFloat
            ? dataView.getFloat32(byteOffset, true)
            : isSigned
            ? dataView.getInt32(byteOffset, true)
            : dataView.getUint32(byteOffset, true);
          break;
        case 8:
          if (isFloat) {
            newVal = dataView.getFloat64(byteOffset, true);
          } else throw new SerializationError("BigInt not supported");
          // : isSigned
          // ? dataView.getBigInt64(byteOffset, true)
          // : dataView.getBigUint64(byteOffset, true);
          break;
        default:
          throw new SerializationError(
            `Invalid property size, got ${prop.size} but expects 1, 2, 4, or 8`
          );
      }
      setProp(obj, prop, newVal, value);
    }
    byteOffset += prop.size + (prop.options?.padding ?? 0);
  });
  return [dataView, byteOffset];
}

export interface SerializeOptions {
  dataView?: DataView;
  byteOffset?: number;
}

export function serialize<T extends object>(
  objOrArray: T | T[],
  options?: SerializeOptions
): [DataView, number] {
  if (!options?.dataView) {
    // Create buffer and serialize
    const [dataView, byteOffset] = internalSerialize(
      objOrArray,
      new DataView(new ArrayBuffer(byteSizeOf(objOrArray)))
    );
    assert(
      byteOffset === dataView.buffer.byteLength,
      `Incorrect offset after serialization, got ${byteOffset} but was expecting ${dataView.buffer.byteLength}`
    );
    return [dataView, byteOffset];
  } else {
    // Serialize using give data view
    return internalSerialize(
      objOrArray,
      options.dataView,
      options.byteOffset ?? 0
    );
  }
}

export function deserialize<T extends object>(
  source: T,
  dataView: DataView,
  byteOffset = 0
): [DataView, number] {
  return internalDeserialize(source, dataView, byteOffset);
}

export function align32bits(size: number): number {
  const extra = size % 4;
  return size + (extra ? 4 - extra : 0);
}

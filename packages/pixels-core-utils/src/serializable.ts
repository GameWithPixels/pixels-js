/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";

import { assert } from "./assert";
import { decodeUtf8 } from "./decodeUtf8";
import { encodeUtf8 } from "./encodeUtf8";

const serializableKey = Symbol("pixelAnimationSerializable");

/** */
export class SerializationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "SerializationError";
  }
}

/** */
export interface SerializableProperty {
  propertyKey: string;
  size: number;
  options?: SerializableOptions;
}

/** */
export type SerializedNumberFormat = "unsigned" | "signed" | "float";

/** */
export interface SerializableOptions {
  // Padding is the number of bytes to be left after the serialized property
  padding?: number;
  // By default numbers are serialized as unsigned integers
  numberFormat?: SerializedNumberFormat;
}

/**
 * Decorator factory
 * @param size
 * @param options
 * @returns
 */
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

/**
 *
 * @param target
 * @returns
 */
export function getSerializableProperties(
  target: object
): SerializableProperty[] | undefined {
  return Reflect.getMetadata(serializableKey, target) as SerializableProperty[];
}

/**
 *
 * @param target
 * @param propertyKey
 * @returns
 */
export function byteSizeOfProp<T extends object>(
  target: T,
  propertyKey: Extract<keyof T, string>
): number {
  const props = getSerializableProperties(target);
  return props?.find((sp) => sp.propertyKey === propertyKey)?.size ?? 0;
}

/**
 *
 * @param target
 * @param propertyKey
 * @returns
 */
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

/**
 *
 * @param objOrArray
 * @returns
 */
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

function forEachSerializableProp(
  obj: object,
  callback: (prop: SerializableProperty, value: any) => boolean
) {
  const props = getSerializableProperties(obj);
  if (!props?.length) {
    throw new SerializationError("Object has no serializable property");
  }
  for (const prop of props) {
    const value = (obj as any)[prop.propertyKey];
    const isBuffer =
      value instanceof ArrayBuffer ||
      (value.buffer && value.buffer instanceof ArrayBuffer);
    if (
      typeof value !== "number" &&
      typeof value !== "bigint" &&
      typeof value !== "boolean" &&
      typeof value !== "string" &&
      !isBuffer
    ) {
      throw new SerializationError(
        Array.isArray(value)
          ? "Invalid property type, got an array, use an 'ArrayBuffer' instead"
          : `Invalid property type, got ${typeof value} for ${
              prop.propertyKey
            } but expected number or bigint`
      );
    }
    if (!callback(prop, value)) {
      break;
    }
  }
}

function getNumber(
  value: any,
  type:
    | "int8"
    | "uint8"
    | "int16"
    | "uint16"
    | "int32"
    | "uint32"
    | "float32"
    | "float64"
): number {
  const n = Number(value);
  let min, max;
  switch (type) {
    case "int8":
      min = -128;
      max = 127;
      break;
    case "uint8":
      min = 0;
      max = 255;
      break;
    case "int16":
      min = -32768;
      max = 32767;
      break;
    case "uint16":
      min = 0;
      max = 65535;
      break;
    case "int32":
      min = -2147483648;
      max = 2147483647;
      break;
    case "uint32":
      min = 0;
      max = 4294967295;
      break;
    case "float32":
      break;
    case "float64":
      break;
  }
  if (min && max) {
    if (n < min) {
      throw new SerializationError(`Value ${n} too small to fit in a ${type}`);
    }
    if (n > max) {
      throw new SerializationError(`Value ${n} too big to fit in a ${type}`);
    }
  }
  return n;
}

function writeNumber(
  dataView: DataView,
  byteOffset: number,
  value: any,
  size: number,
  isSigned: boolean,
  isFloat: boolean
) {
  switch (size) {
    case 1:
      if (isSigned) {
        dataView.setInt8(byteOffset, getNumber(value, "int8"));
      } else {
        dataView.setUint8(byteOffset, getNumber(value, "uint8"));
      }
      break;
    case 2:
      if (isSigned) {
        dataView.setInt16(byteOffset, getNumber(value, "int16"), true);
      } else {
        dataView.setUint16(byteOffset, getNumber(value, "uint16"), true);
      }
      break;
    case 4:
      if (isFloat) {
        dataView.setFloat32(byteOffset, getNumber(value, "float32"), true);
      } else if (isSigned) {
        dataView.setInt32(byteOffset, getNumber(value, "int32"), true);
      } else {
        dataView.setInt32(byteOffset, getNumber(value, "uint32"), true);
      }
      break;
    case 8:
      if (isFloat) {
        dataView.setFloat64(byteOffset, getNumber(value, "float64"), true);
      } else throw new SerializationError("BigInt not supported");
      break;
    default:
      throw new SerializationError(
        `Invalid property size, got ${size} but expected 1, 2, 4, or 8`
      );
  }
}

function internalSerialize<T extends object>(
  objOrArray: T | T[],
  dataView: DataView,
  byteOffset = 0
): [DataView, number] {
  if (Array.isArray(objOrArray)) {
    const options = { dataView, byteOffset };
    // Serialize array
    for (const obj of objOrArray) {
      const [dataView, byteOffset] = serialize(obj, options);
      options.dataView = dataView;
      options.byteOffset = byteOffset;
    }
    return [options.dataView, options.byteOffset];
  } else {
    // Serialize object
    forEachSerializableProp(objOrArray, (prop, value) => {
      let buffer: ArrayBuffer | undefined;
      // Check if our value is a string
      if (typeof value === "string") {
        buffer = encodeUtf8(value).buffer;
      }
      // Or a buffer
      else if (value instanceof ArrayBuffer) {
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
        // Value must be a numeric type then
        const isFloat = prop.options?.numberFormat === "float";
        const isSigned = prop.options?.numberFormat === "signed";
        writeNumber(dataView, byteOffset, value, prop.size, isSigned, isFloat);
        byteOffset += prop.size + (prop.options?.padding ?? 0);
      }
      return true; // Continue
    });
    return [dataView, byteOffset];
  }
}

function readNumber(
  dataView: DataView,
  byteOffset: number,
  size: number,
  isSigned: boolean,
  isFloat: boolean
): number {
  switch (size) {
    case 1:
      return isSigned
        ? dataView.getInt8(byteOffset)
        : dataView.getUint8(byteOffset);
    case 2:
      return isSigned
        ? dataView.getInt16(byteOffset, true)
        : dataView.getUint16(byteOffset, true);
    case 4:
      return isFloat
        ? dataView.getFloat32(byteOffset, true)
        : isSigned
        ? dataView.getInt32(byteOffset, true)
        : dataView.getUint32(byteOffset, true);
    case 8:
      if (isFloat) {
        return dataView.getFloat64(byteOffset, true);
      } else throw new SerializationError("BigInt not supported");
    // : isSigned
    // ? dataView.getBigInt64(byteOffset, true)
    // : dataView.getBigUint64(byteOffset, true);
    default:
      throw new SerializationError(
        `Invalid property size, got ${size} but expected 1, 2, 4, or 8`
      );
  }
}

function internalDeserialize<T extends object>(
  objOrArray: T | T[],
  dataView: DataView,
  opt?: { allowSkipLastProps?: boolean }
): number {
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
    } else if (typeof value !== typeof prevValue) {
      throw new SerializationError(
        `Type mismatch, deserialized a ${typeof value} but but expected a ${typeof prevValue}`
      );
    }
    (obj as any)[prop.propertyKey] = value;
  }
  let byteOffset = 0;
  forEachSerializableProp(objOrArray, (prop, value) => {
    if (opt?.allowSkipLastProps && byteOffset === dataView.byteLength) {
      // Stop if we exactly reached the end of the buffer
      return false; // Stop iterating props
    } else if (byteOffset + prop.size > dataView.byteLength) {
      // Not enough data left
      throw new SerializationError(
        `Not enough bytes for deserializing property ${prop.propertyKey} of size ${prop.size}`
      );
    }
    // Check type
    if (Array.isArray(objOrArray)) {
      // Arrays not supported
      throw new SerializationError(
        "Array type not (yet) supported for deserialization"
      );
    } else if (typeof value === "string") {
      // Read string
      const begin = dataView.byteOffset + byteOffset;
      if (begin + prop.size > dataView.buffer.byteLength) {
        throw new SerializationError(
          `Unexpected property size, got ${prop.size} but there are only ${
            dataView.buffer.byteLength - begin
          } left`
        );
      }
      const msgArr = dataView.buffer.slice(begin, begin + prop.size);
      setProp(objOrArray, prop, decodeUtf8(new Uint8Array(msgArr)), value);
    } else {
      // Read number
      const isFloat = prop.options?.numberFormat === "float";
      const isSigned = prop.options?.numberFormat === "signed";
      const newValue = readNumber(
        dataView,
        byteOffset,
        prop.size,
        isSigned,
        isFloat
      );
      setProp(objOrArray, prop, newValue, value);
    }
    byteOffset += prop.size + (prop.options?.padding ?? 0);
    return true; // Continue
  });
  return byteOffset;
}

/**
 *
 */
export interface SerializeOptions {
  dataView?: DataView;
  byteOffset?: number;
}

/**
 *
 * @param objOrArray
 * @param options
 * @returns
 */
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
      `Incorrect offset after serialization, got ${byteOffset} but expected ${dataView.buffer.byteLength}`
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

/**
 *
 * @param source
 * @param dataView
 * @param byteOffset
 * @param stopAt
 * @returns
 */
export function deserialize<T extends object>(
  source: T,
  dataView: DataView,
  opt?: { allowSkipLastProps?: boolean }
): number {
  return internalDeserialize(source, dataView, opt);
}

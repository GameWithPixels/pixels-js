/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";

import { assert } from "./assert";
import { decodeUtf8, DecodeUtf8Error } from "./decodeUtf8";
import { encodeUtf8 } from "./encodeUtf8";

const serializableKey = Symbol.for("PixelsAnimationSerializable");

/** Error thrown during (de)serialization. */
export class SerializationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "SerializationError";
  }
}

/** Type of the metadata attached to properties by the {@link serializable} decorator. */
export interface SerializableProperty {
  propertyKey: string;
  size: number;
  options?: SerializableOptions;
}

/** Supported number formats. */
export type SerializedNumberFormat = "unsigned" | "signed" | "float";

/** Options for the {@link serializable} function. */
export interface SerializableOptions {
  /** Padding is the number of bytes to be left after the serialized property. */
  padding?: number;
  /** By default numbers are serialized as unsigned integers. */
  numberFormat?: SerializedNumberFormat;
  /** Data of dynamic size, end is signaled by a 0 (typically used for strings). */
  nullTerminated?: boolean;
  /** Data of dynamic size, will consume all the data left when deserializing. */
  terminator?: boolean;
}

/**
 * Decorator factory for tagging properties to (de)serialization.
 * @param size Number of bytes for the binary data.
 * @param options Options, see {@link SerializableOptions}.
 * @returns The function decorator.
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
): number | "dynamic" {
  const prop = getSerializableProperties(target)?.find(
    (sp) => sp.propertyKey === propertyKey
  );
  return !!prop?.options?.nullTerminated || !!prop?.options?.terminator
    ? "dynamic"
    : (prop?.size ?? 0);
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
): number | "dynamic" {
  const prop = getSerializableProperties(target)?.find(
    (sp) => sp.propertyKey === propertyKey
  );
  if (!!prop?.options?.nullTerminated || !!prop?.options?.terminator) {
    return "dynamic";
  } else {
    return prop ? prop.size + (prop.options?.padding ?? 0) : 0;
  }
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
    return (
      getSerializableProperties(objOrArray)?.reduce((acc, prop) => {
        if (!!prop.options?.nullTerminated || !!prop?.options?.terminator) {
          throw new SerializationError("Dynamic size");
        }
        return acc + prop.size + (prop.options?.padding ?? 0);
      }, 0) ?? 0
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
      (value && value.buffer instanceof ArrayBuffer);
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
        // Check size
        const serializedSize =
          buffer.byteLength + (typeof value === "string" ? 1 : 0);
        if (
          !prop.options?.nullTerminated &&
          !prop.options?.terminator &&
          prop.size < serializedSize
        ) {
          throw new SerializationError(
            `Serialized value for \`${prop.propertyKey}\` takes ${serializedSize} bytes but prop size is ${prop.size}`
          );
        }
        // Copy data
        const arr = new Uint8Array(buffer);
        const size = prop.options?.nullTerminated
          ? arr.byteLength
          : prop.options?.terminator
            ? arr.byteLength
            : Math.min(arr.byteLength, prop.size);
        for (let i = 0; i < size; ++i) {
          dataView.setUint8(byteOffset, arr[i]);
          ++byteOffset;
        }
        if (!prop.options?.nullTerminated && !prop.options?.terminator) {
          // Fill left over with zeroes
          for (let i = size; i < prop.size; ++i) {
            dataView.setUint8(byteOffset, 0);
            ++byteOffset;
          }
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

function findNullIndex(dataView: DataView, byteOffset: number): number {
  for (let i = byteOffset; i < dataView.byteLength; ++i) {
    if (!dataView.getUint8(i)) {
      return i;
    }
  }
  throw new SerializationError("Data is not null terminated");
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
    } else if (
      !prop.options?.nullTerminated &&
      !prop.options?.terminator &&
      byteOffset + prop.size > dataView.byteLength
    ) {
      // Not enough data left
      throw new SerializationError(
        `Not enough bytes for deserializing \`${prop.propertyKey}\` of size ${prop.size}`
      );
    }
    // Check type
    if (Array.isArray(objOrArray)) {
      // Arrays not supported
      throw new SerializationError(
        "Array type not supported for deserialization"
      );
    } else if (typeof value === "string") {
      // Read string
      const begin = dataView.byteOffset + byteOffset;
      if (
        !prop.options?.nullTerminated &&
        !prop.options?.terminator &&
        begin + prop.size > dataView.buffer.byteLength
      ) {
        throw new SerializationError(
          `Unexpected property size, got ${prop.size} but there are only ${
            dataView.buffer.byteLength - begin
          } left`
        );
      }
      const strArr = dataView.buffer.slice(
        begin,
        prop.options?.nullTerminated
          ? findNullIndex(dataView, byteOffset) - 1
          : prop.options?.terminator
            ? dataView.byteOffset + dataView.byteLength
            : begin + prop.size
      );
      try {
        setProp(objOrArray, prop, decodeUtf8(new Uint8Array(strArr)), value);
      } catch (error: any) {
        if (error instanceof DecodeUtf8Error) {
          // Go on with what we have
          setProp(objOrArray, prop, error.decodedString, value);
          console.warn(
            `Error decoding string for \`${prop.propertyKey}\`: ${error}`
          );
        } else {
          throw new SerializationError(error?.message ?? String(error));
        }
      }
      byteOffset += strArr.byteLength;
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
      byteOffset += prop.size;
    }
    byteOffset += prop.options?.padding ?? 0;
    return true; // Continue
  });
  return byteOffset;
}

/**
 * Serialize the given object or array of objects into a DataView.
 * @param objOrArray The object or array of objects to serialize.
 * @param opt.dataView If provided, the data view to use for serialization.
 * @param opt.byteOffset If provided, the byte offset to use for serialization.
 * @returns A tuple with the DataView and the byte offset after serialization.
 */
export function serialize<T extends object>(
  objOrArray: T | T[],
  opt?: {
    dataView?: DataView;
    byteOffset?: number;
  }
): [DataView, number] {
  if (!opt?.dataView) {
    const size = byteSizeOf(objOrArray);
    // Create buffer and serialize
    const [dataView, byteOffset] = internalSerialize(
      objOrArray,
      new DataView(new ArrayBuffer(size))
    );
    assert(
      byteOffset === dataView.buffer.byteLength,
      `Incorrect offset after serialization, got ${byteOffset} but expected ${dataView.buffer.byteLength}`
    );
    return [dataView, byteOffset];
  } else {
    // Serialize using give data view
    return internalSerialize(objOrArray, opt.dataView, opt.byteOffset ?? 0);
  }
}

/**
 * Deserialize the given DataView into the provided object.
 * @param obj The object to deserialize into.
 * @param dataView The DataView to use for deserialization.
 * @param opt.allowSkipLastProps If true, will allow the last properties to be skipped if there is not enough data left.
 * @returns The number of bytes read from the DataView.
 */
export function deserialize<T extends object>(
  obj: T,
  dataView: DataView,
  opt?: { allowSkipLastProps?: boolean }
): number {
  return internalDeserialize(obj, dataView, opt);
}

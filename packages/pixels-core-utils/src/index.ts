export * from "./assert";
export * from "./assertNever";
export * from "./bernsteinHash";
export * from "./bitMasksUtils";
export * from "./createTypedEventEmitter";
export * from "./decodeUtf8";
export * from "./delay";
export * from "./encodeUtf8";
export * from "./enum";
export * from "./keyValuesUtils";
export * from "./range";
export * from "./safeAssign";
export * from "./SequentialPromiseQueue";
export * from "./serializable";
export * from "./unsigned32ToHex";

//
// TypeScript helpers
//

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

// Unused at the moment:

// export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// export function hasProperty<T extends object, PropName extends keyof T>(
//   obj: T,
//   prop: PropName
// ): obj is T & Record<PropName, NonNullable<T[PropName]>> {
//   return prop in obj;
// }

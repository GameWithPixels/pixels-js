import { serializable } from "@systemic-games/pixels-core-utils";

export class BufferDescriptor {
  data = new Uint8Array();
}

export class ObjectPtr<T> {
  // The *pointer*
  @serializable(2)
  offset = 0;

  // The actual object
  obj?: T;
}

export class ArrayPtr<T> {
  // The start of the array data
  @serializable(2)
  offset = 0;

  // The size of the array, in item count
  @serializable(1)
  length = 0;

  // The actual array
  array?: T[];
}

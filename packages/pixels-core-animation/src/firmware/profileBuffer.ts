import { serializable } from "@systemic-games/pixels-core-utils";

export class BufferDescriptor {
  data = new Uint8Array();
}

export class Pointer<T> {
  // The *pointer*
  @serializable(2)
  offset = 0;
}

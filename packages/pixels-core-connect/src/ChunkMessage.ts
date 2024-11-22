import { assert, deserialize } from "@systemic-games/pixels-core-utils";

export interface ChunkMessage {
  // On initialization: size of serializable object
  // After deserialization: number of bytes read from buffer
  chunkSize: number;
}

export function deserializeChunkedMessage<
  ChunksMessage extends Readonly<
    { type: number } & {
      [key: string]: ChunkMessage;
    }
  >,
>(dataView: DataView, msg: ChunksMessage, warn?: (msg: string) => void): void {
  assert(
    dataView.getUint8(0) === msg.type,
    `Unexpected message type, got ${dataView.getUint8(0)} instead of ${msg.type}`
  );
  let offset = 1;
  for (const [key, value] of Object.entries(msg)) {
    if (key !== ("type" as keyof ChunksMessage)) {
      assert(typeof value === "object" && "chunkSize" in value);
      const dataSize = dataView.getUint8(offset);
      if (warn && value.chunkSize > 0 && dataSize !== value.chunkSize) {
        warn(
          `In message of type ${msg.type}, got '${key}' chunk of size ${dataSize} but expected ${value.chunkSize} bytes`
        );
      }
      deserialize(
        value,
        new DataView(
          dataView.buffer,
          dataView.byteOffset + offset,
          value.chunkSize === 0 ? dataSize : Math.min(dataSize, value.chunkSize)
        ),
        { allowSkipLastProps: true }
      );
      offset += dataSize;
    }
  }
}

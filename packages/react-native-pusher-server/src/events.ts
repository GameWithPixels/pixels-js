// import nacl from "tweetnacl";
// import naclUtil from "tweetnacl-util";

import { PusherServer } from "./pusher";
import * as util from "./util";

function encrypt(
  _pusher: PusherServer,
  _channel: string,
  _data?: unknown
): string {
  throw new Error("Encryption not supported (encrypt)");
  // if (pusher.config.encryptionMasterKey === undefined) {
  //   throw new Error(
  //     "Set encryptionMasterKey before triggering events on encrypted channels"
  //   );
  // }

  // const nonceBytes = nacl.randomBytes(24);

  // const ciphertextBytes = nacl.secretbox(
  //   naclUtil.decodeUTF8(JSON.stringify(data)),
  //   nonceBytes,
  //   pusher.channelSharedSecret(channel)
  // );

  // return JSON.stringify({
  //   nonce: naclUtil.encodeBase64(nonceBytes),
  //   ciphertext: naclUtil.encodeBase64(ciphertextBytes),
  // });
}

export function trigger(
  pusher: PusherServer,
  channels: string[],
  eventName: string,
  data?: unknown,
  params?: object
) {
  if (channels.length === 1 && util.isEncryptedChannel(channels[0])) {
    const channel = channels[0];
    const event = {
      name: eventName,
      data: encrypt(pusher, channel, data),
      channels: [channel],
      ...params,
    };
    return pusher.post({ path: "/events", body: event });
  } else {
    for (let i = 0; i < channels.length; i++) {
      if (util.isEncryptedChannel(channels[i])) {
        // For rationale, see limitations of end-to-end encryption in the README
        throw new Error(
          "You cannot trigger to multiple channels when using encrypted channels"
        );
      }
    }

    const event = {
      name: eventName,
      data: ensureJSON(data),
      channels,
      ...params,
    };
    return pusher.post({ path: "/events", body: event });
  }
}

export function triggerBatch(
  pusher: PusherServer,
  batch: { channel: string; data?: string }[]
): Promise<Response> {
  for (let i = 0; i < batch.length; i++) {
    batch[i].data = util.isEncryptedChannel(batch[i].channel)
      ? encrypt(pusher, batch[i].channel, batch[i].data)
      : ensureJSON(batch[i].data);
  }
  return pusher.post({ path: "/batch_events", body: { batch } });
}

function ensureJSON(data?: unknown): string {
  return typeof data === "string" ? data : JSON.stringify(data);
}

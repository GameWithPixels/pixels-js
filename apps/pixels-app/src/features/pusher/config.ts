import { Buffer } from "@craftzdog/react-native-buffer";

import { Token } from "./token";

export type ConfigOptions = {
  appId: string;
  key: string;
  secret: string;
  host: string;
  scheme?: string;
  port?: number;
  useTLS?: boolean;
  encrypted?: boolean;
  timeout?: number;
  // agent?: string;
  encryptionMasterKey?: string;
  encryptionMasterKeyBase64?: string;
};

export abstract class Config {
  protected readonly _host: string;
  protected readonly _scheme: string;
  protected readonly _port?: number;
  protected readonly _appId: string;
  protected readonly _token: Token;
  protected readonly _timeout?: number;
  // protected readonly _agent: unknown;
  protected readonly _encryptionMasterKey?: Buffer;

  get token(): Token {
    return this._token;
  }

  get timeout(): number | undefined {
    return this._timeout;
  }

  // get agent(): unknown {
  //   return this._agent;
  // }

  get encryptionMasterKey(): Buffer | undefined {
    return this._encryptionMasterKey;
  }

  constructor(options: ConfigOptions) {
    let useTLS = false;
    if (options.useTLS !== undefined && options.encrypted !== undefined) {
      throw new Error(
        "Cannot set both `useTLS` and `encrypted` configuration options"
      );
    } else if (options.useTLS !== undefined) {
      useTLS = options.useTLS;
    } else if (options.encrypted !== undefined) {
      // `encrypted` deprecated in favor of `useTLS`
      console.warn("`encrypted` option is deprecated in favor of `useTLS`");
      useTLS = options.encrypted;
    }
    this._scheme = options.scheme?.length
      ? options.scheme
      : useTLS
        ? "https"
        : "http";
    this._port = options.port;

    this._host = options.host;
    this._appId = options.appId;
    this._token = new Token(options.key, options.secret);

    this._timeout = options.timeout;
    // this._agent = options.agent;

    if (options.encryptionMasterKey ?? options.encryptionMasterKeyBase64) {
      throw new Error("Encryption not supported (Config)");
    }

    // Handle deprecated raw 32 byte string as key
    // if (options.encryptionMasterKey !== undefined) {
    //   if (options.encryptionMasterKeyBase64 !== undefined) {
    //     throw new Error(
    //       "Do not specify both encryptionMasterKey and encryptionMasterKeyBase64. " +
    //         "encryptionMasterKey is deprecated, please specify only encryptionMasterKeyBase64."
    //     );
    //   }
    //   console.warn(
    //     "`encryptionMasterKey` option is deprecated in favor of `encryptionMasterKeyBase64`"
    //   );
    //   if (typeof options.encryptionMasterKey !== "string") {
    //     throw new Error("encryptionMasterKey must be a string");
    //   }
    //   if (options.encryptionMasterKey.length !== 32) {
    //     throw new Error(
    //       "encryptionMasterKey must be 32 bytes long, but the string '" +
    //         options.encryptionMasterKey +
    //         "' is " +
    //         options.encryptionMasterKey.length +
    //         " bytes long"
    //     );
    //   }

    //   this._encryptionMasterKey = Buffer.from(options.encryptionMasterKey);
    // }

    // Handle base64 encoded 32 byte key to encourage use of the full range of byte values
    // if (options.encryptionMasterKeyBase64 !== undefined) {
    //   if (typeof options.encryptionMasterKeyBase64 !== "string") {
    //     throw new Error("encryptionMasterKeyBase64 must be a string");
    //   }
    //   if (!isBase64(options.encryptionMasterKeyBase64)) {
    //     throw new Error("encryptionMasterKeyBase64 must be valid base64");
    //   }

    //   const decodedKey = Buffer.from(
    //     options.encryptionMasterKeyBase64,
    //     "base64"
    //   );
    //   if (decodedKey.length !== 32) {
    //     throw new Error(
    //       "encryptionMasterKeyBase64 must decode to 32 bytes, but the string " +
    //         options.encryptionMasterKeyBase64 +
    //         "' decodes to " +
    //         decodedKey.length +
    //         " bytes"
    //     );
    //   }

    //   this._encryptionMasterKey = decodedKey;
    // }
  }

  abstract prefixPath(subPath: string): string;

  getBaseURL(): string {
    const port = this._port ? ":" + this._port : "";
    return this._scheme + "://" + this._host + port;
  }
}

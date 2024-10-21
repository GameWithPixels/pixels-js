import crypto from "react-native-quick-crypto";

import * as util from "./util";

/** Verifies and signs data against the key and secret.
 *
 * @constructor
 * @param {String} key app key
 * @param {String} secret app secret
 */
export class Token {
  private _key: string;
  private _secret: string;

  get key(): string {
    return this._key;
  }

  constructor(key: string, secret: string) {
    this._key = key;
    this._secret = secret;
  }

  /** Signs the string using the secret.
   *
   * @param {String} string
   * @returns {String}
   */
  sign(string: string): string {
    return crypto
      .createHmac("sha256", this._secret)
      .update(string)
      .digest("hex");
  }

  /** Checks if the string has correct signature.
   *
   * @param {String} string
   * @param {String} signature
   * @returns {Boolean}
   */
  verify(string: string, signature: string): boolean {
    return util.secureCompare(this.sign(string), signature);
  }
}

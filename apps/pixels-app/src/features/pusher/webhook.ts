import * as errors from "./errors";
import { Token } from "./token";

/** Provides validation and access methods for a WebHook.
 *
 * Before accessing WebHook data, check if it's valid. Otherwise, exceptions
 * will be raised from access methods.
 *
 * @constructor
 * @param {Token} primary token
 * @param {Object} request
 * @param {Object} request.headers WebHook HTTP headers with lower-case keys
 * @param {String} request.rawBody raw WebHook body
 */
export class WebHook {
  private _token: Token;
  private _key?: string;
  private _signature: string;
  private _contentType: string;
  private _body: string;
  private _data?: unknown;

  constructor(
    token: Token,
    request: { headers: { [key: string]: string }; rawBody: string }
  ) {
    this._token = token;

    this._key = request.headers["x-pusher-key"];
    this._signature = request.headers["x-pusher-signature"];
    this._contentType = request.headers["content-type"];
    this._body = request.rawBody;

    if (this.isContentTypeValid()) {
      try {
        // Try to parse as JSON
        this._data = JSON.parse(this._body);
      } catch {
        // Do nothing
      }
    }
  }

  /** Checks whether the WebHook has valid body and signature.
   *
   * @param {Token|Token[]} extraTokens of additional tokens to be validated against
   * @returns {Boolean}
   */
  isValid(
    extraTokens:
      | { key: string; secret: string }
      | { key: string; secret: string }[]
  ): boolean {
    if (!this.isBodyValid()) {
      return false;
    }

    extraTokens = extraTokens || [];
    if (!(extraTokens instanceof Array)) {
      extraTokens = [extraTokens];
    }

    const tokens = (
      [this._token] as ({ key: string; secret: string } | Token)[]
    ).concat(extraTokens);
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (token instanceof Token === false) {
        token = new Token(token.key, token.secret);
      }
      if (
        this._key === token.key &&
        token.verify(this._body, this._signature)
      ) {
        return true;
      }
    }
    return false;
  }

  /** Checks whether the WebHook content type is valid.
   *
   * For now, the only valid WebHooks have content type of application/json.
   *
   * @returns {Boolean}
   */
  isContentTypeValid(): boolean {
    return this._contentType === "application/json";
  }

  /** Checks whether the WebHook content type and body is JSON.
   *
   * @returns {Boolean}
   */
  isBodyValid(): boolean {
    return this._data !== undefined;
  }

  /** Returns all WebHook data.
   *
   * @throws WebHookError when WebHook is invalid
   * @returns {Object}
   */
  getData(): unknown {
    if (!this.isBodyValid()) {
      throw new errors.WebHookError(
        "Invalid WebHook body",
        this._contentType,
        this._body,
        this._signature
      );
    }
    return this._data;
  }

  /** Returns WebHook events array.
   *
   * @throws WebHookError when WebHook is invalid
   * @returns {Object[]}
   */
  getEvents(): unknown[] | undefined {
    return (this.getData() as any).events;
  }

  /** Returns WebHook timestamp.
   *
   * @throws WebHookError when WebHook is invalid
   * @returns {Date}
   */
  getTime(): Date | undefined {
    const timestamp = (this.getData() as any).time_ms;
    return timestamp ? new Date(timestamp) : undefined;
  }
}

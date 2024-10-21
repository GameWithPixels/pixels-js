import * as auth from "./auth";
import * as errors from "./errors";
import * as events from "./events";
import { PusherConfig, PusherConfigOptions } from "./pusher_config";
import * as requests from "./requests";
import { Token } from "./token";
import { WebHook } from "./webhook";

function validateChannel(channel: string): void {
  if (
    typeof channel !== "string" ||
    channel === "" ||
    channel.match(/[^A-Za-z0-9_\-=@,.;]/)
  ) {
    throw new Error("Invalid channel name: '" + channel + "'");
  }
  if (channel.length > 200) {
    throw new Error("Channel name too long: '" + channel + "'");
  }
}

function validateSocketId(socketId: string): void {
  if (
    typeof socketId !== "string" ||
    socketId === "" ||
    !socketId.match(/^\d+\.\d+$/)
  ) {
    throw new Error("Invalid socket id: '" + socketId + "'");
  }
}

function validateUserId(userId: string): void {
  if (typeof userId !== "string" || userId === "") {
    throw new Error("Invalid user id: '" + userId + "'");
  }
}

function validateUserData(userData: { [key: string]: string }): void {
  if (userData == null || typeof userData !== "object") {
    throw new Error("Invalid user data: '" + userData + "'");
  }
  validateUserId(userData.id);
}

/** Provides access to Pusher's REST API, WebHooks and authentication.
 * Modified to work with React Native, source:
 * https://github.com/pusher/pusher-http-node
 *
 * @constructor
 * @param {Object} options
 * @param {String} [options.host="api.pusherapp.com"] API hostname
 * @param {Boolean} [options.useTLS=false] whether to use TLS
 * @param {Boolean} [options.encrypted=false] deprecated; renamed to `useTLS`
 * @param {Integer} [options.port] port, default depends on the scheme
 * @param {Integer} options.appId application ID
 * @param {String} options.key application key
 * @param {String} options.secret application secret
 * @param {Integer} [options.timeout] request timeout in milliseconds
 * @param {Agent} [options.agent] http agent to use
 */
export class PusherServer {
  private readonly _config: PusherConfig;

  /** Exported {@link Token} constructor. */
  static readonly Token = Token;

  /** Exported {@link RequestError} constructor. */
  static readonly RequestError = errors.RequestError;

  /** Exported {@link WebHookError} constructor. */
  static readonly WebHookError = errors.WebHookError;

  get config(): PusherConfig {
    return this._config;
  }

  constructor(options: PusherConfigOptions) {
    this._config = new PusherConfig(options);
  }

  /** Returns a signature for given socket id, channel and socket data.
   *
   * @param {String} socketId socket id
   * @param {String} channel channel name
   * @param {Object} [data] additional socket data
   * @returns {String} authorization signature
   */
  authorizeChannel(
    socketId: string,
    channel: string,
    data: object
  ): {
    auth: string;
    channel_data?: string;
    shared_secret?: string;
  } {
    validateSocketId(socketId);
    validateChannel(channel);

    return auth.getSocketSignature(
      this,
      this._config.token,
      channel,
      socketId,
      data
    );
  }

  /** Returns a signature for given socket id and user data.
   *
   * @param {String} socketId socket id
   * @param {Object} userData user data
   * @returns {String} authentication signature
   */
  authenticateUser(
    socketId: string,
    userData: { [key: string]: string }
  ): {
    auth: string;
    user_data: string;
  } {
    validateSocketId(socketId);
    validateUserData(userData);

    return auth.getSocketSignatureForUser(
      this._config.token,
      socketId,
      userData
    );
  }

  /** Sends an event to a user.
   *
   * Event name can be at most 200 characters long.
   *
   * @param {String} userId user id
   * @param {String} event event name
   * @param data event data, objects are JSON-encoded
   * @returns {Promise} a promise resolving to a response, or rejecting to a RequestError.
   * @see RequestError
   */
  sendToUser(userId: string, event: string, data: unknown): Promise<Response> {
    if (event.length > 200) {
      throw new Error("Too long event name: '" + event + "'");
    }
    validateUserId(userId);
    return events.trigger(this, [`#server-to-user-${userId}`], event, data);
  }

  /** Terminate users's connections.
   *
   *
   * @param {String} userId user id
   * @returns {Promise} a promise resolving to a response, or rejecting to a RequestError.
   * @see RequestError
   */
  terminateUserConnections(userId: string): Promise<Response> {
    validateUserId(userId);
    return this.post({
      path: `/users/${userId}/terminate_connections`,
      body: {},
    });
  }

  /** Triggers an event.
   *
   * Channel names can contain only characters which are alphanumeric, '_' or '-'
   * and have to be at most 200 characters long.
   *
   * Event name can be at most 200 characters long.
   *
   * Returns a promise resolving to a response, or rejecting to a RequestError.
   *
   * @param {String|String[]} channel list of at most 100 channels
   * @param {String} event event name
   * @param data event data, objects are JSON-encoded
   * @param {Object} [params] additional optional request body parameters
   * @param {String} [params.socket_id] id of a socket that should not receive the event
   * @param {String} [params.info] a comma separate list of attributes to be returned in the response. Experimental, see https://pusher.com/docs/lab#experimental-program
   * @see RequestError
   */
  trigger(
    channels: string | string[],
    event: string,
    data?: unknown,
    params?: { socket_id?: string; info?: string }
  ) {
    if (params?.socket_id) {
      validateSocketId(params.socket_id);
    }
    if (!(channels instanceof Array)) {
      // add single channel to array for multi trigger compatibility
      channels = [channels];
    }
    if (event.length > 200) {
      throw new Error("Too long event name: '" + event + "'");
    }
    if (channels.length > 100) {
      throw new Error("Can't trigger a message to more than 100 channels");
    }
    for (let i = 0; i < channels.length; i++) {
      validateChannel(channels[i]);
    }
    return events.trigger(this, channels, event, data, params);
  }

  /* Triggers a batch of events
   *
   * @param {Event[]} An array of events, where Event is
   * {
   *   name: string,
   *   channel: string,
   *   data: any JSON-encodable data,
   *   socket_id: [optional] string,
   *   info: [optional] string experimental, see https://pusher.com/docs/lab#experimental-program
   * }
   */
  triggerBatch(batch: { channel: string; data?: string }[]): Promise<Response> {
    return events.triggerBatch(this, batch);
  }

  /** Makes a POST request to Pusher, handles the authentication.
   *
   * Returns a promise resolving to a response, or rejecting to a RequestError.
   *
   * @param {Object} options
   * @param {String} options.path request path
   * @param {Object} options.params query params
   * @param {String} options.body request body
   * @see RequestError
   */
  post(options: {
    path: string;
    body?: unknown;
    params?: { [key: string]: string };
  }): Promise<Response> {
    return requests.send(this._config, { ...options, method: "POST" });
  }

  /** Makes a GET request to Pusher, handles the authentication.
   *
   * Returns a promise resolving to a response, or rejecting to a RequestError.
   *
   * @param {Object} options
   * @param {String} options.path request path
   * @param {Object} options.params query params
   * @see RequestError
   */
  get(options: {
    path: string;
    params?: { [key: string]: string };
  }): Promise<Response> {
    return requests.send(this._config, { ...options, method: "GET" });
  }

  /** Creates a WebHook object for a given request.
   *
   * @param {Object} request
   * @param {Object} request.headers WebHook HTTP headers with lower-case keys
   * @param {String} request.rawBody raw WebHook body
   * @returns {WebHook}
   */
  webhook(request: {
    headers: { [key: string]: string };
    rawBody: string;
  }): WebHook {
    return new WebHook(this._config.token, request);
  }

  /** Builds a signed query string that can be used in a request to Pusher.
   *
   * @param {Object} options
   * @param {String} options.method request method
   * @param {String} options.path request path
   * @param {Object} options.params query params
   * @param {String} options.body request body
   * @returns {String} signed query string
   */
  createSignedQueryString(options: {
    method: string;
    path: string;
    body?: string;
    params?: { [key: string]: string };
  }): string {
    return requests.createSignedQueryString(this._config.token, options);
  }

  channelSharedSecret(_channel: string): string {
    throw new Error("Encryption not supported (channelSharedSecret)");
    // return crypto
    //   .createHash("sha256")
    //   .update(
    //     Buffer.concat([Buffer.from(channel), this._config.encryptionMasterKey])
    //   )
    //   .digest();
  }
}

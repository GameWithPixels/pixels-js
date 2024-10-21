import * as errors from "./errors";
import { PusherConfig } from "./pusher_config";
import { Token } from "./token";
import * as util from "./util";

const pusherLibraryVersion = "5.2.0";

const RESERVED_QUERY_KEYS = {
  auth_key: true,
  auth_timestamp: true,
  auth_version: true,
  auth_signature: true,
  body_md5: true,
};

export function send(
  config: PusherConfig,
  options: {
    method: string;
    path: string;
    body?: unknown;
    params?: { [key: string]: string };
  }
): Promise<Response> {
  const method = options.method;
  const path = config.prefixPath(options.path);
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const url = `${config.getBaseURL()}${path}?${createSignedQueryString(
    config.token,
    {
      method,
      path,
      params: options.params,
      body,
    }
  )}`;

  const headers: { [key: string]: string } = {
    "x-pusher-library": "pusher-http-node " + pusherLibraryVersion,
  };

  if (body) {
    headers["content-type"] = "application/json";
  }

  let signal;
  let timeout: ReturnType<typeof setTimeout>;
  if (config.timeout) {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), config.timeout);
    signal = controller.signal;
  }

  return fetch(url, {
    method,
    body,
    headers,
    signal,
    // agent: config.agent,
  }).then(
    (res) => {
      clearTimeout(timeout);
      if (res.status >= 400) {
        return res.text().then((body) => {
          throw new errors.RequestError(
            "Unexpected status code " + res.status,
            url,
            undefined,
            res.status,
            body
          );
        });
      }
      return res;
    },
    (err) => {
      clearTimeout(timeout);
      throw new errors.RequestError("Request failed with an error", url, err);
    }
  );
}

export function createSignedQueryString(
  token: Token,
  request: {
    method: string;
    path: string;
    body?: string;
    params?: { [key: string]: string };
  }
) {
  const timestamp = (Date.now() / 1000) | 0;

  const params: { [key: string]: string } = {
    auth_key: token.key,
    auth_timestamp: String(timestamp),
    auth_version: "1.0",
  };

  if (request.body) {
    params.body_md5 = util.getMD5(request.body);
  }

  if (request.params) {
    for (const key in request.params) {
      if (key in RESERVED_QUERY_KEYS) {
        throw Error(key + " is a required parameter and cannot be overridden");
      }
      params[key] = request.params[key];
    }
  }

  const method = request.method.toUpperCase();
  const sortedKeyVal = util.toOrderedArray(params);
  let queryString = sortedKeyVal.join("&");

  const signData = [method, request.path, queryString].join("\n");
  queryString += "&auth_signature=" + token.sign(signData);

  return queryString;
}

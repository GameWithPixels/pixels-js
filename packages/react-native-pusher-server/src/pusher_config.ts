import { Config, ConfigOptions } from "./config";

export type PusherConfigOptions = Omit<ConfigOptions, "host"> & {
  host?: string;
  cluster?: string;
};

export class PusherConfig extends Config {
  constructor(options: PusherConfigOptions) {
    super({
      ...options,
      host:
        options.host ??
        (options.cluster
          ? "api-" + options.cluster + ".pusher.com"
          : "api.pusherapp.com"),
    });
  }

  prefixPath(subPath: string): string {
    return "/apps/" + this._appId + subPath;
  }
}

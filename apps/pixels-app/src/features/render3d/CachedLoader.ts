import {
  assertNever,
  createTypedEventEmitter,
} from "@systemic-games/pixels-core-utils";

export class CachedAssetLoader<T extends object, K> {
  private readonly _loadState = new Map<string, T | "loading" | Error>();
  private readonly _loadEvent = createTypedEventEmitter<{
    done: { asset: T | Error; key: string };
  }>();
  private readonly _loadAsync: (params: K) => Promise<T>;
  private readonly _getParamsKey: (params: K) => string;

  constructor(
    loader: (params: K) => Promise<T>,
    getParamsKey: (params: K) => string
  ) {
    this._loadAsync = loader;
    this._getParamsKey = getParamsKey;
    // We may load a bunch of assets at once
    this._loadEvent.setMaxListeners(100);
  }

  async loadAsync(params: K): Promise<T> {
    const key = this._getParamsKey(params);
    const asset = this._loadState.get(key);
    if (asset instanceof Error) {
      throw asset;
    } else if (typeof asset === "object") {
      return asset;
    }
    switch (asset) {
      case undefined:
        this._loadState.set(key, "loading");
        try {
          const asset = await this._loadAsync(params);
          this._loadState.set(key, asset);
          this._loadEvent.emit("done", { asset, key });
          return asset;
        } catch (error) {
          this._loadState.set(key, error as Error);
          this._loadEvent.emit("done", { asset: error as Error, key });
          throw error;
        }
      case "loading":
        return new Promise<T>((resolve, reject) => {
          const listener = ({
            asset,
            key: loadedKey,
          }: {
            asset: T | Error;
            key: string;
          }) => {
            if (key === loadedKey) {
              this._loadEvent.removeListener("done", listener);
              if (asset instanceof Error) {
                reject(asset);
              } else {
                resolve(asset);
              }
            }
          };
          this._loadEvent.addListener("done", listener);
        });
      default:
        assertNever(asset, "Unexpected Die3D loading result");
    }
  }
}

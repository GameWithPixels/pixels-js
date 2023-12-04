export default class DataMap<In, Out> {
  private readonly _map = new Map<In, Out>();

  get(key: In): Out | undefined {
    return this._map.get(key);
  }

  getOrCreate(key: In, generate: (key: In) => Out): Out {
    let value = this._map.get(key);
    if (!value) {
      value = generate(key);
      this._map.set(key, value);
    }
    return value;
  }

  delete(key: In): void {
    this._map.delete(key);
  }

  deleteValue(value: Out): void {
    for (const [key, val] of this._map) {
      if (val === value) {
        this._map.delete(key);
      }
    }
  }
}

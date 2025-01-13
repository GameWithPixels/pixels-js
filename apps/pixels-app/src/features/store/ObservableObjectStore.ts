import { makeAutoObservable, reaction } from "mobx";

export class ObservableObjectStore<T> {
  private _obj?: T;
  private readonly _create: () => T;
  private _disposer?: () => void;
  private _counter = 0;
  private _version = 0;

  get isTaken(): boolean {
    return this._counter > 0;
  }

  get object(): T | undefined {
    return this._obj;
  }

  get version(): number {
    return this._version;
  }

  constructor(create: () => T) {
    this._create = create;
    makeAutoObservable(this);
  }

  getOrCreate(): T {
    if (!this._obj) {
      this._obj = this._create();
    }
    return this._obj;
  }

  take(): () => void {
    if (!this._disposer) {
      this._disposer = reaction(
        () => {
          const obj = this.getOrCreate();
          // React on all properties of the object except `lastModified`
          const keys = Object.getOwnPropertyNames(obj);
          return (keys as (keyof T)[])
            .filter((k) => k !== "lastModified")
            .map((k) => JSON.stringify(obj[k]))
            .join(",");
        },
        () => this._version++
      );
    }
    this._counter++;
    return () => this.release();
  }

  release(): void {
    this._counter--;
    if (this._counter <= 0) {
      this._disposer?.();
      this._disposer = undefined;
      this._version = 0;
      this._counter = 0;
      this._obj = undefined;
    }
  }

  resetVersion(): void {
    this._version = 0;
  }
}

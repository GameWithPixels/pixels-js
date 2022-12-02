import { Pixel } from "@systemic-games/react-native-pixels-connect";

import { DicePool } from "./DicePool";
import { ListChangeEvent, ListChangeOperation } from "./ListChangeEvent";

export type UpdatableProperty = "score" | "turnsLeft" | "results";

export type PlayerProperty = "name" | "ready" | UpdatableProperty;

export type PlayerPropertyChangeEvent = CustomEvent<PlayerProperty>;

export interface PlayerEventMap {
  propertyChange: PlayerPropertyChangeEvent;
  diceListChange: ListChangeEvent<Pixel>;
}

export type PropertyUpdateFunc = (
  propName: UpdatableProperty,
  value: number | number[]
) => void;

export interface Player extends EventTarget {
  addEventListener<K extends keyof PlayerEventMap>(
    type: K,
    listener: (this: Player, ev: PlayerEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof PlayerEventMap>(
    type: K,
    listener: (this: Player, ev: PlayerEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

export class Player extends EventTarget {
  private readonly _dicePool: DicePool;
  private _name: string;
  private _score = 0;
  private _turnsLeft = 0;
  private _results: number[][] = [];

  get name() {
    return this._name;
  }
  set name(name: string) {
    if (this._name !== name) {
      this._name = name;
      // Notify
      this.dispatchPropertyChange("name");
    }
  }

  // get ready() {
  //   return this._dicePool.diceCount === Rules.NUM_DICE;
  // }

  get diceCount() {
    return this._dicePool.diceCount;
  }

  get pixels() {
    return this._dicePool.pixels;
  }

  get score() {
    return this._score;
  }

  get turnsLeft() {
    return this._turnsLeft;
  }

  get results() {
    return [...this._results];
  }

  // Returns a player and a function to update some of its properties
  static CreatePlayer(
    name: string,
    dicePool?: DicePool
  ): [Player, PropertyUpdateFunc] {
    const player = new Player(name, dicePool);
    const updateProperty = (
      propName: UpdatableProperty,
      value: number | number[]
    ) => {
      if (typeof value === "number") {
        switch (propName) {
          case "score":
            if (player._score !== value) {
              player._score = value;
              player.dispatchPropertyChange("score");
            }
            break;
          case "turnsLeft":
            if (player._turnsLeft !== value) {
              player._turnsLeft = value;
              player.dispatchPropertyChange("turnsLeft");
            }
            break;
        }
      } else if (propName === "results") {
        if (value.length) {
          player._results.push(value);
          player.dispatchPropertyChange("results");
        } else if (player._results.length) {
          player._results.length = 0;
          player.dispatchPropertyChange("results");
        }
      }
    };
    return [player, updateProperty];
  }

  private constructor(name: string, dicePool?: DicePool) {
    super();
    this._name = name;
    this._dicePool = dicePool ?? new DicePool();
  }

  /*async addPixel(diceType: DiceType) {
    console.log(`TODO diceType=${diceType} will be ignored!`);
    const pixel = await Pixel.requestPixel();
    const prevCount = this.diceCount;
    if (this._dicePool.addPixel(pixel)) {
      if (prevCount !== this.diceCount) {
        // Notify
        this.dispatchDiceListEvent("add", pixel);
        if (this.ready) {
          this.dispatchPropertyChange("ready");
        }
      }
      await pixel.connect(true); //TODO auto reconnect!
      await pixel.getRollState();
      return pixel;
    }
  }

  removePixel(pixel: Pixel) {
    const wasReady = this.ready;
    const success = this._dicePool.removePixel(pixel);
    //TODO disconnect if not used by other players
    if (success) {
      // Notify
      this.dispatchDiceListEvent("remove", pixel);
      if (wasReady) {
        this.dispatchPropertyChange("ready");
      }
    }
    return success;
  }*/

  private dispatchDiceListEvent(op: ListChangeOperation, pixel: Pixel) {
    this.dispatchEvent(
      new ListChangeEvent<Pixel>("diceListChange", {
        detail: { operation: op, item: pixel },
      })
    );
  }

  private dispatchPropertyChange(propName: PlayerProperty) {
    console.log(`Player property changed: ${propName}`);
    this.dispatchEvent(new CustomEvent("propertyChange", { detail: propName }));
  }
}

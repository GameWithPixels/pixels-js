import {
  Pixel,
  repeatConnect,
} from "@systemic-games/react-native-pixels-connect";

const repeatConnectFunc = repeatConnect;

export interface RollResult {
  face: number;
  pixel: Pixel;
}

type DiceSelectionProperty = "ready" | "lastRolls" | "allDiceRolled";

type DiceSelectionPropertyChangeEvent = CustomEvent<DiceSelectionProperty>;

export interface DiceSelectionEventMap {
  propertyChange: DiceSelectionPropertyChangeEvent;
  rollResult: CustomEvent<RollResult>;
  clear: Event;
}

export interface DiceSelection extends EventTarget {
  addEventListener<K extends keyof DiceSelectionEventMap>(
    type: K,
    listener: (this: DiceSelection, ev: DiceSelectionEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof DiceSelectionEventMap>(
    type: K,
    listener: (this: DiceSelection, ev: DiceSelectionEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface DiceData {
  readonly pixel: Pixel;
  readonly rolls: number[];
  unregister: () => void;
}

export class DiceSelection extends EventTarget {
  private readonly _dice: DiceData[] = [];

  get diceCount() {
    return this._dice.length;
  }

  get pixels() {
    return this._dice.map((dd) => dd.pixel);
  }

  get ready() {
    return this.diceCount > 0 && this._dice.every((dd) => dd.pixel.isReady);
  }

  get lastRolls() {
    return this._dice
      .filter((dd) => dd.rolls.length)
      .map((dd) => dd.rolls[dd.rolls.length - 1]);
  }

  get allDiceRolled() {
    return this.lastRolls.filter(Boolean).length === this.diceCount;
  }

  constructor(pixels: Pixel[]) {
    super();
    pixels.forEach((px) => this.register(px));
  }

  toString() {
    return `DiceSelection (pixels: ${this.pixels
      .map((px) => px.name)
      .toString()})`;
  }

  async connectAll(repeatConnect?: boolean) {
    return Promise.allSettled(
      this._dice.map((dd) => {
        if (repeatConnect) {
          repeatConnectFunc(dd.pixel);
        } else {
          dd.pixel.connect();
        }
      })
    );
  }

  disconnectAll() {
    this._dice.forEach((dd) => dd.pixel.disconnect());
  }

  getRolls(pixel: Pixel) {
    return this._dice.find((dd) => dd.pixel === pixel)?.rolls;
  }

  clear(disconnect?: boolean) {
    if (this._dice.length) {
      this._dice.forEach((dd) => {
        dd.unregister();
        if (disconnect) {
          dd.pixel.disconnect();
        }
      });
      this._dice.length = 0;
      this.dispatchEvent(new Event("clear"));
    }
  }

  private register(pixel: Pixel) {
    // Callback for connection events
    /*const connEvFunc = (ev: CustomEvent<ConnectionEventData>) => {
      const data = ev.detail;
      console.log(data);
      if (data.event === ConnectionEventValues.Ready) {
        // Are we in ready state?
        if (this.ready) {
          console.log("Ready!");
          this.dispatchPropertyChange("ready");
        }
      } else if (
        this._dice.length - 1 ===
        this._dice.filter((dd) => dd.pixel.ready).length
      ) {
        // We've just transitioned from being ready to not ready
        // if this is the only die not in ready state
        if (this._dice.find((dd) => !dd.pixel.ready)?.pixel === pixel) {
          console.log("Not ready!");
          this.dispatchPropertyChange("ready");
        }
      }
    };

    // Callback for rolls
    const rolls: number[] = [];
    const rollResultFunc = (ev: CustomEvent<MessageOrType>) => {
      const rollState = ev.detail as RollState;
      if (rollState.state === PixelRollStateValues.OnFace) {
        const allRolled = this.allDiceRolled;
        rolls.push(rollState.faceIndex);
        this.dispatchPropertyChange("lastRolls");
        if (allRolled !== this.allDiceRolled) {
          this.dispatchPropertyChange("allDiceRolled");
        }
        super.dispatchEvent(
          new CustomEvent<RollResult>("rollResult", {
            detail: { face: rollState.faceIndex, pixel },
          })
        );
      }
    };

    // Store Pixel data
    this._dice.push({
      pixel,
      unregister: () => {
        pixel.removeEventListener("connectionEvent", connEvFunc);
        pixel.removeEventListener("messageRollState", rollResultFunc);
      },
      rolls,
    });

    // And listen to events
    pixel.addEventListener("connectionEvent", connEvFunc);
    pixel.addEventListener("messageRollState", rollResultFunc);*/
  }

  private dispatchPropertyChange(propName: DiceSelectionProperty) {
    console.log(`DiceSelection property changed: ${propName}`);
    this.dispatchEvent(new CustomEvent("propertyChange", { detail: propName }));
  }
}

import { Pixel } from "@systemic-games/react-native-pixels-connect";

import { ListChangeEvent, ListChangeOperation } from "./ListChangeEvent";

export interface DicePoolEventMap {
  diceListChange: ListChangeEvent<{ label: string; pixel: Pixel }>;
}

export interface DicePool extends EventTarget {
  addEventListener<K extends keyof DicePoolEventMap>(
    type: K,
    listener: (this: DicePool, ev: DicePoolEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof DicePoolEventMap>(
    type: K,
    listener: (this: DicePool, ev: DicePoolEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

// Dice bag - everything owned
// Dice pool - dice pulled from what is owned to be used during the game
// Dice selection - dice about to be rolled for in game action
// Dice roll - number result on dice after being rolled
export class DicePool extends EventTarget {
  private readonly _dice: Map<string, Pixel> = new Map();

  get diceCount() {
    return this._dice.size;
  }

  get pixels() {
    return Array.from(this._dice.values());
  }

  get labels() {
    return Array.from(this._dice.keys());
  }

  toString() {
    return `DicePool (pixels: ${this.pixels.map((px) => px.name).toString()})`;
  }

  getPixel(label: string) {
    return this._dice.get(label);
  }

  addPixel(pixel: Pixel, label?: string): boolean {
    // Check if Pixel already added
    const prevLabel = this.findLabel(pixel);
    if (prevLabel) {
      // Return false if adding it with a different name, otherwise return true
      return !label?.length || label === prevLabel;
    }

    // Generate label if none given
    if (!label?.length) {
      label = DicePool.generateLabel(pixel);
    }

    // Log
    console.log(
      `DicePool: registering Pixel ${pixel.name} with label ${label}`
    );

    // Add and notify
    this._dice.set(label, pixel);
    this.dispatchDiceListEvent("add", label, pixel);

    return true;
  }

  removePixel(pixelOrLabel: Pixel | string): boolean {
    const label =
      typeof pixelOrLabel === "string"
        ? pixelOrLabel
        : this.findLabel(pixelOrLabel);
    if (label) {
      const pixel = this._dice.get(label);
      console.assert(pixel);
      if (pixel) {
        // Log
        console.log(
          `DicePool: unregistering Pixel ${pixel.name} with label ${label}`
        );

        // Remove and notify
        this._dice.delete(label);
        this.dispatchDiceListEvent("remove", label, pixel);
        return true;
      }
    }
    return false;
  }

  /*diceFromTypes(types: DiceType[]) {
    const available = this.pixels;
    return types
      .map((t) => {
        const i = available.findIndex((px) => px.type === t);
        if (i >= 0) {
          const pixel = available[i];
          available.splice(i, 1);
          return pixel;
        }
      })
      .filter((px): px is Pixel => !!px);
  }*/

  diceFromLabels(labels: string[]) {
    return labels
      .map((l) => this.getPixel(l))
      .filter((px): px is Pixel => !!px);
  }

  private findLabel(pixel: Pixel): string | undefined {
    for (const [label, px] of this._dice.entries()) {
      if (px === pixel) {
        return label;
      }
    }
  }

  private dispatchDiceListEvent(
    op: ListChangeOperation,
    label: string,
    pixel: Pixel
  ) {
    this.dispatchEvent(
      new ListChangeEvent<{ label: string; pixel: Pixel }>("diceListChange", {
        detail: { operation: op, item: { label, pixel } },
      })
    );
  }

  // Label generation, keep them unique across all DicePool instances
  private static _generateLabelCounter = 0;
  private static generateLabel(_pixel: Pixel) {
    const i = ++DicePool._generateLabelCounter;
    return `Dice${i}`; //TODO ${pixel.type ? `-${pixel.type}` : ""}`;
  }
}

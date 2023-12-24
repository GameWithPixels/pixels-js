import { delay } from "@systemic-games/pixels-core-utils";

import PixelDispatcher from "./PixelDispatcher";
import { PrebuildAnimations } from "./PrebuildAnimations";

class PixelsDispatcher {
  private async _playSetAnimations1(pixels: PixelDispatcher[]): Promise<void> {
    const sortedPixels: PixelDispatcher[] = [];

    const pixelTypes = [
      "d20",
      "d20",
      "d12",
      "d00",
      "d10",
      "d10",
      "d8",
      "d6pipped",
      "d6pipped",
      "d6",
      "d6",
      "d4",
    ];

    for (let i = 0; i < pixelTypes.length; ++i) {
      const die = pixels.find(
        (p) => p.dieType === pixelTypes[i] && !sortedPixels.includes(p)
      ) as PixelDispatcher;
      if (die !== undefined) {
        sortedPixels.push(die);
      }
    }

    sortedPixels[0].dispatch("playAnimation", PrebuildAnimations.rainbow);
    await delay(100);
    sortedPixels[1].dispatch(
      "playAnimation",
      PrebuildAnimations.rainbowAllFaces
    );
    await delay(100);
    sortedPixels[2].dispatch(
      "playAnimation",
      PrebuildAnimations.rainbowAllFaces
    );
    await delay(100);
    sortedPixels[3].dispatch(
      "playAnimation",
      PrebuildAnimations.rainbowAllFaces
    );
    await delay(100);
    sortedPixels[4].dispatch(
      "playAnimation",
      PrebuildAnimations.rainbowAllFaces
    );
    await delay(100);
    sortedPixels[5].dispatch(
      "playAnimation",
      PrebuildAnimations.rainbowAllFaces
    );
    await delay(100);
    sortedPixels[6].dispatch(
      "playAnimation",
      PrebuildAnimations.rainbowAllFaces
    );
    await delay(100);

    await delay(5000);
  }

  private async _playSetAnimations2(pixels: PixelDispatcher[]): Promise<void> {
    pixels.forEach((p) => {
      if (p.dieType === "d20") {
        p.dispatch("playAnimation", PrebuildAnimations.rainbow_as);
      }
    });
    await delay(100);

    pixels.forEach((p) => {
      if (p.dieType === "d8") {
        p.dispatch("playAnimation", PrebuildAnimations.rainbowAllFaces_as);
      }
    });
    await delay(100);

    pixels.forEach((p) => {
      if (p.dieType === "d6") {
        p.dispatch("playAnimation", PrebuildAnimations.rainbowAllFaces_as);
      }
    });
    await delay(5000);
  }

  private async _playSetAnimations3(pixels: PixelDispatcher[]): Promise<void> {
    const sortedPixels: PixelDispatcher[] = [];
    sortedPixels.length = 7;
    const d20Pixel = pixels.find((p) => p.dieType === "d20") as PixelDispatcher;
    sortedPixels[0] = pixels.find(
      (p) => p.dieType === "d12"
    ) as PixelDispatcher;
    sortedPixels[1] = pixels.find(
      (p) => p.dieType === "d10"
    ) as PixelDispatcher;
    sortedPixels[2] = pixels.find((p) => p.dieType === "d8") as PixelDispatcher;
    sortedPixels[3] = pixels.find(
      (p) => p.dieType === "d6pipped"
    ) as PixelDispatcher;
    sortedPixels[4] = pixels.find(
      (p) => p.dieType === "d6pipped" && p !== sortedPixels[3]
    ) as PixelDispatcher;
    sortedPixels[5] = pixels.find((p) => p.dieType === "d4") as PixelDispatcher;

    d20Pixel.dispatch("playAnimation", PrebuildAnimations.rainbow_as);
    for (let i = 0; i < 6; i += 1) {
      sortedPixels[i].dispatch(
        "playAnimation",
        PrebuildAnimations.rainbowAllFaces_as
      );
      await delay(100);
    }
    await delay(5000);
  }

  private async _playSetAnimations4(pixels: PixelDispatcher[]): Promise<void> {
    const sortedPixels: PixelDispatcher[] = [];
    sortedPixels.length = 7;
    sortedPixels[0] = pixels.find(
      (p) => p.dieType === "d20"
    ) as PixelDispatcher;
    sortedPixels[1] = pixels.find(
      (p) => p.dieType === "d12"
    ) as PixelDispatcher;
    sortedPixels[2] = pixels.find(
      (p) => p.dieType === "d00"
    ) as PixelDispatcher;
    sortedPixels[3] = pixels.find(
      (p) => p.dieType === "d10"
    ) as PixelDispatcher;
    sortedPixels[4] = pixels.find((p) => p.dieType === "d8") as PixelDispatcher;
    sortedPixels[5] = pixels.find((p) => p.dieType === "d6") as PixelDispatcher;
    sortedPixels[6] = pixels.find((p) => p.dieType === "d4") as PixelDispatcher;

    for (let i = 0; i < 7; i += 1) {
      sortedPixels[i].dispatch("playAnimation", PrebuildAnimations.normals3);
      await delay(100);
    }
    await delay(5000);
  }

  private async _playAllAnimations(pixels: PixelDispatcher[]): Promise<void> {
    await this._playSetAnimations1(pixels);
  }

  private async _playAllAnimations2(pixels: PixelDispatcher[]): Promise<void> {
    await this._playSetAnimations2(pixels);
  }

  private async _playAllAnimations3(pixels: PixelDispatcher[]): Promise<void> {
    await this._playSetAnimations3(pixels);
  }

  playSetAnimations(pixels: PixelDispatcher[]): void {
    this._playAllAnimations(pixels).catch((error) => {
      console.error(`PixelsDispatcher error` + error);
    });
  }

  playSetAnimations2(pixels: PixelDispatcher[]): void {
    this._playAllAnimations2(pixels).catch((error) => {
      console.error(`PixelsDispatcher error` + error);
    });
  }

  playSetAnimations3(pixels: PixelDispatcher[]): void {
    this._playAllAnimations3(pixels).catch((error) => {
      console.error(`PixelsDispatcher error` + error);
    });
  }
}

export default PixelsDispatcher;

import { DiceUtils, PixelDieType } from "@systemic-games/pixels-core-animation";
import { ThreeDDiceAPI } from "dddice-js";

export type ThreeDDiceConnectorParams = {
  apiKey: string;
  roomSlug: string;
  theme?: string;
  password?: string;
  userUuid?: string;
};

export class ThreeDDiceConnector {
  readonly api: ThreeDDiceAPI;
  readonly roomSlug: string;
  readonly roomPasscode?: string;
  readonly userUuid?: string;
  readonly theme?: string;

  constructor({
    apiKey,
    roomSlug,
    password,
    userUuid,
    theme,
  }: ThreeDDiceConnectorParams) {
    this.api = new ThreeDDiceAPI(apiKey);
    this.roomSlug = roomSlug;
    this.roomPasscode = password;
    this.userUuid = userUuid;
    this.theme = theme;
    console.log("ThreeDDiceAPI created");
  }

  async connect(): Promise<void> {
    // onConnectionStateChange: (callback: (state: string) => any) => ThreeDDiceAPI;
    // onConnectionError: (callback: ConnectionErrorCallback) => ThreeDDiceAPI;
    // onConnect: (callback: ConnectionCreatedCallback) => ThreeDDiceAPI;
    this.api.connect(this.roomSlug, this.roomPasscode, this.userUuid);
    console.log("Connected to 3D Dice API");
  }

  async rollDice(
    dieType: PixelDieType,
    value: number,
    pixelName?: string
  ): ReturnType<typeof ThreeDDiceAPI.prototype.roll.create> {
    const rollResult = await this.api.roll.create([
      {
        type: `d${DiceUtils.getFaceCount(dieType)}`,
        theme: this.theme ?? "dddice-bees",
        value,
        label: pixelName ?? "Pixels",
      },
    ]);
    console.log("Roll result:", JSON.stringify(rollResult));
    return rollResult;
  }
}
// t4JlcqZ3y4L8CjTdwumpi922e0i17o6C6GC3Z2po45e45037

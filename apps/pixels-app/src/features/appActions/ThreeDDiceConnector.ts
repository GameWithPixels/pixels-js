import { DiceUtils, PixelDieType } from "@systemic-games/pixels-core-animation";
import { parseRollEquation, ThreeDDiceAPI } from "dddice-js";

export type ThreeDDiceConnectorParams = {
  apiKey: string;
  roomSlug: string;
  password?: string;
  userUuid?: string;
};

export class ThreeDDiceConnector {
  readonly api: ThreeDDiceAPI;
  readonly roomSlug: string;
  readonly roomPasscode?: string;
  readonly userUuid?: string;

  constructor({
    apiKey,
    roomSlug,
    password,
    userUuid,
  }: ThreeDDiceConnectorParams) {
    this.api = new ThreeDDiceAPI(apiKey);
    this.roomSlug = roomSlug;
    this.roomPasscode = password;
    this.userUuid = userUuid;
    console.log("ThreeDDiceAPI created");
  }

  async connect(): Promise<void> {
    // onConnectionStateChange: (callback: (state: string) => any) => ThreeDDiceAPI;
    // onConnectionError: (callback: ConnectionErrorCallback) => ThreeDDiceAPI;
    // onConnect: (callback: ConnectionCreatedCallback) => ThreeDDiceAPI;
    this.api.connect(this.roomSlug, this.roomPasscode, this.userUuid);
    console.log("Connected to 3D Dice API");
  }

  async rollDice(dieType: PixelDieType) {
    const { dice } = parseRollEquation(
      `1d${DiceUtils.getFaceCount(dieType)}`,
      "dddice-bees"
    );
    const rollResult = await this.api.roll.create(dice);
    console.log("Roll result:", JSON.stringify(rollResult));
  }
}

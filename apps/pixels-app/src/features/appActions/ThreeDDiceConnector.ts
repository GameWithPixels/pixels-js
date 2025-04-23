import { DiceUtils } from "@systemic-games/pixels-core-animation";
import { PixelInfo } from "@systemic-games/pixels-core-connect";
import { ThreeDDiceAPI, ITheme } from "dddice-js";

export async function authenticate(
  onCodeGenerated: (code: string) => void,
  onAuthenticated: (apiKey: string) => void
) {
  const api = new ThreeDDiceAPI();
  const info = await api.user.activate();
  onCodeGenerated(info.code);
  onAuthenticated(await info.apiKey);
}

export type ThreeDDiceConnectorParams = {
  apiKey: string;
  roomSlug: string;
  theme?: string;
  password?: string;
  userUuid?: string;
};

export type ThreeDDiceThemes = {
  id: string;
  name?: string;
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
    const user = await this.api.user.get();
    // @ts-ignore
    const userUUID = user.data.uuid;
    this.api.connect(this.roomSlug, this.roomPasscode, userUUID);
    console.log("Connected to 3D Dice API");
  }

  async rollDice(
    die: Omit<PixelInfo, "systemId">,
    value: number,
    pixelName?: string
  ): ReturnType<typeof ThreeDDiceAPI.prototype.roll.create> {
    let dieTheme = "dddice-bees";
    if (die.colorway === "auroraSky") {
      dieTheme = "pixels-mg-m9spm1vz";
    } else if (die.colorway === "midnightGalaxy") {
      dieTheme = "pixels-mg-m9splf6i";
    }

    const rollResult = await this.api.roll.create([
      {
        type: `d${DiceUtils.getFaceCount(die.dieType)}`,
        theme: dieTheme,
        value,
        label: pixelName ?? "Pixels",
      },
    ]);
    return rollResult;
  }

  async listThemes(): Promise<ThreeDDiceThemes[]> {
    const retThemes: ThreeDDiceThemes[] = [];
    let apiThemes: ITheme[] | undefined = (await this.api.diceBox.list()).data;
    do {
      apiThemes.forEach((theme) => {
        retThemes.push({ id: theme.id, name: theme.name });
      });
      const themesPromise = await this.api.diceBox.next();
      apiThemes = themesPromise?.data;
    } while (apiThemes);
    return retThemes;
  }
}

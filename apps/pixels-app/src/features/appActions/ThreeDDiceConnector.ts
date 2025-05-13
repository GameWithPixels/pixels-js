import { DiceUtils } from "@systemic-games/pixels-core-animation";
import { PixelInfo } from "@systemic-games/pixels-core-connect";
import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import { ThreeDDiceAPI, ITheme } from "dddice-js";

import { logError } from "../utils";

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

/**
 * Event map for {@link ThreeDDiceConnector} class.
 */
export type ThreeDDiceConnectorEventMap = Readonly<{
  onConnected: boolean; // The connection event may be triggered a little later than the actual connection
}>;

export class ThreeDDiceConnector {
  private readonly _evEmitter =
    createTypedEventEmitter<ThreeDDiceConnectorEventMap>();
  private readonly _api: ThreeDDiceAPI;
  private readonly _roomSlug: string;
  private readonly _roomPasscode?: string;
  private readonly _theme?: string;
  private readonly _connected = false;
  private _isHooked = false;

  static async authorizeAsync(): Promise<{
    code: string;
    expiresAt: Date;
    getAPIKeyPromise: Promise<string>;
  }> {
    const api = new ThreeDDiceAPI();
    const info = await api.user.activate();
    const expiresAt = new Date(info.expiresAt);
    return { code: info.code, expiresAt, getAPIKeyPromise: info.apiKey };
  }

  get isConnected(): boolean {
    return this._connected;
  }

  constructor({
    apiKey,
    roomSlug,
    password,
    theme,
  }: ThreeDDiceConnectorParams) {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    this._api = new ThreeDDiceAPI(apiKey);
    this._roomSlug = roomSlug;
    this._roomPasscode = password;
    this._theme = theme;
    console.log("ThreeDDiceAPI created with API key " + apiKey);
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link ThreeDDiceConnectorEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addListener<K extends keyof ThreeDDiceConnectorEventMap>(
    type: K,
    listener: EventReceiver<ThreeDDiceConnectorEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link ThreeDDiceConnectorEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeListener<K extends keyof ThreeDDiceConnectorEventMap>(
    type: K,
    listener: EventReceiver<ThreeDDiceConnectorEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  async connectAsync(): Promise<void> {
    // const user = await this._api.user.get();
    // const userUUID = user.data.uuid;
    this._api.connect(this._roomSlug, this._roomPasscode);
    if (!this._isHooked) {
      // We should hook in the constructor but we get an error when trying
      // to register the event listener before calling connect()
      this._isHooked = true;
      this._api.onConnectionStateChange((e) => {
        console.warn(`DDDice connection state changed: ${e}`);
        this._emitEvent("onConnected", e === "connected");
      });
    }
  }

  disconnect(): void {
    // This call doesn't trigger the onConnectionStateChange event
    this._api.disconnect();
  }

  async rollDiceAsync(
    die: Pick<PixelInfo, "name" | "colorway" | "dieType">,
    value: number
  ): Promise<{
    roomSlug: string;
    formula: string;
    value: number;
  }> {
    let dieTheme = "dddice-bees";
    if (die.colorway === "auroraSky") {
      dieTheme = "pixels-mg-m9spm1vz";
    } else if (die.colorway === "midnightGalaxy") {
      dieTheme = "pixels-mg-m9splf6i";
    }

    const { data } = await this._api.roll.create([
      {
        type: `d${DiceUtils.getFaceCount(die.dieType)}`,
        theme: dieTheme,
        value,
        label: die.name,
      },
    ]);
    return {
      roomSlug: data.room.slug,
      formula: data.equation,
      value: data.total_value,
    };
  }

  async listThemesAsync(): Promise<ThreeDDiceThemes[]> {
    const themes: ThreeDDiceThemes[] = [];
    let apiThemes: ITheme[] | undefined = (await this._api.diceBox.list()).data;
    do {
      themes.push(
        ...apiThemes.map((theme) => ({ id: theme.id, name: theme.name }))
      );
      apiThemes = (await this._api.diceBox.next())?.data;
    } while (apiThemes);
    return themes;
  }

  private _emitEvent<T extends keyof ThreeDDiceConnectorEventMap>(
    name: T,
    ev: ThreeDDiceConnectorEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      logError(
        `ThreeDDiceConnector: Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }
}

import { DiceUtils } from "@systemic-games/pixels-core-animation";
import { PixelInfo } from "@systemic-games/pixels-core-connect";
import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import { ThreeDDiceAPI, ITheme } from "dddice-js";

import { logError } from "../utils";

export type ThreeDDiceRoomConnectParams = {
  roomSlug: string;
  password?: string;
};

export type ThreeDDiceTheme = {
  id: string;
  name?: string;
};

/**
 * Event map for {@link ThreeDDiceConnector} class.
 */
export type ThreeDDiceConnectorEventMap = Readonly<{
  onConnected: boolean; // The connection event may be triggered a little later than the actual connection
}>;

// Light wrapper around the dddice-js API to adapt it to our use case
export class ThreeDDiceConnector {
  private readonly _evEmitter =
    createTypedEventEmitter<ThreeDDiceConnectorEventMap>();
  private readonly _api: ThreeDDiceAPI;
  private _connected = false;
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

  get roomSlug(): string | undefined {
    return this._api.roomSlug;
  }

  get userUuid(): string | undefined {
    return this._api.userUuid;
  }

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    this._api = new ThreeDDiceAPI(apiKey);
    console.log(
      `ThreeDDiceAPI created with API key {${apiKey.substring(0, 5)}...}`
    );
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

  async getRoomSlugsAsync(): Promise<string[]> {
    const { data } = await this._api.room.list();
    return data.map((room) => room.slug);
  }

  async getThemesAsync(): Promise<ThreeDDiceTheme[]> {
    const themes: ThreeDDiceTheme[] = [];
    let apiThemes: ITheme[] | undefined = (await this._api.diceBox.list()).data;
    do {
      themes.push(
        ...apiThemes.map((theme) => ({ id: theme.id, name: theme.name }))
      );
      apiThemes = (await this._api.diceBox.next())?.data;
    } while (apiThemes);
    return themes;
  }

  async connectAsync({
    roomSlug,
    password,
  }: ThreeDDiceRoomConnectParams): Promise<void> {
    console.log(`ThreeDDiceAPI connecting to room ${roomSlug}`);
    this._api.connect(roomSlug, password);
    if (!this._isHooked) {
      // We should hook in the constructor but we get an error when trying
      // to register the event listener before calling connect()
      this._isHooked = true;
      this._api.onConnectionStateChange((e) => {
        console.warn(`DDDice connection state changed: ${e}`);
        this._connected = e === "connected";
        this._emitEvent("onConnected", this._connected);
      });
    }
  }

  disconnect(): void {
    // This call doesn't trigger the onConnectionStateChange event
    this._api.disconnect();
  }

  async rollDiceAsync(
    die: Pick<PixelInfo, "name" | "colorway" | "dieType">,
    value: number,
    themeId?: string
  ): Promise<{
    roomSlug: string;
    formula: string;
    value: number;
  }> {
    const theme =
      themeId ??
      (die.colorway === "auroraSky"
        ? "pixels-mg-m9spm1vz"
        : die.colorway === "midnightGalaxy"
          ? "pixels-mg-m9splf6i"
          : "dddice-bees");
    const { data } = await this._api.roll.create([
      {
        type: `d${DiceUtils.getFaceCount(die.dieType)}`,
        theme,
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

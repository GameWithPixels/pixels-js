import { PixelInfo } from "@systemic-games/pixels-core-connect";

import { Connection } from "~/app/AppConnections";
import {
  ThreeDDiceConnector,
  ThreeDDiceRoomConnectParams,
} from "~/features/appActions/ThreeDDiceConnector";

export class DDDiceRoomConnection implements Connection {
  private readonly _connector: ThreeDDiceConnector;
  private _roomParams?: ThreeDDiceRoomConnectParams;

  get isConnected(): boolean {
    return this._connector.isConnected;
  }

  get roomSlug(): string | undefined {
    return this._connector.roomSlug;
  }

  get userUuid(): string | undefined {
    return this._connector.userUuid;
  }

  get theme(): string | undefined {
    return this._connector.theme;
  }

  constructor(apiKey: string) {
    this._connector = new ThreeDDiceConnector(apiKey);
  }

  setRoomParams(params: ThreeDDiceRoomConnectParams): void {
    this._roomParams = {
      roomSlug: params.roomSlug,
      theme: params.theme,
      password: params.password,
      userUuid: params.userUuid,
    };
  }

  onConnected(callback: (connected: boolean) => void) {
    this._connector.addListener("onConnected", callback);
  }

  connectAsync(): Promise<void> {
    if (!this._roomParams) {
      throw new Error("Room parameters are not set for connection");
    }
    return this._connector.connectAsync(this._roomParams);
  }

  async disconnectAsync(): Promise<void> {
    this._connector.disconnect();
  }

  getRoomSlugsAsync(): Promise<string[]> {
    return this._connector.getRoomSlugsAsync();
  }

  sendRollAsync(
    die: Pick<PixelInfo, "name" | "colorway" | "dieType">,
    value: number
  ): ReturnType<typeof ThreeDDiceConnector.prototype.rollDiceAsync> {
    return this._connector.rollDiceAsync(die, value);
  }
}

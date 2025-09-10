import { PixelInfo } from "@systemic-games/pixels-core-connect";

import { AppConnections, Connection } from "~/app/AppConnections";
import {
  ThreeDDiceConnector,
  ThreeDDiceRoomConnectParams,
  ThreeDDiceTheme,
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

  constructor(apiKey: string) {
    this._connector = new ThreeDDiceConnector(apiKey);
  }

  setRoomParams(params: ThreeDDiceRoomConnectParams): void {
    this._roomParams = {
      roomSlug: params.roomSlug,
      password: params.password,
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

  getThemesAsync(): Promise<ThreeDDiceTheme[]> {
    return this._connector.getThemesAsync();
  }

  sendRollAsync(
    die: Pick<PixelInfo, "name" | "colorway" | "dieType">,
    value: number,
    themeId?: string
  ): ReturnType<typeof ThreeDDiceConnector.prototype.rollDiceAsync> {
    return this._connector.rollDiceAsync(die, value, themeId);
  }
}

function createConnection(
  connections: AppConnections,
  id: string,
  apiKey: string
): DDDiceRoomConnection {
  console.log(`Creating new connection object for action ${id}`);
  const conn = new DDDiceRoomConnection(apiKey);
  connections.addConnection(id, conn);
  return conn;
}

export function getDDDiceRoomConnection(
  connections: AppConnections,
  id: string,
  apiKey: string
): DDDiceRoomConnection {
  return (
    connections.getTypedConnection(id, DDDiceRoomConnection) ??
    createConnection(connections, id, apiKey)
  );
}

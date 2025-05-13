import { PixelInfo } from "@systemic-games/pixels-core-connect";
import React from "react";

import { AppConnections, Connection } from "~/app/AppConnections";
import {
  ThreeDDiceConnector,
  ThreeDDiceConnectorParams,
} from "~/features/appActions/ThreeDDiceConnector";

export class DDDiceConnection implements Connection {
  private _connector: ThreeDDiceConnector;

  get isConnected() {
    return this._connector.isConnected;
  }

  constructor(connectionParams: ThreeDDiceConnectorParams) {
    this._connector = new ThreeDDiceConnector(connectionParams);
  }

  onConnected(callback: (connected: boolean) => void) {
    this._connector.addListener("onConnected", callback);
  }

  connectAsync(): Promise<void> {
    return this._connector.connectAsync();
  }

  async disconnectAsync(): Promise<void> {
    this._connector.disconnect();
  }

  sendRollAsync(
    die: Pick<PixelInfo, "name" | "colorway" | "dieType">,
    value: number
  ): ReturnType<typeof ThreeDDiceConnector.prototype.rollDiceAsync> {
    return this._connector.rollDiceAsync(die, value);
  }
}

export const AppConnectionsContext = React.createContext<AppConnections>(
  new AppConnections()
);

export function useAppConnections(): AppConnections {
  return React.useContext(AppConnectionsContext);
}

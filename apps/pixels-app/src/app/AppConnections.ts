export interface Connection {
  isConnected: boolean;
  onConnected(callback: (connected: boolean) => void): void;
  connectAsync: () => Promise<void>;
  disconnectAsync: () => Promise<void>;
}

export class AppConnections {
  private _connections: Map<string, Connection> = new Map();

  get connections(): Connection[] {
    return [...this._connections.values()];
  }

  addConnection(id: string, connection: Connection): void {
    if (!id) {
      throw new Error("Connection ID is required");
    }
    if (this._connections.has(id)) {
      throw new Error(`Connection with ID "${id}" already exists.`);
    }
    this._connections.set(id, connection);
  }

  getConnection(id: string): Connection | undefined {
    return this._connections.get(id);
  }

  getTypedConnection<T extends Connection>(
    id: string,
    type: new (...args: any[]) => T
  ): T | undefined {
    const connection = this._connections.get(id);
    if (connection instanceof type) {
      return connection;
    } else if (connection) {
      throw new Error(
        `Connection with ID "${id}" is not of type ${type.name}.`
      );
    }
    return undefined;
  }

  removeConnection(name: string): boolean {
    return this._connections.delete(name);
  }

  clear() {
    this._connections.forEach((connection) => {
      connection.disconnectAsync().catch((error) => {
        console.error(
          `Error disconnecting from ${connection} on clear: ${error}`
        );
      });
    });
    this._connections.clear();
  }
}

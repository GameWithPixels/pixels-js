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

  addConnection(name: string, connection: Connection): void {
    if (this._connections.has(name)) {
      throw new Error(`Connection with name "${name}" already exists.`);
    }
    this._connections.set(name, connection);
  }

  getConnection(name: string): Connection | undefined {
    return this._connections.get(name);
  }

  getTypedConnection<T extends Connection>(
    name: string,
    type: new (...args: any[]) => T
  ): T | undefined {
    const connection = this._connections.get(name);
    if (connection instanceof type) {
      return connection;
    } else if (connection) {
      throw new Error(
        `Connection with name "${name}" is not of type ${type.name}.`
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

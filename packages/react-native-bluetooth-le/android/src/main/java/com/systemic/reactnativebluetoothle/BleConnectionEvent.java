package com.systemic.reactnativebluetoothle;

import androidx.annotation.NonNull;

public enum BleConnectionEvent {
    /**
     * Raised at the beginning of the connect sequence and is followed either by Connected or FailedToConnect.
     */
    Connecting("connecting"),

    /**
     * Raised once the peripheral is connected, just before services are being discovered.
     */
    Connected("connected"),

    /**
     * Raised when the peripheral fails to connect, the reason for the failure is also given.
     */
    FailedToConnect("failedToConnect"),

    /**
     * Raised after a Connected event, once the required services have been discovered.
     */
    Ready("ready"),

    /**
     * Raised at the beginning of a user initiated disconnect.
     */
    Disconnecting("disconnecting"),

    /**
     * Raised when the peripheral is disconnected, the reason for the disconnection is also given.
     */
    Disconnected("disconnected");

    private String _name;

    BleConnectionEvent(@NonNull String name) {
        _name = name;
    }

    @NonNull
    public String getName() {
        return _name;
    }
}

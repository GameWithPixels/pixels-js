package com.systemic.reactnativebluetoothle;

import androidx.annotation.NonNull;

public enum BleEvent {
    /**
     * Raised after initializing the module.
     */
    BluetoothState("bluetoothState"),

    /**
     * Raised for each BLE scan result, may be raised for the same device multiple times.
     */
    ScanResult("scanResult"),

    /**
     * Raised for each Peripheral connection event.
     */
    ConnectionEvent("connectionEvent"),

    /**
     * Raised when a subscribed characteristic value changes.
     */
    CharacteristicValueChanged("characteristicValueChanged");

    private String _name;

    BleEvent(@NonNull String name) {
        _name = name;
    }

    @NonNull
    public String getName() {
        return _name;
    }
}

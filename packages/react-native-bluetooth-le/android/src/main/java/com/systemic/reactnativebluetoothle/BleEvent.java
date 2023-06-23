package com.systemic.reactnativebluetoothle;

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

    BleEvent(String name) {
        _name = name;
    }

    public String getName() {
        return _name;
    }
}

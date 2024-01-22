package com.systemic.reactnativebluetoothle;

import android.bluetooth.BluetoothAdapter;
import androidx.annotation.NonNull;

public enum BluetoothStateEvent {
    // Match iOS bluetooth states
    Unknown("unknown"),
    Off("off"),
    Resetting("resetting"),
    Unauthorized("unauthorized"),
    Ready("ready");

    private String _name;

    BluetoothStateEvent(@NonNull String name) {
        _name = name;
    }

    @NonNull
    public String getName() {
        return _name;
    }

    @NonNull
    public static BluetoothStateEvent fromInt(int state) {
        switch (state) {
            case BluetoothAdapter.STATE_OFF:
                return BluetoothStateEvent.Off;
            case BluetoothAdapter.STATE_TURNING_OFF:
                return BluetoothStateEvent.Off;
            case BluetoothAdapter.STATE_ON:
                return BluetoothStateEvent.Ready;
            case BluetoothAdapter.STATE_TURNING_ON:
                return BluetoothStateEvent.Resetting;
            default:
                return BluetoothStateEvent.Unknown;
        }
    }
}

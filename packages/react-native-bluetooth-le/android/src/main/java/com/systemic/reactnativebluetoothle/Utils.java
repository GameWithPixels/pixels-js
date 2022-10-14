package com.systemic.reactnativebluetoothle;

import android.bluetooth.BluetoothDevice;

public class Utils {
    public  static int getDeviceSystemId(BluetoothDevice device) {
        return device.hashCode();
    }
}

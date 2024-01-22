package com.systemic.reactnativebluetoothle;

import android.bluetooth.BluetoothDevice;

public class Utils {
    public static long addressToNumber(String address) {
        try {
            return Long.parseLong(address.replace(":", ""), 16);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}

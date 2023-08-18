package com.systemic.zplprint;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;
import android.util.Pair;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresPermission;
import androidx.core.app.ActivityCompat;

import java.io.IOException;
import java.util.List;
import java.util.Set;

public class BluetoothPrinter {
    public static final String TAG = "SystemicGames";

    @RequiresPermission(value = "android.permission.BLUETOOTH_CONNECT")
    public static Pair<BluetoothDevice, String> getBluetoothPrinter(@NonNull Context context, @Nullable String printerName) {
        BluetoothDevice printer = null;
        String result = "";
        final BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter == null) {
            result = "Bluetooth not supported";
        } else if (!bluetoothAdapter.isEnabled()) {
            result = "Bluetooth is turned off";
        } else {
            final Set<BluetoothDevice> boundedDevices = bluetoothAdapter.getBondedDevices();
            if (boundedDevices.isEmpty()) {
                result = "No paired Bluetooth device";
            } else {
                for (final BluetoothDevice device : boundedDevices) {
                    if (printer != null) {
                        result = "More than one ZTL printer";
                        printer = null;
                        break;
                    }
                    if (printerName == null || device.getName().startsWith(printerName)) {
                        // bluetoothAdapter.cancelDiscovery();
                        printer = device;
                    }
                }
            }
        }
        return Pair.create(printer, result);
    }

    public static void print(@NonNull BluetoothDevice device, @NonNull List<byte[]> zplBytes) throws IOException, SecurityException {
        // Connect to serial port and send data
        final BluetoothSerial blStream = new BluetoothSerial(device);
        for (final byte[] block : zplBytes) {
            blStream.send(block);
        }
        blStream.close();
    }
}

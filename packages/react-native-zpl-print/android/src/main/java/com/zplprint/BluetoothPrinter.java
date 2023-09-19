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
import java.util.ArrayList;
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
                final ArrayList<BluetoothDevice> matching = new ArrayList();
                for (final BluetoothDevice device : boundedDevices) {
                    if (printerName == null || device.getName().startsWith(printerName)) {
                        matching.add(device);
                    }
                }
                // bluetoothAdapter.cancelDiscovery();
                if (matching.size() == 0) {
                    result = "No matching printer";
                } else if (matching.size() == 1) {
                    printer = matching.get(0);
                } else {
                    result = "Several matching printer: ";
                    boolean first = true;
                    for (final BluetoothDevice device : matching) {
                        if (!first) {
                            result += ", ";
                        }
                        result += device.getName();
                        first = false;
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

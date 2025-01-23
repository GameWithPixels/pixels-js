package com.systemic.bluetoothle;

import java.util.ArrayList;
import java.util.List;

import android.content.Context;
import android.os.ParcelUuid;
import android.util.Log;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;

import androidx.annotation.NonNull;

import no.nordicsemi.android.support.v18.scanner.*;

/**
 * @brief Static class with methods for running a Bluetooth Low Energy (BLE) scan.
 *
 * @note This class was designed to work in a Unity plugin and its marshaling
 *       mechanism, and as such the advertisement data returned by a scan is passed
 *       as JSON string rather than a complex object.
 *
 * It relies on Nordic's Android-Scanner-Compat-Library library for most of the work.
 * @see https://github.com/NordicSemiconductor/Android-Scanner-Compat-Library
 */
public final class Scanner
{
    /**
     * @brief Interface for scan results callbacks.
     */
    public interface ScannerCallback
    {
        /**
         * @brief A callback invoked when an advertisement packet is received
         *        from a Bluetooth device.
         *
         * @param scanResult Tne ScanResult data including the device and the advertisement data.
         */
        public void onScanResult(ScanResult scanResult);

        /**
         * @brief A callback invoked when the scan fails.
         *
         * @param error An error code for the reason that caused the scan to fail.
         */
        public void onScanFailed(int errorCode);
    }

    private static String TAG = "SystemicGames";
    private static ScanCallback _scanCallback;
    private static Object _scanSync = new Object();

    /**
     * @brief Starts scanning for BLE peripherals advertising the given list of services.
     *
     * If a scan is already running, it is stopped before starting the new one.
     *
     * @param servicesUuids Comma separated list of services UUIDs. Peripherals advertising at least one of
     *                      the services will be reported. Notify for all peripherals if the list is null or empty.
     * @param callback The callback for notifying of the scan results (called for each advertisement packet).
     */
    public static void startScan(final String servicesUuids, final ScannerCallback callback)
    {
        Log.v(TAG, "==> startScan");

        if (callback == null)
        {
            throw new IllegalArgumentException("callback is null");
        }

        // Build scan settings
        ScanSettings settings = new ScanSettings.Builder()
            .setLegacy(false) // Default is true for compatibility with older apps, but we all type of advertisements, not just legacy
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY) // Default is low power which is good for long scans, in our use case we do short scans and we prefer having quick results
            .build(); // Other defaults are great for us

        // Convert the comma separated list of UUIDs
        List<ScanFilter> filters = null;
        if (servicesUuids != null)
        {
            filters = new ArrayList<>();
            for (String uuidStr : servicesUuids.split(","))
            {
                try
                {
                    if (uuidStr.length() > 0)
                    {
                        Log.v(TAG, "==> scan filter: " + uuidStr);
                        ParcelUuid uuid = ParcelUuid.fromString(uuidStr);
                        filters.add(new ScanFilter.Builder().setServiceUuid(uuid).build());
                    }
                }
                catch (IllegalArgumentException e)
                {
                    throw new IllegalArgumentException("servicesUuids must be either null, an empty string or a comma separated list of UUIDs");
                }
            }
        }

        synchronized (_scanSync)
        {
            // Only one scan at a time
            if (_scanCallback != null)
            {
    	        BluetoothLeScannerCompat.getScanner().stopScan(_scanCallback);
            }

            // Start scanning
            _scanCallback = createCallback(callback);
            BluetoothLeScannerCompat.getScanner().startScan(filters, settings, _scanCallback);
        }
    }

    /**
     * @brief Stops an on-going BLE scan.
     */
	public static void stopScan()
    {
        Log.v(TAG, "==> stopScan");

        synchronized (_scanSync)
        {
            if (_scanCallback != null)
            {
    	        BluetoothLeScannerCompat.getScanner().stopScan(_scanCallback);
                _scanCallback = null;
            }
        }
    }

    /**
     * @brief Gets the BluetoothDevice object for the given Bluetooth address.
     *
     * @param context The application context.
     * @param bluetoothAddress The address of a Bluetooth device.
     * @return A BluetoothDevice or null if there is none for the given address.
     */
    public static BluetoothDevice getDeviceFromAddress(final @NonNull Context context, final long bluetoothAddress)
    {
        // Get the Bluetooth Manager and default adapter
        BluetoothManager bluetoothManager
            = (BluetoothManager)context.getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager == null)
        {
            return null;
        }
        BluetoothAdapter adapter = bluetoothManager.getAdapter();
        if (adapter == null)
        {
            return null;
        }

        // Convert the Bluetooth address to a string
        StringBuilder sb = new StringBuilder();
        for (int shift = 40; shift >= 0; shift -= 8)
        {
            if (sb.length() > 0) sb.append(":");
            sb.append(String.format("%02X", (bluetoothAddress >> shift) & 0xFF));
        }

        // Returns the Bluetooth device
        return adapter.getRemoteDevice(sb.toString());
    }

    /**
     * @brief Gets a ScanCallback instance that notify scan results to user code.
     */
    @NonNull
    private static ScanCallback createCallback(final ScannerCallback callback)
    {
        return new ScanCallback()
        {
            @Override
            public void onScanResult(final int callbackType, final ScanResult result)
            {
                NotifyScanResult(result);
            }

            @Override
            public void onBatchScanResults(final List<ScanResult> results)
            {
                for (ScanResult scan : results)
                {
                    NotifyScanResult(scan);
                }
            }

            @Override
        	public void onScanFailed(final int errorCode)
            {
                Log.e(TAG, "Scan failed with error " + errorCode);
                callback.onScanFailed(errorCode);
            }

            private void NotifyScanResult(@NonNull final ScanResult scanResult)
            {
                BluetoothDevice device = scanResult.getDevice();
                // We should get only BLE devices
                if ((device != null)
                        && ((device.getType() == BluetoothDevice.DEVICE_TYPE_LE)
                        || (device.getType() == BluetoothDevice.DEVICE_TYPE_DUAL)))
                {
                    callback.onScanResult(scanResult);
                }
            }
        };
    }
}

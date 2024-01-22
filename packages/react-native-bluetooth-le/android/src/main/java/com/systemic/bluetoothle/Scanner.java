package com.systemic.bluetoothle;

import java.util.ArrayList;
import java.util.List;

import android.os.ParcelUuid;
import android.util.Log;
import android.bluetooth.BluetoothDevice;

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
         * @param error A string with the error that caused the scan to fail.
         */
        public void onScanFailed(String error);
    }

    private static String TAG = "SystemicGames";
    private static ScanCallback _scanCallback;
    private static Object _scanSync = new Object();

    /**
     * @brief Starts scanning for BLE peripherals advertising the given list of services.
     *
     * If a scan is already running, it is stopped before starting the new one.
     *
     * @param requiredServicesUuids Comma separated list of services UUIDs that the peripheral
     *                              should advertise, may be null or empty.
     * @param callback The callback for notifying of the scan results (called for each advertisement packet).
     */
    public static void startScan(final String requiredServicesUuids, final ScannerCallback callback)
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
        if (requiredServicesUuids != null)
        {
            filters = new ArrayList<>();
            for (String uuidStr : requiredServicesUuids.split(","))
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
                    throw new IllegalArgumentException("requiredServicesUuids must be either null, an empty string or a comma separated list of UUIDs");
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
                callback.onScanFailed(errorToString(errorCode));
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

    @NonNull
    private static String errorToString(final int errorCode)
    {
        switch (errorCode)
        {
            case ScanCallback.SCAN_FAILED_ALREADY_STARTED:
                return "Already started";
            case ScanCallback.SCAN_FAILED_APPLICATION_REGISTRATION_FAILED:
                return "Application registration failed";
            case ScanCallback.SCAN_FAILED_INTERNAL_ERROR:
                return "Internal error";
            case ScanCallback.SCAN_FAILED_FEATURE_UNSUPPORTED:
                return "Feature unsupported";
            case ScanCallback.SCAN_FAILED_OUT_OF_HARDWARE_RESOURCES:
                return "Out of hardware resources";
        }
        return "Unknown error";
    }
}

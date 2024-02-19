package com.systemic.bluetoothle;

import java.util.Objects;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;
import androidx.annotation.NonNull;

/**
 * @brief Static class that notifies off Bluetooth adapter state changes.
 */
public final class BluetoothState
{
    private static final String TAG = "SystemicGames";

    private static StateCallback _callback = null;
    private static Context _context = null;

    private static final BroadcastReceiver _receiver = new BroadcastReceiver()
    {
        @Override
        public void onReceive(Context context, Intent intent)
        {
            final String action = intent.getAction();
            if ((_callback != null) && action.equals(BluetoothAdapter.ACTION_STATE_CHANGED))
            {
                final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                if (state != 0)
                {
                    switch (state)
                    {
                    case BluetoothAdapter.STATE_OFF:
                        Log.v(TAG, "Bluetooth off");
                        break;
                    case BluetoothAdapter.STATE_TURNING_OFF:
                        Log.v(TAG, "Turning Bluetooth off...");
                        break;
                    case BluetoothAdapter.STATE_ON:
                        Log.v(TAG, "Bluetooth on");
                        break;
                    case BluetoothAdapter.STATE_TURNING_ON:
                        Log.v(TAG, "Turning Bluetooth on...");
                        break;
                    }
                    _callback.onStateChanged(state);
                }
            }
        }
    };

    /**
     * @brief Interface for MTU change request callbacks.
     */
	public interface StateCallback
    {
        public void onStateChanged(int state);
    }

    /**
     * @brief Starts monitoring for Bluetooth adapter state changes.
     *
     * @param context The application context.
     * @param callback The callback for notifying of state changes.
     */
    public static void startMonitoring(@NonNull final Context context, @NonNull final StateCallback callback)
    {
        // Check arguments
        Objects.requireNonNull(context);
        Objects.requireNonNull(callback);

        // Stop monitoring if already started
        stopMonitoring();

        // Store new parameters
        _context = context;
        _callback = callback;
        
        // Register for broadcasts on BluetoothAdapter state change
        IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
        context.registerReceiver(_receiver, filter);
    }

    /**
     * @brief Stops monitoring for Bluetooth adapter state changes.
     */
    public static void stopMonitoring()
    {
        _callback = null;
        if (_context != null)
        {
            _context.unregisterReceiver(_receiver);
            _context = null;
        }
    }

    /**
     * @brief Gets the Bluetooth adapter state.
     *
     * @param context The application context.
     */
    public static int getState(@NonNull final Context context)
    {
        Objects.requireNonNull(context);

        BluetoothManager bluetoothManager = (BluetoothManager)(_context.getSystemService(Context.BLUETOOTH_SERVICE));
        if (bluetoothManager != null)
        {
            BluetoothAdapter adapter = bluetoothManager.getAdapter();
            if (adapter != null)
            {
                return adapter.getState();
            }
        }
        return BluetoothAdapter.ERROR;
    }
}
package com.systemic.reactnativenordicnrf5dfu;

import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;

import java.io.IOException;
import java.util.zip.ZipFile;

import no.nordicsemi.android.dfu.*;

@ReactModule(name = NordicNrf5DfuModule.NAME)
public class NordicNrf5DfuModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    public static final String NAME = "NordicNrf5Dfu";
    private static final String TAG = "SystemicGames";
    private final static String INTERNAL_ERROR = "INTERNAL_ERROR";
    private final static String INVALID_CALL = "INVALID_CALL";
    private final static String INVALID_ARGUMENT = "INVALID_ARGUMENT";
    private final ReactApplicationContext _reactContext;
    private Promise _startDfuPromise = null;
    private DfuServiceController _dfuController = null;

    public NordicNrf5DfuModule(final ReactApplicationContext reactContext) {
        super(reactContext);
        _reactContext = reactContext;
        _reactContext.addLifecycleEventListener(this);
        DfuServiceListenerHelper.registerLogListener(_reactContext, (deviceAddress, level, message)
                -> Log.d(TAG, "Dfu event for " + deviceAddress + " -> " + message));
        // Need at least SDK 26 for notifications
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            DfuServiceInitiator.createDfuNotificationChannel(_reactContext);
        }
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void addListener(final String eventName) {
        // Required by React Native event emitter
        // Set up any upstream listeners or background tasks as necessary
    }

    @ReactMethod
    public void removeListeners(final Integer count) {
        // Required by React Native event emitter
        // Remove upstream listeners, stop unnecessary background tasks
    }

    // 48 bits Bluetooth MAC address fits into the 52 bits mantissa of a double
    @ReactMethod
    public void startDfu(
            final double address,
            final String deviceName,
            final String filePath,
            final int numberOfRetries,
            final int prepareDataObjectDelay,
            final int rebootTime,
            final int bootloaderScanTimeout,
            final boolean forceScanningForNewAddress,
            final boolean keepBond,
            final Promise promise) {
        if (address == 0) {
            promise.reject(INVALID_ARGUMENT, "address must be different than zero");
            return;
        }
        if (numberOfRetries < 0) {
            promise.reject(INVALID_ARGUMENT, "numberOfRetries must be 0 or greater");
            return;
        }
        if (prepareDataObjectDelay < 0) {
            promise.reject(INVALID_ARGUMENT, "prepareDataObjectDelay must be 0 or greater");
            return;
        }
        if (rebootTime < 0) {
            promise.reject(INVALID_ARGUMENT, "rebootTime must be 0 or greater");
            return;
        }
        if (bootloaderScanTimeout < 0) {
            promise.reject(INVALID_ARGUMENT, "bootloaderScanTimeout must be 0 or greater");
            return;
        }
        if (_dfuController != null) {
            promise.reject(INVALID_CALL, "DFU already in progress");
            return;
        }
        try {
            long macAddress = (long)address;
            StringBuilder str = new StringBuilder();
            for (int i = 5; i >= 0; --i) {
                str.append(String.format("%02X", (macAddress >> 8 * i) & 0xFF));
                if (i > 0) {
                    str.append(":");
                }
            }

            String macAddressStr = str.toString();
            Log.v(TAG, "Starting DFU for " + macAddressStr + ", retries=" + numberOfRetries);

            DfuServiceInitiator serviceInitiator = new DfuServiceInitiator(macAddressStr);
            if (deviceName != null && deviceName.length() > 0) {
                serviceInitiator.setDeviceName(deviceName);
            }
            serviceInitiator.setNumberOfRetries(numberOfRetries > 0 ? numberOfRetries : 2);
            serviceInitiator.setPacketsReceiptNotificationsValue(1); // TODO make param
            serviceInitiator.setUnsafeExperimentalButtonlessServiceInSecureDfuEnabled(true); // TODO make param
            serviceInitiator.setZip(filePath);
            // 400 is the recommended value for the delay, see comments in DfuServiceInitiator.java of the DFU library
            serviceInitiator.setPrepareDataObjectDelay(prepareDataObjectDelay > 0 ? prepareDataObjectDelay : 400);
            serviceInitiator.setRebootTime(rebootTime);  //  Default is 0
            if (bootloaderScanTimeout > 0) {
                serviceInitiator.setScanTimeout(bootloaderScanTimeout);  //  Default is 5000
            }
            serviceInitiator.setForceScanningForNewAddressInLegacyDfu(forceScanningForNewAddress);
            serviceInitiator.setKeepBond(keepBond);

            _dfuController = serviceInitiator.start(_reactContext, DfuService.class);
            _startDfuPromise = promise;
        }
        catch (Exception ex) {
            promise.reject(INTERNAL_ERROR, ex.getMessage());
        }
    }

    @ReactMethod
    public void abortDfu() {
        if (_dfuController != null) {
            _dfuController.abort();
        }
    }

    private void sendEvent(final String eventName, @Nullable final WritableMap params) {
        getReactApplicationContext()
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }

    private void sendStateUpdate(final String state, final String deviceAddress) {
        WritableMap map = new WritableNativeMap();
        map.putDouble("deviceAddress", Long.parseLong(deviceAddress.replaceAll(":", ""),16));
        map.putString("state", state);
        sendEvent("state", map);
    }

    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume");
        DfuServiceListenerHelper.registerProgressListener(_reactContext, _dfuProgressListener);
    }

    @Override
    public void onHostPause() {
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy");
        DfuServiceListenerHelper.unregisterProgressListener(_reactContext, _dfuProgressListener);
    }

    /**
     * The progress listener receives events from the DFU Service.
     * If is registered in onCreate() and unregistered in onDestroy() so methods here may also be called
     * when the screen is locked or the app went to the background. This is because the UI needs to have the
     * correct information after user comes back to the activity and this information can't be read from the service
     * as it might have been killed already (DFU completed or finished with error).
     * Note: those events are raised on the main thread.
     */
    private final DfuProgressListener _dfuProgressListener = new DfuProgressListenerAdapter() {
        @Override
        public void onDeviceConnecting(@NonNull final String deviceAddress) {
            sendStateUpdate("deviceConnecting", deviceAddress);
        }

        @Override
        public void onDfuProcessStarting(@NonNull final String deviceAddress) {
            sendStateUpdate("dfuStarting", deviceAddress);
        }

        @Override
        public void onEnablingDfuMode(@NonNull final String deviceAddress) {
            sendStateUpdate("enablingDfuMode", deviceAddress);
        }

        @Override
        public void onFirmwareValidating(@NonNull final String deviceAddress) {
            sendStateUpdate("firmwareValidating", deviceAddress);
        }

        @Override
        public void onDeviceDisconnecting(@NonNull final String deviceAddress) {
            sendStateUpdate("deviceDisconnecting", deviceAddress);
        }

        @Override
        public void onDfuCompleted(@NonNull final String deviceAddress) {
            Promise promise = getPromiseAndSetDone();
            sendStateUpdate("dfuCompleted", deviceAddress);
            if (promise != null) {
                promise.resolve(null);
            }
        }

        @Override
        public void onDfuAborted(@NonNull final String deviceAddress) {
            Promise promise = getPromiseAndSetDone();
            sendStateUpdate("dfuAborted", deviceAddress);
            if (promise != null) {
                promise.reject("2", "DFU ABORTED");
            }
        }

        @Override
        public void onError(@NonNull final String deviceAddress, final int error, final int errorType, final String message) {
            Promise promise = getPromiseAndSetDone();
            if (promise != null) {
                promise.reject(Integer.toString(error), message);
            }
        }

        @Override
        public void onProgressChanged(@NonNull final String deviceAddress, final int percent, final float speed, final float avgSpeed, final int currentPart, final int partsTotal) {
            WritableMap map = new WritableNativeMap();
            map.putDouble("deviceAddress", Long.parseLong(deviceAddress.replaceAll(":", ""),16));
            map.putInt("percent", percent);
            map.putDouble("speed", speed);
            map.putDouble("averageSpeed", avgSpeed);
            map.putInt("currentPart", currentPart);
            map.putInt("partsTotal", partsTotal);
            sendEvent("progress", map);
        }

        private Promise getPromiseAndSetDone() {
            Promise promise = _startDfuPromise;
            _dfuController = null;
            _startDfuPromise = null;
            try {
                new Handler().postDelayed(() -> {
                    // if this activity is still open and upload process was completed, cancel the notification
                    final NotificationManager manager = (NotificationManager) _reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
                    manager.cancel(DfuService.NOTIFICATION_ID);
                }, 200);
            }
            catch (Exception e) {
                Log.e(TAG, "Error cancelling DFU notification: " + e.toString());
            }
            return promise;
        }
    };
}

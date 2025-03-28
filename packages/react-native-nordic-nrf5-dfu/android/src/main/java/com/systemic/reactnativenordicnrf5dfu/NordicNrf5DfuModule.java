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
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.IOException;
import java.util.zip.ZipFile;

import no.nordicsemi.android.dfu.*;

@ReactModule(name = NordicNrf5DfuModule.NAME)
public class NordicNrf5DfuModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    public static final String NAME = "NordicNrf5Dfu";
    private static final String TAG = "SystemicGames";

    // Error codes
    private final static String E_INTERNAL = "E_INTERNAL";
    private final static String E_INVALID_ARGUMENT = "E_INVALID_ARGUMENT";
    private final static String E_DFU_BUSY = "E_DFU_BUSY";
    private final static String E_DFU_ERROR = "E_DFU_ERROR";
    private final static String E_CONNECTION = "E_CONNECTION";
    private final static String E_COMMUNICATION = "E_COMMUNICATION";
    private final static String E_DFU_REMOTE = "E_DFU_REMOTE";

    private final ReactApplicationContext _reactContext;
    private Promise _startDfuPromise = null;
    private DfuServiceController _dfuController = null;
    private int _listenerCount = 0;

    public NordicNrf5DfuModule(final ReactApplicationContext reactContext) {
        super(reactContext);
        _reactContext = reactContext;
        _reactContext.addLifecycleEventListener(this);
        DfuServiceListenerHelper.registerLogListener(_reactContext, (deviceAddress, level, message)
            -> Log.d(TAG, message + ", device address: " + deviceAddress));
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
        ++_listenerCount;
    }

    @ReactMethod
    public void removeListeners(final Integer count) {
        --_listenerCount;
    }

    // File may be zipped DFU package, hex or bin
    // 48 bits Bluetooth MAC address fits into the 52 bits mantissa of a double
    @ReactMethod
    public void startDfu(
            final double address,
            final String deviceName,
            final String filePath,
            final int numberOfRetries,
            final boolean disableButtonlessServiceInSecureDfu,
            final boolean forceDfu,
            final boolean forceScanningForNewAddressInLegacyDfu,
            final int prepareDataObjectDelay,
            final int rebootTime,
            final int bootloaderScanTimeout,
            final boolean disallowForegroundService,
            final boolean keepBond,
            final boolean restoreBond,
            final int requestedMtu,
            final Promise promise) {
        if (address == 0) {
            promise.reject(E_INVALID_ARGUMENT, "address must be different than zero");
            return;
        }
        if (numberOfRetries < 0) {
            promise.reject(E_INVALID_ARGUMENT, "numberOfRetries must be 0 or greater");
            return;
        }
        if (prepareDataObjectDelay < 0) {
            promise.reject(E_INVALID_ARGUMENT, "prepareDataObjectDelay must be 0 or greater");
            return;
        }
        if (rebootTime < 0) {
            promise.reject(E_INVALID_ARGUMENT, "rebootTime must be 0 or greater");
            return;
        }
        if (bootloaderScanTimeout < 0) {
            promise.reject(E_INVALID_ARGUMENT, "bootloaderScanTimeout must be 0 or greater");
            return;
        }
        if (_dfuController != null) {
            promise.reject(E_DFU_BUSY, "DFU already in progress");
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
            Log.v(TAG, "DFU: starting for " + macAddressStr + ", retries=" + numberOfRetries);

            DfuServiceInitiator init = new DfuServiceInitiator(macAddressStr);
            if (deviceName != null && deviceName.length() > 0) {
                init.setDeviceName(deviceName);
            }
            if (filePath.endsWith(".bin") || filePath.endsWith(".hex")) {
                init.setBinOrHex(DfuBaseService.TYPE_APPLICATION, filePath).setInitFile(null, null);
            } else {
                init.setZip(filePath);
            }
            init.setUnsafeExperimentalButtonlessServiceInSecureDfuEnabled(!disableButtonlessServiceInSecureDfu);
            init.setForceDfu(forceDfu);
            init.setForceScanningForNewAddressInLegacyDfu(forceScanningForNewAddressInLegacyDfu);
            // Default is 0 but a good value is 400 according to Nordic docs
            init.setPrepareDataObjectDelay(prepareDataObjectDelay == 0 ? 400 : prepareDataObjectDelay);
            init.setNumberOfRetries(numberOfRetries);
            init.setRebootTime(rebootTime); // Default is 0
            if (bootloaderScanTimeout > 0) {
                init.setScanTimeout(bootloaderScanTimeout); // Default is 5000
            }
            init.setForeground(!disallowForegroundService);
            init.setKeepBond(keepBond);
            init.setRestoreBond(restoreBond);
            if (requestedMtu >= 0) {
                init.setMtu(requestedMtu); // Default is 257, 0 will disable MTU request
            }

            _dfuController = init.start(_reactContext, DfuService.class);
            _startDfuPromise = promise;
        }
        catch (Exception ex) {
            promise.reject(E_INTERNAL, ex.getMessage());
        }
    }

    @ReactMethod
    public void abortDfu() {
        if (_dfuController != null) {
            _dfuController.abort();
        }
    }

    @ReactMethod
    public void pauseDfu() {
        if (_dfuController != null) {
            _dfuController.pause();
        }
    }

    @ReactMethod
    public void resumeDfu() {
        if (_dfuController != null) {
            _dfuController.resume();
        }
    }

    private static void putTargetIdentifier(@NonNull final WritableMap map, @NonNull final String deviceAddress)
    {
        map.putDouble("targetId", Long.parseLong(deviceAddress.replace(":", ""), 16));
    }

    private void sendEvent(final String eventName, @Nullable final WritableMap params) {
        if (_listenerCount > 0) {
            getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    private void sendStateUpdate(final String state, final String deviceAddress) {
        Log.d(TAG, "DFU: Sending state " + state + " for " + deviceAddress);
        if (_listenerCount > 0) {
            WritableMap map = new WritableNativeMap();
            putTargetIdentifier(map, deviceAddress);
            map.putString("state", state);
            sendEvent("state", map);
        }
    }

    @Override
    public void onHostResume() {
        Log.d(TAG, "DFU: onHostResume");
        DfuServiceListenerHelper.registerProgressListener(_reactContext, _dfuProgressListener);
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "DFU: onHostPause");
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "DFU: onHostDestroy");
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
            sendStateUpdate("connecting", deviceAddress);
        }

        @Override
        public void onDeviceConnected(@NonNull final String deviceAddress) {
            sendStateUpdate("connected", deviceAddress);
        }

        @Override
        public void onDfuProcessStarting(@NonNull final String deviceAddress) {
            sendStateUpdate("starting", deviceAddress);
        }

        @Override
        public void onEnablingDfuMode(@NonNull final String deviceAddress) {
            sendStateUpdate("enablingDfuMode", deviceAddress);
        }

        @Override
        public void onDfuProcessStarted(@NonNull final String deviceAddress) {
            sendStateUpdate("uploading", deviceAddress);
        }

        @Override
        public void onFirmwareValidating(@NonNull final String deviceAddress) {
            sendStateUpdate("validatingFirmware", deviceAddress);
        }

        @Override
        public void onDeviceDisconnecting(@NonNull final String deviceAddress) {
            sendStateUpdate("disconnecting", deviceAddress);
        }

        @Override
        public void onDeviceDisconnected(@NonNull final String deviceAddress) {
            sendStateUpdate("disconnected", deviceAddress);
        }

        @Override
        public void onDfuCompleted(@NonNull final String deviceAddress) {
            Promise promise = getPromiseAndSetDone();
            sendStateUpdate("completed", deviceAddress);
            if (promise != null) {
                promise.resolve(null);
            }
        }

        @Override
        public void onDfuAborted(@NonNull final String deviceAddress) {
            Promise promise = getPromiseAndSetDone();
            sendStateUpdate("aborted", deviceAddress);
            if (promise != null) {
                promise.resolve(null);
            }
        }

        @Override
        public void onError(@NonNull final String deviceAddress, final int error, final int errorType, final String message) {
            Log.e(TAG, "DFU: Error " + error + ", type=" + errorType + ", message=" + message + " for " + deviceAddress);
            String errorCode = E_DFU_ERROR;
            switch (errorType) {
                case DfuBaseService.ERROR_TYPE_COMMUNICATION_STATE:
                    errorCode = E_CONNECTION;
                    break;
                case DfuBaseService.ERROR_TYPE_COMMUNICATION:
                    errorCode = E_COMMUNICATION;
                    break;
                case DfuBaseService.ERROR_TYPE_DFU_REMOTE:
                    errorCode = E_DFU_REMOTE;
                    break;
                default:
                    break;
            }
            Promise promise = getPromiseAndSetDone();
            if (promise != null) {
                promise.reject(errorCode, message);
            }
        }

        @Override
        public void onProgressChanged(@NonNull final String deviceAddress, final int percent, final float speed, final float avgSpeed, final int currentPart, final int partsTotal) {
            WritableMap map = new WritableNativeMap();
            putTargetIdentifier(map, deviceAddress);
            map.putInt("percent", percent);
            map.putInt("currentPart", currentPart);
            map.putInt("partsTotal", partsTotal);
            map.putDouble("speed", speed);
            map.putDouble("averageSpeed", avgSpeed);
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
                Log.e(TAG, "DFU: Error cancelling notifications: " + e.toString());
            }
            return promise;
        }
    };
}

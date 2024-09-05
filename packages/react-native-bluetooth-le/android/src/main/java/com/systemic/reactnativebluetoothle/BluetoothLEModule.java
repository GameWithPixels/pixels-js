package com.systemic.reactnativebluetoothle;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.systemic.bluetoothle.BluetoothState;
import com.systemic.bluetoothle.Peripheral;
import com.systemic.bluetoothle.Scanner;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import no.nordicsemi.android.ble.annotation.DisconnectionReason;
import no.nordicsemi.android.ble.data.Data;
import no.nordicsemi.android.ble.observer.ConnectionObserver;
import no.nordicsemi.android.support.v18.scanner.ScanResult;
import okhttp3.internal.Util;

public final class BluetoothLEModule extends ReactContextBaseJavaModule {

    private final static String TAG = "SystemicGames";

    private final static String INTERNAL_ERROR = "ERROR_INTERNAL_ERROR";
    private final static String INVALID_ARGUMENT = "ERROR_INVALID_PARAMETER";
    private final static String INVALID_REQUEST = "ERROR_INVALID_REQUEST";
    private final static String UNKNOWN_PERIPHERAL = "ERROR_UNKNOWN_PERIPHERAL";

    final HashMap<Long, BluetoothDevice> _devices = new HashMap<>(16);
    final HashMap<Long, Peripheral> _peripherals = new HashMap<>(16);

    BluetoothLEModule(ReactApplicationContext context) {
        super(context);

        // int status = ContextCompat.checkSelfPermission(
        //         getReactApplicationContext(),
        //         Manifest.permission.ACCESS_FINE_LOCATION);
        // return status == PackageManager.PERMISSION_GRANTED;

        // TODO enable BLE https://www.thedroidsonroids.com/blog/bluetooth-classic-vs-bluetooth-low-energy-ble
        // if (!BluetoothAdapter.getDefaultAdapter().isEnabled) {
        //   val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
        //   startActivityForResult(enableBtIntent, ENABLE_BT_REQUEST_CODE)
        // }
    }

    @NonNull
    @Override
    public String getName() {
        return "BluetoothLe";
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        for (BleEvent ev : BleEvent.values()) {
            constants.put(ev.toString(), ev.getName());
        }
        return constants;
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required by React Native event emitter
        // Set up any upstream listeners or background tasks as necessary
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required by React Native event emitter
        // Remove upstream listeners, stop unnecessary background tasks
    }

    void sendEvent(@NonNull BleEvent event,
                   @Nullable WritableMap params) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(event.getName(), params);
    }

    void sendEvent(@NonNull BleEvent event,
                   @NonNull String propertyName,
                   @NonNull String propertyValue) {
        WritableMap params = Arguments.createMap();
        params.putString(propertyName, propertyValue);
        sendEvent(event, params);
    }

    void sendBluetoothStateEvent(BluetoothStateEvent state) {
        sendEvent(BleEvent.BluetoothState, "state", state.getName());
    }

    boolean checkBluetoothPermission() {
        Context context = getReactApplicationContext();
        return (
            context.checkCallingOrSelfPermission(android.Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED ||
            context.checkCallingOrSelfPermission(android.Manifest.permission.BLUETOOTH_ADMIN) == PackageManager.PERMISSION_GRANTED ||
            context.checkCallingOrSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            context.checkCallingOrSelfPermission(android.Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED ||
            context.checkCallingOrSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        );
    }

    BluetoothStateEvent getBluetoothStateEvent() {
        if (checkBluetoothPermission()) {
            final int state = BluetoothState.getState(getReactApplicationContext());
            return BluetoothStateEvent.fromInt(state);
        } else {
            return BluetoothStateEvent.Unauthorized;
        }
    }

    void sendConnectionEvent(long peripheralId, @NonNull BleConnectionEvent connectionEvent, @DisconnectionReason int reason) {
        Peripheral peripheral = _peripherals.get(peripheralId);
        if (peripheral != null) {
            sendEvent(BleEvent.ConnectionEvent,
                Serializer.toJS(peripheral, connectionEvent, reason));
        }
    }

    long getPeripheralId(String deviceSystemId) {
        if (deviceSystemId == null) {
            return 0;
        }
        try {
            return Long.parseLong(deviceSystemId, 16);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    interface RequestRunner {
        void run(Peripheral peripheral, Peripheral.RequestCallback callback);
    }

    boolean checkStringForRequest(@NonNull String stringName, String string, @NonNull Promise promise) {
        boolean valid = string != null && string.length() > 0;
        if (!valid) {
            promise.reject(INVALID_ARGUMENT, stringName + " must be non null and non empty");
        }
        return valid;
    }

    boolean checkDeviceSystemIdForRequest(String deviceSystemId, @NonNull Promise promise) {
        return checkStringForRequest("deviceSystemId", deviceSystemId, promise);
    }

    @Nullable
    Peripheral getPeripheralForRequest(String deviceSystemId, @NonNull Promise promise, boolean allowUnknown) {
        if (checkDeviceSystemIdForRequest(deviceSystemId, promise)) {
            long peripheralId = getPeripheralId(deviceSystemId);
            Peripheral peripheral = _peripherals.get(peripheralId);
            if (peripheral == null) {
                if (allowUnknown) {
                    promise.resolve(Serializer.systemIdToJS(deviceSystemId));
                } else {
                    promise.reject(UNKNOWN_PERIPHERAL, "No known peripheral with system id " + deviceSystemId);
                }
            }
            return peripheral;
        }
        return null;
    }

    @Nullable
    Peripheral getPeripheralForRequest(String deviceSystemId, @NonNull Promise promise) {
        return getPeripheralForRequest(deviceSystemId, promise, false);
    }

    // TODO use more specific error codes
    void processExceptionForRequest(@NonNull String requestName, Exception ex, @NonNull Promise promise) {
        Log.e(TAG, "Exception in BLE request " + requestName + ": " + ex);
        promise.reject(INTERNAL_ERROR, ex);
    }

    void runRequest(String deviceSystemId,
                    @NonNull String requestName,
                    @NonNull Promise promise,
                    @NonNull RequestRunner runner,
                    boolean allowUnknown) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise, allowUnknown);
            if (peripheral == null) {
                return;
            }

            runner.run(peripheral, new Peripheral.RequestCallback() {
                public void onRequestCompleted(@NonNull BluetoothDevice device) {
                    promise.resolve(Serializer.toJS(device));
                }

                public void onRequestFailed(@NonNull BluetoothDevice device, int status) {
                    promise.reject(
                        Serializer.toErrorCode(status),
                        String.format("Failed to %s", requestName),
                        Serializer.toJS(device));
                }

                public void onInvalidRequest() {
                    promise.reject(INVALID_REQUEST, String.format("Peripheral not in required state to %s", requestName));
                }
            });
        } catch (Exception ex) {
            processExceptionForRequest(requestName, ex, promise);
        }
    }

    void runRequest(String deviceSystemId,
                    @NonNull String requestName,
                    @NonNull Promise promise,
                    @NonNull RequestRunner runner) {
        runRequest(deviceSystemId, requestName, promise, runner, false);
    }

    @ReactMethod
    public void bleInitialize(Promise promise) {
        // TODO request permissions
        BluetoothState.startMonitoring(getReactApplicationContext(), new BluetoothState.StateCallback() {
            public void onStateChanged(int state) {
                if (checkBluetoothPermission()) {
                    sendBluetoothStateEvent(BluetoothStateEvent.fromInt(state));
                } else {
                    sendBluetoothStateEvent(BluetoothStateEvent.Unauthorized);
                }
            }
        });
        sendBluetoothStateEvent(getBluetoothStateEvent());
        promise.resolve(null);
    }

    @ReactMethod
    public void bleShutdown(Promise promise) {
        // TODO disconnect all peripherals + make a call to bleInitialize() wait on this one to complete
        BluetoothState.stopMonitoring();
        promise.resolve(null);
    }

    @ReactMethod
    public void getBluetoothState(Promise promise) {
        promise.resolve(getBluetoothStateEvent().getName());
    }

    @ReactMethod
    public void startScan(String requiredServicesUuids, Promise promise) {
        try {
            Scanner.startScan(requiredServicesUuids,
                new Scanner.ScannerCallback() {
                    public void onScanResult(ScanResult scanResult) {
                        BluetoothDevice device = scanResult.getDevice();
                        _devices.put(Utils.addressToNumber(device.getAddress()), device);
                        sendEvent(BleEvent.ScanResult,
                            Serializer.toJS(device, scanResult));
                    }

                    public void onScanFailed(String error) {
                        sendEvent(BleEvent.ScanResult, "error", error);
                    }
                });
            promise.resolve(null);
        } catch (Exception ex) {
            processExceptionForRequest("startScan", ex, promise);
        }
    }

    @ReactMethod
    public void stopScan(Promise promise) {
        try {
            Scanner.stopScan();
            promise.resolve(null);
        } catch (Exception ex) {
            processExceptionForRequest("stopScan", ex, promise);
        }
    }

    @ReactMethod
    public void createPeripheral(String deviceSystemId, @NonNull Promise promise) {
        try {
            if (!checkDeviceSystemIdForRequest(deviceSystemId, promise)) {
                return;
            }
            long peripheralId = getPeripheralId(deviceSystemId);
            Peripheral peripheral = _peripherals.get(peripheralId);
            if (peripheral == null && peripheralId != 0) {
                BluetoothDevice device = _devices.get(peripheralId);
                if (device == null) {
                    device = Scanner.getDeviceFromAddress(
                        getReactApplicationContext(), peripheralId);
                    if (device != null) {
                        _devices.put(peripheralId, device);
                    }
                }
                if (device != null) {
                    peripheral = new Peripheral(getReactApplicationContext(), device, new ConnectionObserver() {
                        public void onDeviceConnecting(@NonNull BluetoothDevice device) {
                            sendConnectionEvent(peripheralId, BleConnectionEvent.Connecting, 0);
                        }

                        public void onDeviceConnected(@NonNull BluetoothDevice device) {
                            sendConnectionEvent(peripheralId, BleConnectionEvent.Connected, 0);
                        }

                        public void onDeviceFailedToConnect(@NonNull BluetoothDevice device,
                                                            @DisconnectionReason int reason) {
                            sendConnectionEvent(peripheralId, BleConnectionEvent.FailedToConnect, reason);
                        }

                        public void onDeviceReady(@NonNull BluetoothDevice device) {
                            sendConnectionEvent(peripheralId, BleConnectionEvent.Ready, 0);
                        }

                        public void onDeviceDisconnecting(@NonNull BluetoothDevice device) {
                            sendConnectionEvent(peripheralId, BleConnectionEvent.Disconnecting, 0);
                        }

                        public void onDeviceDisconnected(@NonNull BluetoothDevice device,
                                                         @DisconnectionReason int reason) {
                            sendConnectionEvent(peripheralId, BleConnectionEvent.Disconnected, reason);
                        }
                    });
                    _peripherals.put(peripheralId, peripheral);
                }
            }
            if (peripheral != null) {
                promise.resolve(Serializer.toJS(peripheral));
            } else {
                promise.reject(UNKNOWN_PERIPHERAL, Long.toHexString(peripheralId));
            }
        } catch (Exception ex) {
            processExceptionForRequest("createPeripheral", ex, promise);
        }
    }

    @ReactMethod
    public void releasePeripheral(String deviceSystemId) {
        try {
            long peripheralId = getPeripheralId(deviceSystemId);
            Peripheral peripheral = _peripherals.get(peripheralId);
            if (peripheral != null) {
                _peripherals.remove(peripheralId);
                // TODO peripheral.disconnect();
            }
        } catch (Exception ex) {
            Log.e(TAG, "Exception in releasePeripheral(): " + ex);
        }
    }

    @ReactMethod
    public void connectPeripheral(String deviceSystemId,
                                  String requiredServicesUuids,
                                  int timeoutMs,
                                  @NonNull Promise promise) {
        runRequest(deviceSystemId,
            "connect",
            promise,
            (peripheral, callback) -> peripheral.connect(requiredServicesUuids, timeoutMs, callback));
    }

    @ReactMethod
    public void disconnectPeripheral(String deviceSystemId, @NonNull Promise promise) {
        runRequest(deviceSystemId,
            "disconnect",
            promise,
            (peripheral, callback) -> peripheral.disconnect(callback),
            true); // Don't reject if given an invalid id
    }

    @ReactMethod
    public void getPeripheralConnectionStatus(String deviceSystemId, @NonNull Promise promise) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                if (peripheral.isReady()) {
                    promise.resolve("ready");
                }
                else if (peripheral.isConnected()) {
                    promise.resolve("connected");
                } else {
                    promise.resolve("disconnected");
                }
            }
        } catch (Exception ex) {
            processExceptionForRequest("getPeripheralConnectionStatus", ex, promise);
        }
    }

    @ReactMethod
    public void getPeripheralName(String deviceSystemId, @NonNull Promise promise) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                promise.resolve(peripheral.getName());
            }
        } catch (Exception ex) {
            processExceptionForRequest("getPeripheralName", ex, promise);
        }
    }

    @ReactMethod
    public void getPeripheralAddress(String deviceSystemId, @NonNull Promise promise) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                promise.resolve(peripheral.getAddress());
            }
        } catch (Exception ex) {
            processExceptionForRequest("getPeripheralAddress", ex, promise);
        }
    }

    @ReactMethod
    public void getPeripheralMtu(String deviceSystemId, @NonNull Promise promise) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                promise.resolve(peripheral.getMtu());
            }
        } catch (Exception ex) {
            processExceptionForRequest("getPeripheralMtu", ex, promise);
        }
    }

    @ReactMethod
    public void requestPeripheralMtu(String deviceSystemId, int mtu, @NonNull Promise promise) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                final String requestName = "request MTU";
                peripheral.requestMtu(mtu, new Peripheral.MtuRequestCallback() {
                    public void onMtuChanged(@NonNull BluetoothDevice device,
                                             int mtu) {
                        promise.resolve(mtu);
                    }

                    public void onRequestFailed(@NonNull BluetoothDevice device,
                                                int status) {
                        promise.reject(
                            Serializer.toErrorCode(status),
                            String.format("Failed to %s", requestName),
                            Serializer.toJS(device));
                    }

                    public void onInvalidRequest() {
                        promise.reject(INVALID_REQUEST,
                            String.format("Peripheral not in required state to %s", requestName));
                    }
                });
            }
        } catch (Exception ex) {
            processExceptionForRequest("requestPeripheralMtu", ex, promise);
        }
    }

    @ReactMethod
    public void readPeripheralRssi(String deviceSystemId, @NonNull Promise promise) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral == null) {
                final String requestName = "read RSSI";
                peripheral.readRssi(new Peripheral.ReadRssiRequestCallback() {
                    public void onRssiRead(@NonNull BluetoothDevice device,
                                           int rssi) {
                        promise.resolve(rssi);
                    }

                    public void onRequestFailed(@NonNull BluetoothDevice device,
                                                int status) {
                        promise.reject(
                            Serializer.toErrorCode(status),
                            String.format("Failed to %s", requestName),
                            Serializer.toJS(device));
                    }

                    public void onInvalidRequest() {
                        promise.reject(INVALID_REQUEST,
                            String.format("Peripheral not in required state to %s", requestName));
                    }
                });
            }
        } catch (Exception ex) {
            processExceptionForRequest("readPeripheralRssi", ex, promise);
        }
    }

    @ReactMethod
    public void getDiscoveredServices(String deviceSystemId, @NonNull Promise promise) {
        try {
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                promise.resolve(peripheral.getDiscoveredServices());
            }
        } catch (Exception ex) {
            processExceptionForRequest("getDiscoveredServices", ex, promise);
        }
    }

    @ReactMethod
    public void getServiceCharacteristics(String deviceSystemId,
                                          String serviceUuid,
                                          @NonNull Promise promise) {
        try {
            if (!checkStringForRequest("serviceUuid", serviceUuid, promise)) {
                return;
            }
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                promise.resolve(peripheral.getServiceCharacteristics(serviceUuid));
            }
        } catch (Exception ex) {
            processExceptionForRequest("getServiceCharacteristics", ex, promise);
        }
    }

    @ReactMethod
    public void getCharacteristicProperties(String deviceSystemId,
                                            String serviceUuid,
                                            String characteristicUuid,
                                            int instanceIndex,
                                            @NonNull Promise promise) {
        try {
            if (!checkStringForRequest("serviceUuid", serviceUuid, promise) ||
                !checkStringForRequest("characteristicUuid", characteristicUuid, promise)) {
                return;
            }
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                promise.resolve(peripheral.getCharacteristicProperties(serviceUuid, characteristicUuid, instanceIndex));
            }
        } catch (Exception ex) {
            processExceptionForRequest("getCharacteristicProperties", ex, promise);
        }
    }

    @ReactMethod
    public void readCharacteristic(String deviceSystemId,
                                   String serviceUuid,
                                   String characteristicUuid,
                                   int instanceIndex,
                                   @NonNull Promise promise) {
        try {
            if (!checkStringForRequest("serviceUuid", serviceUuid, promise) ||
                !checkStringForRequest("characteristicUuid", characteristicUuid, promise)) {
                return;
            }
            Peripheral peripheral = getPeripheralForRequest(deviceSystemId, promise);
            if (peripheral != null) {
                final String requestName = "read characteristic";
                peripheral.readCharacteristic(
                    serviceUuid,
                    characteristicUuid,
                    instanceIndex,
                    new Peripheral.ReadValueRequestCallback() {
                        public void onDataReceived(@NonNull BluetoothDevice device, @NonNull Data data) {
                            promise.resolve(Serializer.toJS(data));
                        }

                        public void onRequestFailed(@NonNull BluetoothDevice device, int status) {
                            promise.reject(
                                Serializer.toErrorCode(status),
                                String.format("Failed to %s", requestName),
                                Serializer.toJS(device));
                        }

                        public void onInvalidRequest() {
                            promise.reject(INVALID_REQUEST, String.format("Peripheral not in required state to %s", requestName));
                        }
                    });
            }
        } catch (Exception ex) {
            processExceptionForRequest("readCharacteristic", ex, promise);
        }
    }

    @ReactMethod
    public void writeCharacteristic(String deviceSystemId,
                                    String serviceUuid,
                                    String characteristicUuid,
                                    int instanceIndex,
                                    ReadableArray data,
                                    boolean withoutResponse,
                                    @NonNull Promise promise) {
        if (!checkStringForRequest("serviceUuid", serviceUuid, promise) ||
            !checkStringForRequest("characteristicUuid", characteristicUuid, promise)) {
            return;
        }
        runRequest(deviceSystemId,
            "write characteristic",
            promise,
            (peripheral, callback) -> {
                peripheral.writeCharacteristic(
                    serviceUuid,
                    characteristicUuid,
                    instanceIndex,
                    Serializer.fromJS(data),
                    withoutResponse,
                    callback);
            });
    }

    @ReactMethod
    public void subscribeCharacteristic(String deviceSystemId,
                                        String serviceUuid,
                                        String characteristicUuid,
                                        int instanceIndex,
                                        @NonNull Promise promise) {
        if (!checkStringForRequest("serviceUuid", serviceUuid, promise) ||
            !checkStringForRequest("characteristicUuid", characteristicUuid, promise)) {
            return;
        }
        runRequest(deviceSystemId,
            "subscribe characteristic",
            promise,
            (peripheral, callback) -> peripheral.subscribeCharacteristic(
                serviceUuid,
                characteristicUuid,
                instanceIndex,
                (device, data) -> {
                    // Make sure peripheral is still valid
                    Peripheral p = _peripherals.get(Utils.addressToNumber(peripheral.getAddress()));
                    if (p != null) {
                        UUID serv = UUID.fromString(serviceUuid); // TODO we should get this info from the callback
                        UUID charac = UUID.fromString(characteristicUuid);
                        sendEvent(BleEvent.CharacteristicValueChanged,
                            Serializer.toJS(p, serv, charac, instanceIndex, data));
                    }
                },
                callback));
    }

    @ReactMethod
    public void unsubscribeCharacteristic(String deviceSystemId,
                                          String serviceUuid,
                                          String characteristicUuid,
                                          int instanceIndex,
                                          @NonNull Promise promise) {
        if (!checkStringForRequest("serviceUuid", serviceUuid, promise) ||
            !checkStringForRequest("characteristicUuid", characteristicUuid, promise)) {
            return;
        }
        runRequest(deviceSystemId,
            "unsubscribe characteristic",
            promise,
            (peripheral, callback) -> {
                peripheral.unsubscribeCharacteristic(
                    serviceUuid,
                    characteristicUuid,
                    instanceIndex,
                    callback);
            });
    }
}

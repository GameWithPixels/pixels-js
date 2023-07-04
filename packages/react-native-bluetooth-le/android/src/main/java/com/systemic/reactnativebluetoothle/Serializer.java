package com.systemic.reactnativebluetoothle;

import android.bluetooth.BluetoothDevice;
import android.os.ParcelUuid;
import android.util.SparseArray;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.systemic.bluetoothle.Peripheral;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import no.nordicsemi.android.ble.annotation.DisconnectionReason;
import no.nordicsemi.android.ble.data.Data;
import no.nordicsemi.android.ble.observer.ConnectionObserver;
import no.nordicsemi.android.support.v18.scanner.ScanRecord;
import no.nordicsemi.android.support.v18.scanner.ScanResult;

public final class Serializer {
    @NonNull
    public static String toErrorCode(int status) {
        return "BLE_ERROR_" + status; // TODO return better error code
    }

    @NonNull
    public static WritableMap systemIdToJS(String deviceSystemId) {
        WritableMap map = Arguments.createMap();
        if (deviceSystemId != null) {
            map.putString("systemId", deviceSystemId);
        }
        return map;
    }

    @NonNull
    public static WritableMap toJS(@Nullable BluetoothDevice device) {
        WritableMap map = Arguments.createMap();
        if (device != null) {
            map.putString("systemId", String.valueOf(Utils.getDeviceSystemId(device)));
            // 48 bits Bluetooth MAC address fits into the 52 bits mantissa of a double
            map.putDouble("address", addressToNumber(device.getAddress()));
            String name = device.getName();
            map.putString("name", name != null ? name : "");
        }
        return map;
    }

    @NonNull
    public static WritableMap toJS(@Nullable Peripheral peripheral) {
        WritableMap map = Arguments.createMap();
        if (peripheral != null) {
            map.putString("systemId", String.valueOf(peripheral.getSystemId()));
            map.putDouble("address", addressToNumber(peripheral.getAddress()));
            String name = peripheral.getName();
            map.putString("name", name != null ? name : "");
        }
        return map;
    }

    @NonNull
    public static WritableMap toJS(@Nullable ScanResult scanResult) {
        WritableMap map = Arguments.createMap();
        map.putBoolean("isConnectable", scanResult.isConnectable());
        map.putInt("rssi", scanResult.getRssi());
        map.putInt("txPowerLevel", scanResult.getTxPower());

        ScanRecord scanRecord = scanResult.getScanRecord();
        if (scanRecord != null) {
            // Services
            map.putArray("services", fromList(scanRecord.getServiceUuids()));

            // Added in API level 29
            // Solicited services
            // List<ParcelUuid> solicitedServiceUUIDs = scanRecord.getServiceSolicitationUuids();
            // if ((solicitedServiceUUIDs != null) && (solicitedServiceUUIDs.size() > 0)) {
            //     map.putArray("solicitedServices", fromList(solicitedServiceUUIDs));
            // }

            // Manufacturer data
            SparseArray<byte[]> manufacturerData = scanRecord.getManufacturerSpecificData();
            if ((manufacturerData != null) && (manufacturerData.size() > 0)) {
                WritableArray arrAllManuf = Arguments.createArray();
                for (int i = 0; i < manufacturerData.size(); ++i) {
                    WritableMap mapManuf = Arguments.createMap();
                    mapManuf.putInt("companyId", manufacturerData.keyAt(i));
                    mapManuf.putArray("data", fromArray(manufacturerData.valueAt(i)));
                    arrAllManuf.pushMap(mapManuf);
                }
                map.putArray("manufacturersData", arrAllManuf);
            }

            // Service data
            Map<ParcelUuid, byte[]> serviceData = scanRecord.getServiceData();
            if ((serviceData != null) && (serviceData.size() > 0)) {
                WritableArray arrAllServ = Arguments.createArray();
                for (Map.Entry<ParcelUuid, byte[]> entry : serviceData.entrySet()) {
                    WritableMap mapServ = Arguments.createMap();
                    mapServ.putString("service", entry.getKey().toString());
                    mapServ.putArray("data", fromArray(entry.getValue()));
                    arrAllServ.pushMap(mapServ);
                }
                map.putArray("servicesData", arrAllServ);
            }
        }
        return map;
    }

    @NonNull
    public static WritableMap toJS(@Nullable Peripheral peripheral,
                                   @NonNull BleConnectionEvent connEv,
                                   @DisconnectionReason int reason) {
        WritableMap map = Arguments.createMap();
        map.putMap("device", toJS(peripheral));
        map.putString("connectionStatus", connEv.getName());
        map.putString("reason", toJS(reason));
        return map;
    }

    @NonNull
    public static String toJS(@DisconnectionReason int reason) {
        // TODO which reason do we get when Bluetooth is turned off?
        switch (reason) {
            case ConnectionObserver.REASON_SUCCESS:
                return "success";
            case ConnectionObserver.REASON_TERMINATE_LOCAL_HOST:
                return "host";
            case ConnectionObserver.REASON_TERMINATE_PEER_USER:
                return "peripheral";
            case ConnectionObserver.REASON_LINK_LOSS:
                return "linkLoss";
            case ConnectionObserver.REASON_NOT_SUPPORTED:
                return "notSupported";
            case ConnectionObserver.REASON_CANCELLED:
                return "canceled";
            case ConnectionObserver.REASON_TIMEOUT:
                return "timeout";
            default:
                return "unknown";
        }
    }

    @NonNull
    public static WritableMap toJS(@Nullable BluetoothDevice device,
                                   @Nullable ScanResult scanResult) {
        WritableMap map = Arguments.createMap();
        if (device != null) {
            map.putMap("device", toJS(device));
        }
        if (scanResult != null) {
            map.putMap("advertisementData", toJS(scanResult));
        }
        return map;
    }

    @NonNull
    public static WritableMap toJS(@Nullable Peripheral peripheral,
                                   @Nullable String propName,
                                   int propValue) {
        WritableMap map = Arguments.createMap();
        if (peripheral != null) {
            map.putMap("device", toJS(peripheral));
        }
        if (propName != null && propName.length() > 0) {
            map.putInt(propName, propValue);
        }
        return map;
    }

    @NonNull
    public static WritableArray toJS(@Nullable Data data) {
        WritableArray arr = Arguments.createArray();
        if (data != null) {
            for (int i = 0; i < data.size(); ++i) {
                arr.pushInt(data.getByte(i));
            }
        }
        return arr;
    }

    @NonNull
    public static WritableMap toJS(@Nullable UUID service,
                                   @Nullable UUID characteristic,
                                   int instanceIndex) {
        WritableMap map = Arguments.createMap();
        map.putString("serviceUuid", service == null ? "" : service.toString());
        map.putString("uuid", characteristic == null ? "" : characteristic.toString());
        map.putString("instanceIndex", String.valueOf(instanceIndex));
        return map;
    }

    @NonNull
    public static WritableMap toJS(@Nullable Peripheral peripheral,
                                   @Nullable UUID service,
                                   @Nullable UUID characteristic,
                                   int instanceIndex,
                                   @Nullable Data data) {
        WritableMap map = Arguments.createMap();
        if (peripheral != null) {
            map.putMap("device", Serializer.toJS(peripheral));
        }
        map.putMap("characteristic", Serializer.toJS(service, characteristic, instanceIndex));
        if (data != null) {
            map.putArray("data", Serializer.toJS(data));
        }
        return map;
    }

    @Nullable
    public static byte[] fromJS(@Nullable ReadableArray data) {
        byte[] arr = new byte[data.size()];
        if (data != null) {
            for (int i = 0; i < data.size(); ++i) {
                arr[i] = (byte) data.getInt(i);
            }
        }
        return arr;
    }

    @NonNull
    private static WritableArray fromList(List<ParcelUuid> uuids) {
        WritableArray arr = Arguments.createArray();
        if ((uuids != null) && (uuids.size() > 0)) {
            for (ParcelUuid uuid : uuids) {
                arr.pushString(uuid.toString());
            }
        }
        return arr;
    }

    @NonNull
    private static WritableArray fromArray(byte[] data) {
        WritableArray arr = Arguments.createArray();
        if ((data != null) && (data.length > 0)) {
            for (byte b : data) {
                arr.pushInt(b);
            }
        }
        return arr;
    }

    @NonNull
    private static long addressToNumber(String address) {
        try {
            return Long.parseLong(address.replace(":", ""), 16);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}

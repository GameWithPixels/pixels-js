/**
 * @package com.systemic.bluetoothle
 * @brief An Android Java package that provides a simplified access to Bluetooth
 *        Low Energy peripherals.
 *
 * @note Some knowledge with Bluetooth Low Energy semantics is recommended for
 *       reading this documentation.
 *
 * The Scanner class is used for discovering available Bluetooth peripherals.
 * The latter are identified by an Android
 * <a href="https://developer.android.com/reference/android/bluetooth/BluetoothDevice">
 * BluetoothDevice</a> object.
 * The <a href="https://github.com/NordicSemiconductor/Android-Scanner-Compat-Library">
 * BluetoothLeScannerCompat</a> class from Nordic is used to perform the scanning.
 *
 * The Peripheral class allows for connecting to Bluetooth Low Energy peripherals
 * and perform operations with them. Most of those operations are asynchronous
 * and queued using Nordic's BleManager class from their Android-BLE-Library
 * <a href="https://github.com/NordicSemiconductor/Android-BLE-Library">package</a>.
 *
 * @image html native-android.svg "Classes diagram"
 *
 * @ingroup Android_Java
 */
package com.systemic.bluetoothle;

//! \defgroup Android_Java
//! @brief An Android Java package that provides a simplified access to Bluetooth
//!        Low Energy peripherals.
//!
//! @see com.systemic.bluetoothle namespace.

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Objects;
import android.os.ParcelUuid;
import android.util.Log;
import android.bluetooth.*;
import android.content.Context;
import android.os.Handler;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import no.nordicsemi.android.ble.*;
import no.nordicsemi.android.ble.callback.*;
import no.nordicsemi.android.ble.data.Data;
import no.nordicsemi.android.ble.observer.ConnectionObserver;
import no.nordicsemi.android.ble.annotation.WriteType;

/**
 * @brief Represents a Bluetooth Low Energy (BLE) peripheral.
 *
 * @note This class was designed to work in a Unity plugin and its marshaling
 *       mechanism, and as such its methods uses strings for the services and
 *       characteristics UUIDs rather than ParcelUuid objects.
 *
 * The most common BLE operations are supported, such as reading the peripheral name,
 * MTU, RSSI, listing services and characteristics.
 * It has support for getting characteristics properties and when applicable
 * reading and writing their value, as well as subscribing for value changes.
 *
 * Several of those operations are asynchronous and take a RequestCallback object as
 * a parameter. The appropriate method is called on this object when the request has
 * completed (successfully or not).
 *
 * Once created, a peripheral must be connected before most its methods may be used.
 * and it must be ready before accessing the services.
 * The peripheral becomes ready once all the required services have been discovered.
 *
 * A specific Service may be retrieved with getDiscoveredService().
 * A service contains characteristics for which data may be read or written.
 *
 * It relies on Nordic's Android-BLE-Library library for most of the work.
 * @see https://github.com/NordicSemiconductor/Android-BLE-Library
 */
public final class Peripheral
{
    private static final String TAG = "SystemicGames";

    /**
     * @brief Interface for most BLE request callbacks.
     */
	public interface RequestCallback extends SuccessCallback, FailCallback, InvalidRequestCallback {}

    /**
     * @brief Interface for MTU change request callbacks.
     */
	public interface MtuRequestCallback extends MtuCallback, FailCallback, InvalidRequestCallback {}

    /**
     * @brief Interface for RSSI read request callbacks.
     */
	public interface ReadRssiRequestCallback extends RssiCallback, FailCallback, InvalidRequestCallback {}

    /**
     * @brief Interface for characteristic's value read request callbacks.
     */
	public interface ReadValueRequestCallback extends DataReceivedCallback, FailCallback, InvalidRequestCallback {}

    //public enum ConnectionStatus
    //{
    //    Disconnected(0), Connected(1);
    //    private final int value;
    //    private ConnectionStatus(int value) { this.value = value; }
    //    public int getValue() { return value; }
    //};

    /**
     * @brief Implements Nordic's BleManager class.
     */
    private final class ClientManager extends BleManager
    {
        /**
         * @brief Implements Nordic's BleManagerGattCallback class.
         */
        private final class GattCallback extends BleManagerGattCallback
        {
            private BluetoothGatt _gatt;

            public GattCallback()
            {
            }

            public BluetoothGattService getService(final UUID serviceUuid)
            {
                return _gatt == null ? null : _gatt.getService(serviceUuid);
            }

            public List<BluetoothGattService> getServices()
            {
                return _gatt == null ? null : _gatt.getServices();
            }

            @Override
            protected boolean isRequiredServiceSupported(final BluetoothGatt gatt)
            {
                Log.v(TAG, "==> GattCallback::isRequiredServiceSupported");

                UUID[] servicesUuids = Peripheral.this._requiredServices;
                if (servicesUuids != null)
                {
                    for (UUID uuid : servicesUuids)
                    {
                        boolean found = false;
                        for (BluetoothGattService service : gatt.getServices())
                        {
                            Log.v(TAG, "service " + service.getUuid());
                            if (service.getUuid().equals(uuid))
                            {
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                        {
                            return false;
                        }
                    }
                }

                _gatt = gatt;
                return true;
            }

            @Override
            protected void onServicesInvalidated()
            {
                Log.v(TAG, "==> GattCallback::onServicesInvalidated");

                _gatt = null;
            }
        }

        private GattCallback _callback;

        public ClientManager(@NonNull final Context context, @Nullable final ConnectionObserver connectionObserver)
        {
            // Use main thread looper (dispatcher)
            super(context);
            setConnectionObserver(connectionObserver);
        }

        public BluetoothGattService getService(final UUID serviceUuid)
        {
            return _callback.getService(serviceUuid);
        }

        public List<BluetoothGattService> getServices()
        {
            return _callback.getServices();
        }

        public MtuRequest requestMtu(final int mtu)
        {
            return super.requestMtu(mtu);
        }

	    public final int getMtu()
        {
		    return super.getMtu();
	    }

        public ReadRssiRequest readRssi()
        {
		    return super.readRssi();
        }

        public ReadRequest readCharacteristic(final BluetoothGattCharacteristic characteristic)
        {   
		    return super.readCharacteristic(characteristic);
        }

        public WriteRequest writeCharacteristic(final BluetoothGattCharacteristic characteristic, final byte[] data, int writeType)
        {
		    return super.writeCharacteristic(characteristic, data, writeType);
        }

	    public ValueChangedCallback setNotificationCallback(final BluetoothGattCharacteristic characteristic)
        {
		    return super.setNotificationCallback(characteristic);
        }

	    public void removeNotificationCallback(final BluetoothGattCharacteristic characteristic)
        {
		    super.removeNotificationCallback(characteristic);
        }

	    public WriteRequest disableNotifications(final BluetoothGattCharacteristic characteristic)
        {
		    return super.disableNotifications(characteristic);
        }

        public WriteRequest enableNotifications(final BluetoothGattCharacteristic characteristic)
        {
		    return super.enableNotifications(characteristic);
        }

        public void cancelOperations()
        {
            super.cancelQueue();
        }

        @Override
        public void log(final int priority, final String message)
        {
            Log.println(priority, TAG, message);
        }

        @Override
        protected BleManagerGattCallback getGattCallback()
        {
            return _callback = new GattCallback();
        }
    }

    private BluetoothDevice _device;
    private ClientManager _client;
    private UUID[] _requiredServices;

    /**
     * @brief Gets the BluetoothDevice object for the given Bluetooth address.
     *
     * @param context The application context.
     * @param bluetoothAddress The address of a Bluetooth device.
     * @return A BluetoothDevice or null if there is none for the given address.
     */
    public static BluetoothDevice getDeviceFromAddress(final @NonNull Context context, final long bluetoothAddress)
    {
        // Get the Bluetooth Manager
        BluetoothManager bluetoothManager
            = (BluetoothManager)context.getSystemService(Context.BLUETOOTH_SERVICE);

        // Convert the Bluetooth address to a string
        StringBuilder sb = new StringBuilder();
        for (int shift = 40; shift >= 0; shift -= 8)
        {
            if (sb.length() > 0) sb.append(":");
            sb.append(String.format("%02X", (bluetoothAddress >> shift) & 0xFF));
        }

        // Returns the Bluetooth device
        return bluetoothManager.getAdapter().getRemoteDevice(sb.toString());
    }

    /**
     * @brief Initializes a peripheral for the given Android BluetoothDevice object
     *        and with a connection observer.
     *
     * BluetoothDevice may be retrieved either with from a scan using the Scanner class
     * or with their Bluetooth address using the getDeviceFromAddress() static method.
     *
     * @param device The Android Bluetooth device object for the BLE peripheral.
     * @param connectionObserver The callback for notifying of changes of the connection status of the peripheral.
     */
    public Peripheral(@NonNull final Context context, @Nullable final BluetoothDevice device, @NonNull final ConnectionObserver connectionObserver)
    {
        Log.v(TAG, "==> createPeripheral");

        // Check arguments
        Objects.requireNonNull(context);
        Objects.requireNonNull(device);

        // Store device
        _device = device;

        // Create client manager
        _client = new ClientManager(context, connectionObserver);
    }

    //! @}
    //! \name Connection and disconnection
    //! @{

    /**
     * @brief Queues a request to connect to the peripheral.
     *
     * This request timeouts after 30 seconds.
     *
     * @param requiredServicesUuids Comma separated list of services UUIDs that the peripheral
     *                              should support, may be null or empty.
     * @param autoReconnect Whether to automatically reconnect after an unexpected disconnection
     *                      (i.e. not requested by a call to disconnect()).
     * @param requestCallback The callback for notifying of the request result.
     */
    public void connect(final String requiredServicesUuids, final boolean autoReconnect, final RequestCallback requestCallback)
    {
        Log.v(TAG, "==> connect");

        // Convert the comma separated list of UUIDs
        UUID[] requiredServices = null;
        if (requiredServicesUuids != null)
        {
            ArrayList<UUID> services = new ArrayList<UUID>();
            for (String uuidStr : requiredServicesUuids.split(","))
            {
                try
                {
                    if (uuidStr.length() > 0)
                    {
                        services.add(UUID.fromString(uuidStr));
                    }
                }
                catch (IllegalArgumentException e)
                {
                    throw new IllegalArgumentException("requiredServicesUuids must be either null, an empty string or a comma separated list of UUIDs");
                }
            }
            if (services.size() > 0)
            {
                requiredServices = services.toArray(new UUID[0]);
            }
        }

        // Store required services for later retrieval (once we know more about the peripheral)
        _requiredServices = requiredServices;

        // Connect
        _client.connect(_device)
            .useAutoConnect(autoReconnect)
            .timeout(0) // Actually it times out after 30s
            .done(requestCallback).fail(requestCallback).invalid(requestCallback)
            .enqueue();
    }

    /**
     * @brief Immediately disconnects the peripheral.
     *
     * As a consequence any on-going request either fails or is canceled, including connection requests.
     * Any pending request is dropped.
     *
     * @param requestCallback The callback for notifying of the request result.
     */
    public void disconnect(final RequestCallback requestCallback)
    {
        Log.v(TAG, "==> disconnect");

        // Cancel all on-going operations so the disconnect can happen immediately
        _client.cancelOperations();

        // Disconnect (the request is ignored if we are disconnecting)
        if (_client.getConnectionState() != BluetoothProfile.STATE_DISCONNECTING)
        {
            _client.disconnect()
                .done(requestCallback).fail(requestCallback).invalid(requestCallback)
                .enqueue();
        }
        else if (requestCallback != null)
        {
            // TODO this will happen if device was connecting, we should return a success once disconnected!
            // Immediately Notify invalid request
            requestCallback.onInvalidRequest();
        }
    }

    //! @}
    //! \name Getters valid even when not connected
    //! @{

    /**
     * @brief Gets the Bluetooth MAC address of the peripheral.
     *
     * @return A MAC address as a string (with semi-colons).
     */
    public String getAddress()
    {
        return _device.getAddress();
    }

    /**
     * @brief Gets the name of the peripheral.
     *
     * @return The name, or null if the call failed.
     */
    public String getName()
    {
        return _device.getName();
    }

    /**
     * @brief Indicates whether the peripheral is connected.
     *
     * Services may not have been discovered yet.
     *
     * @return Whether the peripheral is connected.
     */
    public boolean isConnected()
    {
        return _client.isConnected();
    }

    /**
     * @brief Indicates whether the peripheral is ready.
     *
     * The peripheral is ready once it has successfully connected and
     * discovered the required services.
     *
     * @return Whether the peripheral is ready.
     */
    public boolean isReady()
    {
        return _client.isReady();
    }

    //! @}
    //! \name Peripheral operations
    //! Valid only for connected peripherals.
    //! @{

    /**
     * @brief Gets the Maximum Transmission Unit (MTU).
     *
     * @return The MTU, or zero if the call failed.
     */
    public int getMtu()
    {
        Log.v(TAG, "==> getMtu");

        return _client.getMtu();
    }

    /**
     * @brief Queues a request for the peripheral to change its MTU to the given value.
     *
     * @param mtu The requested MTU, must be between 23 and 517 included.
     * @param mtuChangedCallback The callback for notifying of the MTU request result.
     */
    public void requestMtu(int mtu, final MtuRequestCallback mtuChangedCallback)
    {
        Log.v(TAG, "==> requestMtu " + mtu);

        _client.requestMtu(mtu)
            .with(mtuChangedCallback).fail(mtuChangedCallback).invalid(mtuChangedCallback)
            .enqueue();
    }

    /**
     * @brief Queues a request to read the Received Signal Strength Indicator (RSSI).
     *
     * @param rssiReadCallback The callback for notifying of the read RSSI and the request status.
     */
    public void readRssi(final ReadRssiRequestCallback rssiReadCallback)
    {
        Log.v(TAG, "==> readRssi");

        _client.readRssi()
            .with(rssiReadCallback).fail(rssiReadCallback).invalid(rssiReadCallback)
            .enqueue();
    }

    //! @}
    //! \name Services operations
    //! Valid only for ready peripherals.
    //! @{

    /**
     * @brief Gets the list of discovered services.
     *
     * @return A comma separated list of services UUIDs, or null if the call failed.
     */
    public String getDiscoveredServices()
    {
        Log.v(TAG, "==> getDiscoveredServices");

        // Get services
        List<BluetoothGattService> services = _client.getServices();
        if (services == null)
        {
            return null;
        }
        else
        {
            // Convert to a comma separated list
            StringBuilder sb = new StringBuilder();
            for (BluetoothGattService serv : services)
            {
                if (sb.length() > 0) sb.append(",");
                sb.append(serv.getUuid());
            }
            return sb.toString();
        }
    }

    /**
     * @brief Gets the list of discovered characteristics for the given service.
     *
     * The same characteristic may be listed several times according to the peripheral's configuration.
     *
     * @param serviceUuid The service UUID for which to retrieve the characteristics.
     * @return A comma separated list of characteristics UUIDs, or null if the call failed.
     */
    public String getServiceCharacteristics(final String serviceUuid)
    {
        Log.v(TAG, "==> getServiceCharacteristics " + serviceUuid);

        // Get the service
        BluetoothGattService service = getService(serviceUuid);
        if (service != null)
        {
            // Get the list of characteristics
            List<BluetoothGattCharacteristic> characteristics = service.getCharacteristics();
            if (characteristics != null)
            {
                // Convert to a comma separated list
                StringBuilder sb = new StringBuilder();
                for (BluetoothGattCharacteristic charac : characteristics)
                {
                    if (sb.length() > 0) sb.append(",");
                    sb.append(charac.getUuid());
                }
                return sb.toString();
            }
        }
        return null;
    }

    //! @}
    //! \name Characteristic operations
    //! Valid only for peripherals in ready state.
    //! @{

    /**
     * @brief Gets the standard BLE properties of the specified service's characteristic.
     *
     * @see https://developer.android.com/reference/android/bluetooth/BluetoothGattCharacteristic#PROPERTY_BROADCAST,
     * PROPERTY_READ, PROPERTY_NOTIFY, etc.
     *
     * @param serviceUuid The service UUID.
     * @param characteristicUuid The characteristic UUID.
     * @param instanceIndex The instance index of the characteristic if listed more than once
     *                      for the service, otherwise zero.
     * @return The standard BLE properties of a service's characteristic, or zero if the call failed.
     */
    public int getCharacteristicProperties(final String serviceUuid, final String characteristicUuid, final int instanceIndex)
    {
        Log.v(TAG, "==> getCharacteristicProperties " + characteristicUuid);

        BluetoothGattCharacteristic characteristic
            = getCharacteristic(serviceUuid, characteristicUuid, instanceIndex);

        return characteristic == null ? 0 : characteristic.getProperties();
    }

    /**
     * @brief Queues a request to read the value of the specified service's characteristic.
     *
     * The call fails if the characteristic is not readable.
     *
     * @param serviceUuid The service UUID.
     * @param characteristicUuid The characteristic UUID.
     * @param instanceIndex The instance index of the characteristic if listed more than once
     *                      for the service, otherwise zero.
     * @param valueReadCallback The callback for notifying of the read value and the request status.
     */
    public void readCharacteristic(final String serviceUuid, final String characteristicUuid, final int instanceIndex, final ReadValueRequestCallback valueReadCallback)
    {
        Log.v(TAG, "==> readCharacteristic " + characteristicUuid);

        // Get the characteristic
        BluetoothGattCharacteristic characteristic
            = getCharacteristic(serviceUuid, characteristicUuid, instanceIndex);

        // Send the read request
        _client.readCharacteristic(characteristic)
            .with(valueReadCallback).fail(valueReadCallback).invalid(valueReadCallback)
            .enqueue();
    }

    /**
     * @brief Queues a request to write the value of specified service's characteristic.
     *
     * The call fails if the characteristic is not writable.
     *
     * @param serviceUuid The service UUID.
     * @param characteristicUuid The characteristic UUID.
     * @param instanceIndex The instance index of the characteristic if listed more than once
     *                      for the service, otherwise zero.
     * @param data The data to write to the characteristic (may be empty but not null).
     * @param withoutResponse Whether to wait for the peripheral to respond.
     * @param requestCallback The callback for notifying of the request result.
     */
    public void writeCharacteristic(final String serviceUuid, final String characteristicUuid, final int instanceIndex, final byte[] data, boolean withoutResponse, final RequestCallback requestCallback)
    {
        Log.v(TAG, "==> writeCharacteristic " + characteristicUuid);

        // Get the characteristic
        BluetoothGattCharacteristic characteristic
            = getCharacteristic(serviceUuid, characteristicUuid, instanceIndex);
        int writeType = withoutResponse
            ? BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
            : BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT;

        // Send the write request
        _client.writeCharacteristic(characteristic, data, writeType)
            .done(requestCallback).fail(requestCallback).invalid(requestCallback)
            .enqueue();
    }

    /**
     * @brief Queues a request to subscribe for value changes of the specified service's characteristic.
     *
     * Replaces a previously registered value change callback for the same characteristic.
     * The call fails if the characteristic doesn't support notifications.
     *
     * @param serviceUuid The service UUID.
     * @param characteristicUuid The characteristic UUID.
     * @param instanceIndex The instance index of the characteristic if listed more than once
     *                      for the service, otherwise zero.
     * @param valueChangedCallback The callback for notifying of the characteristic's value changes.
     * @param requestCallback The callback for notifying of the request result.
     */
    public void subscribeCharacteristic(final String serviceUuid, final String characteristicUuid, final int instanceIndex, final DataReceivedCallback valueChangedCallback, final RequestCallback requestCallback)
    {
        Log.v(TAG, "==> subscribeCharacteristic" + characteristicUuid);

        // Get the characteristic
        BluetoothGattCharacteristic characteristic
            = getCharacteristic(serviceUuid, characteristicUuid, instanceIndex);

        // Subscribe to notifications
        _client.setNotificationCallback(characteristic)
            .with(valueChangedCallback);

        // And turn them on
        _client.enableNotifications(characteristic)
            .done(requestCallback).fail(requestCallback).invalid(requestCallback)
            .enqueue();
    }

    /**
     * @brief Queues a request to unsubscribe from the specified service's characteristic.
     *
     * @param serviceUuid The service UUID.
     * @param characteristicUuid The characteristic UUID.
     * @param instanceIndex The instance index of the characteristic if listed more than once
     *                      for the service, otherwise zero.
     * @param requestCallback The callback for notifying of the request result.
     */
    public void unsubscribeCharacteristic(final String serviceUuid, final String characteristicUuid, final int instanceIndex, final RequestCallback requestCallback)
    {
        Log.v(TAG, "==> unsubscribeCharacteristic" + characteristicUuid);

        // Get the characteristic
        BluetoothGattCharacteristic characteristic
            = getCharacteristic(serviceUuid, characteristicUuid, instanceIndex);

        // Unsubscribe from notifications
        _client.removeNotificationCallback(characteristic);

        // And turn them of
        _client.disableNotifications(characteristic)
            .done(requestCallback).fail(requestCallback).invalid(requestCallback)
            .enqueue();
    }

    //! @}

    /**
     * @brief Gets the Android gatt service object for the given service UUID.
     */
    private BluetoothGattService getService(final String serviceUuid)
    {
        return _client.getService(UUID.fromString(serviceUuid));
    }

    /**
     * @brief Gets the Android gatt characteristic object for the given characteristic UUID.
     */
    private BluetoothGattCharacteristic getCharacteristic(final String serviceUuid, final String characteristicUuid, final int instanceIndex)
    {
        // Get the service
        BluetoothGattService service = getService(serviceUuid);
        if (service != null)
        {
            // Get the list of characteristics
            List<BluetoothGattCharacteristic> characteristics = service.getCharacteristics();
            if (characteristics != null)
            {
                // Look-up for the characteristic with the specified index
                UUID uuid = UUID.fromString(characteristicUuid);
                int counter = 0;
                for (BluetoothGattCharacteristic charac : characteristics)
                {
                    if (charac.getUuid().equals(uuid))
                    {
                        if (counter == instanceIndex)
                        {
                            return charac;
                        }
                        else
                        {
                            ++counter;
                        }
                    }
                }
            }
        }
        return null;
    }
}

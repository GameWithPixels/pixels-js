/**
 * @file
 * @brief Definition of SGBleConnectionEvent and SGBleConnectionEventReason enumerations.
 */

#ifndef SGBleTypes_h
#define SGBleTypes_h

#import <Foundation/Foundation.h>

// Forward declarations
@class CBPeripheral;
@class CBCharacteristic;
@class SGBlePeripheralQueue;

/**
 * @defgroup Apple_Objective-C
 * @brief A collection of Objective-C classes that provides a simplified access to
 *        Bluetooth Low Energy peripherals.
 *
 * @note Some knowledge with Bluetooth Low Energy semantics is recommended for reading
 *       this documentation.
 *
 * The Systemic Games Bluetooth Low Energy library for Apple devices provides classes for
 * scanning for Bluetooth Low Energy (BLE) peripherals, connecting to and communicating with them.
 * Those classes are based on the Apple's Core Bluetooth framework.
 *
 * The SGBleCentralManagerDelegate class implements the Apple
 * <a href="https://developer.apple.com/documentation/corebluetooth/cbcentralmanagerdelegate">
 * CBCentralManagerDelegate</a> protocol.
 * It stores and notifies of discovered BLE peripherals, also notifies of peripherals
 * connection events and of the host device Bluetooth radio state changes.
 *
 * The SGBlePeripheralQueue class implements the Apple
 * <a href="https://developer.apple.com/documentation/corebluetooth/cbperipheraldelegate">
 * CBPeripheralDelegate</a> protocol.
 * It queues BLE operations to be performed with a BLE
 * <a href="https://developer.apple.com/documentation/corebluetooth/cbperipheral">
 * peripheral</a>, run them sequentially and notify of their outcome.
 * The next request is run one the current one completes (whether successfully or not).
 *
 * This library also includes a set of C functions to be called from Unity for acessing
 * Bluetooth devices.
 *
 * Below is a diagram of the main classes of this library:
 * @image html native-apple.svg "Classes diagram"
 */

/**
 * @brief Peripheral connection events.
 * @ingroup Apple_Objective-C
 */
typedef NS_ENUM(NSInteger, SGBleConnectionEvent)
{
    /// Raised at the beginning of the connect sequence and is followed either by Connected or FailedToConnect.
    SGBleConnectionEventConnecting,
    
    /// Raised once the peripheral is connected, just before services are being discovered.
    SGBleConnectionEventConnected,
    
    /// Raised when the peripheral fails to connect, the reason of failure is also given.
    SGBleConnectionEventFailedToConnect,
    
    /// Raised after a Connected event, once the required services have been discovered.
    SGBleConnectionEventReady,
    
    /// Raised at the beginning of a user initiated disconnect.
    SGBleConnectionEventDisconnecting,
    
    /// Raised when the peripheral is disconnected, the reason for the disconnection is also given.
    SGBleConnectionEventDisconnected,
};

/**
 * @brief Peripheral connection events reasons.
 * @ingroup Apple_Objective-C
 */
typedef NS_ENUM(NSInteger, SGBleConnectionEventReason)
{
    /// The disconnect happened for an unknown reason.
    SGBleConnectionEventReasonUnknown = -1,
    
    /// The disconnect was initiated by user.
    SGBleConnectionEventReasonSuccess = 0,
    
    /// Connection attempt canceled by user.
    SGBleConnectionEventReasonCanceled,
    
    /// Peripheral doesn't have all required services.
    SGBleConnectionEventReasonNotSupported,
    
    /// Peripheral didn't responded in time.
    SGBleConnectionEventReasonTimeout,
    
    /// Peripheral was disconnected while in "auto connect" mode.
    SGBleConnectionEventReasonLinkLoss,
    
    /// The local device Bluetooth adapter is off.
    SGBleConnectionEventReasonAdapterOff,
};

/**
 * @brief Error codes.
 * @ingroup Apple_Objective-C
 */
typedef NS_ENUM(NSInteger, SGBleError)
{
    /// Application out of memory.
    SGBleErrorOutOfMemory,
    
    /// Call not implemented.
    SGBleErrorNotImplemented,
    
    /// Peripheral request has one or more invalid parameters.
    SGBleErrorInvalidParameter,
    
    /// Bluetooth or peripheral not in proper state to execute request.
    SGBleErrorInvalidState,
    
    /// Peripheral request got canceled.
    SGBleErrorRequestCanceled,
    
    /// Peripheral got disconnected while executing request.
    SGBleErrorPeripheralDisconnected,
};

/**
 * @brief Peripheral discovery handler.
 * @ingroup Apple_Objective-C
 */
typedef void (^SGBlePeripheralDiscoveryHandler)(CBPeripheral * _Nonnull peripheral, NSDictionary<NSString *, id> * _Nonnull advertisementData, NSNumber * _Nonnull rssi);

/**
 * @brief Peripheral connection event handler.
 * @ingroup Apple_Objective-C
 */
typedef void (^SGBleConnectionEventHandler)(CBPeripheral * _Nonnull peripheral, SGBleConnectionEvent connectionEvent, NSError * _Nullable error);

/**
 * @brief Peripheral connection event handler.
 * @ingroup Apple_Objective-C
 */
typedef void (^SGBleCharacteristicValueEventHandler)(SGBlePeripheralQueue * _Nonnull peripheralQueue, CBCharacteristic * _Nonnull characteristic, NSError * _Nullable error);

#endif /* SGBleTypes_h */

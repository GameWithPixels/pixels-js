/**
 * @file
 * @brief Definition of the SGBleCentralManagerDelegate class.
 */

#ifndef SGBleCentralManagerDelegate_h
#define SGBleCentralManagerDelegate_h

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import "SGBleTypes.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * @brief Implementation of
 *        <a href="https://developer.apple.com/documentation/corebluetooth/cbcentralmanagerdelegate">
 *        CBCentralManagerDelegate</a> protocol.
 *        Stores and notifies of discovered Bluetooth Low Energy (BLE) peripherals, also notifies
 *        of peripherals connection events and of the host device Bluetooth radio state changes.
 *
 * Upon SGBleCentralManagerDelegate initialization, an instance of this class creates a
 * <a href="https://developer.apple.com/documentation/corebluetooth/cbcentralmanager">
 * CBCentralManager</a> object and set itself as the manager's delegate. The central manager
 * is available through the centralManager property.
 *
 * @ingroup Apple_Objective-C
 */
@interface SGBleCentralManagerDelegate : NSObject<CBCentralManagerDelegate>
//! @cond
{
    NSObject *_startScanSync;
    void (^_stateUpdateHandler)(CBManagerState state);
    CBCentralManager *_centralManager;
    NSMutableDictionary<NSUUID *,CBPeripheral *> *_peripherals;
    NSMutableDictionary<CBPeripheral *, SGBleConnectionEventHandler> *_peripheralsConnectionEventHandlers;
}

// Property getters
- (CBCentralManager *)centralManager;
- (NSArray<CBPeripheral *> *)peripherals;
- (bool)isBluetoothOn;
//! @endcond

/**
 * @brief Gets the central manager associated with this instance.
 */
@property(readonly, getter=centralManager) CBCentralManager *centralManager;

/**
 * @brief Gets or set the handler for notifying of discovered peripherals.
 */
@property(strong) SGBlePeripheralDiscoveryHandler peripheralDiscoveryHandler;

/**
 * @brief Gets the list of discovered peripherals.
 */
@property(readonly, getter=peripherals) NSArray<CBPeripheral *> *peripherals;

/**
 * @brief Indicates whether the host device Bluetooth radio is turned on and accessible.
 */
@property(nonatomic, readonly, getter=isBluetoothOn) bool isBluetoothOn;

/**
 * @brief Initializes a SGBleCentralManagerDelegate instance with a Bluetooth state update handler.
 *
 * Creates a CBCentralManager object and set itself as the manager's delegate.
 * The manager is available through the centralManager property.
 * 
 * @param stateUpdateHandler The handler for notifying of the host device Bluetooth state changes.
 * @return The initialized SGBleCentralManagerDelegate instance.
 */
- (instancetype)initWithStateUpdateHandler:(nullable void (^)(CBManagerState state))stateUpdateHandler;

/**
 * @brief Clear the list of discovered peripherals.
 */
- (void)clearPeripherals;

/**
 * @brief Gets the discovered CBPeripheral for the given UUID.
 *
 * @param identifier The UUID assigned by the system to a BLE peripheral.
 * @return The CBPeripheral for the given UUID.
 */
- (nullable CBPeripheral *)peripheralForIdentifier:(NSUUID *)identifier;

/**
 * @brief Sets the handler for notifying of the given peripheral's connection events.
 *
 * Replace any handler previously set for this peripheral.
 *
 * @param peripheralConnectionEventHandler The handler for notifying connection events.
 * @param peripheral The peripheral to watch for connection events.
 */
- (void)setConnectionEventHandler:(nullable SGBleConnectionEventHandler)peripheralConnectionEventHandler
                    forPeripheral:(CBPeripheral *)peripheral;

@end

NS_ASSUME_NONNULL_END

#endif /* SGBleCentralManagerDelegate_h */

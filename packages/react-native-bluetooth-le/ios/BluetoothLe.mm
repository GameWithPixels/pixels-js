#import "BluetoothLe.h"
#import "BridgeUtils.h"
#import "SGBleErrors.h"
#import "SGBleCentralManagerDelegate.h"
#import "SGBlePeripheralQueue.h"

static NSString *bluetoothStateEventName = @"bluetoothState";
static NSString *scanResultEventName = @"scanResult";
static NSString *connectionEventName = @"connectionEvent";
static NSString *characteristicValueChangedEventName = @"characteristicValueChanged";

inline void rejectWithError(NSError *error, RCTPromiseRejectBlock reject)
{
    // TODO error code
    reject(@"ERROR", error.localizedDescription, error);
}

inline NSString *toString(SGBleConnectionEvent connectionEvent)
{
    switch (connectionEvent)
    {
        case SGBleConnectionEventConnecting:
            return  @"connecting";
        case SGBleConnectionEventConnected:
            return  @"connected";
        case SGBleConnectionEventFailedToConnect:
            return  @"failedToConnect";
        case SGBleConnectionEventReady:
            return  @"ready";
        case SGBleConnectionEventDisconnecting:
            return  @"disconnecting";
        case SGBleConnectionEventDisconnected:
            return  @"disconnected";
        default:
            throw ;
    }
}

inline NSString *toString(SGBleConnectionEventReason reason)
{
    switch (reason)
    {
        case SGBleConnectionEventReasonSuccess:
            return  @"success";
        case SGBleConnectionEventReasonCanceled:
            return  @"canceled";
        case SGBleConnectionEventReasonNotSupported:
            return  @"notSupported";
        case SGBleConnectionEventReasonTimeout:
            return  @"timeout";
        case SGBleConnectionEventReasonLinkLoss:
            return  @"linkLoss";
        case SGBleConnectionEventReasonAdapterOff:
            return  @"bluetoothOff";
        default:
            return  @"unknown";
    }
}

inline NSString *toString(CBPeripheralState state)
{
    switch (state) {
        case CBPeripheralStateDisconnected:
            return  @"disconnected";
        case CBPeripheralStateConnecting:
            return  @"connecting";
        case CBPeripheralStateConnected:
            return  @"connected";
        case CBPeripheralStateDisconnecting:
            return  @"disconnecting";
        default:
            return  @"unknown";
    }
}

inline NSString *toString(CBManagerState state)
{
    switch (state) {
        case CBManagerStateResetting:
            return @"resetting";
        case CBManagerStateUnauthorized:
            return @"unauthorized";
        case CBManagerStatePoweredOff:
            return @"off";
        case CBManagerStatePoweredOn:
            return @"ready";
        default:
            return  @"unknown";
    }
}

@implementation BluetoothLe
{
    // Our central manager instance
    SGBleCentralManagerDelegate *_central;
    // Maps a CBPeripheral to a SGBlePeripheralQueue
    NSMutableDictionary<CBPeripheral *, SGBlePeripheralQueue *> *_peripherals;
    // Flag telling us if there's any listener to our JavaScript events
    bool _hasListeners;
}

RCT_EXPORT_MODULE();

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBluetoothLeSpecJSI>(params);
}
#endif

- (id)init
{
    if (self = [super init])
    {
        _peripherals = [NSMutableDictionary<CBPeripheral *, SGBlePeripheralQueue *> new];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(bridgeReloading) name:RCTBridgeWillReloadNotification object:nil];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

-(void)startObserving
{
    _hasListeners = YES;
}

-(void)stopObserving
{
    _hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[
        bluetoothStateEventName,
        scanResultEventName,
        connectionEventName,
        characteristicValueChangedEventName,
    ];
}

-(void)bridgeReloading
{
    // TODO
}

- (CBPeripheral *)getCBPeripheral:(NSString *)deviceSystemId rejecter:(RCTPromiseRejectBlock)reject
{
    if (deviceSystemId)
    {
        NSUUID *uuid = [[NSUUID UUID] initWithUUIDString:deviceSystemId];
        CBPeripheral *peripheral = [_central peripheralForIdentifier:uuid];
        if (!peripheral && reject)
        {
            rejectWithError(SGBleUnknownPeripheralError, reject);
        }
        return peripheral;
    }
    else if (reject)
    {
        rejectWithError(SGBleInvalidParameterError, reject);
    }
    return nil;
}

- (SGBlePeripheralQueue *)getSGBlePeripheralQueue:(NSString *)deviceSystemId rejecter:(RCTPromiseRejectBlock)reject
{
    CBPeripheral *peripheral = [self getCBPeripheral:deviceSystemId rejecter:reject];
    if (peripheral)
    {
        SGBlePeripheralQueue * sgPeripheral = [_peripherals objectForKey:peripheral];
        if (sgPeripheral)
        {
            return sgPeripheral;
        }
        else if (reject)
        {
            rejectWithError(SGBleInvalidParameterError, reject);
        }
    }
    return nil;
}

- (CBService *)getService:(NSString *)deviceSystemId serviceUuid:(NSString *)serviceUuid rejecter:(RCTPromiseRejectBlock)reject
{
    if (deviceSystemId && serviceUuid)
    {
        CBPeripheral *peripheral = [self getCBPeripheral:deviceSystemId rejecter:reject];
        CBUUID *uuid = [CBUUID UUIDWithString:serviceUuid];
        for (CBService *service in peripheral.services)
        {
            if ([uuid isEqual:service.UUID])
            {
                return service;
            }
        }
    }
    rejectWithError(SGBleInvalidParameterError, reject);
    return nil;
}

- (CBCharacteristic *)getCharacteristic:(NSString *)deviceSystemId serviceUuid:(NSString *)serviceUuid characteristicUuid:(NSString *)characteristicUuid instanceIndex:(nonnull NSNumber *)instanceIndex rejecter:(RCTPromiseRejectBlock)reject
{
    CBService *service = [self getService:deviceSystemId serviceUuid:serviceUuid rejecter:reject];
    if (service)
    {
        if (characteristicUuid)
        {
            CBUUID *uuid = [CBUUID UUIDWithString:characteristicUuid];
            int index = instanceIndex.intValue;
            for (CBCharacteristic *characteristic in service.characteristics)
            {
                if ([uuid isEqual:characteristic.UUID])
                {
                    if (index == 0)
                    {
                        return characteristic;
                    }
                    else
                    {
                        --index;
                    }
                }
            }
        }
        rejectWithError(SGBleInvalidParameterError, reject);
    }
    return nil;
}

RCT_EXPORT_METHOD(bleInitialize:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (!_central)
    {
        __weak BluetoothLe *weakSelf = self;
        _central = [[SGBleCentralManagerDelegate alloc] initWithStateUpdateHandler:^(CBManagerState state) {
            BluetoothLe *self = weakSelf;
            // Check if instance still exist and has listeners
            if (self && self->_hasListeners)
            {
                [self sendEventWithName:bluetoothStateEventName body:@{
                    @"state": toString(state),
                }];
            }
        }];
        _central.peripheralDiscoveryHandler = ^(CBPeripheral *peripheral, NSDictionary<NSString *,id> *advertisementData, NSNumber *rssi) {
            BluetoothLe *self = weakSelf;
            // Check if instance still exist and has listeners
            if (self && self->_hasListeners)
            {
                [self sendEventWithName:scanResultEventName body:@{
                    @"device": peripheralToDict(peripheral),
                    @"advertisementData": advertisementToDict(advertisementData, rssi),
                }];
            }
        };
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(startScan:(NSString *)requiredServicesUuids
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (!_central.isBluetoothOn)
    {
        rejectWithError(SGBleInvalidStateError, reject);
    }
    else
    {
        [_central.centralManager scanForPeripheralsWithServices:toCBUUIDArray(requiredServicesUuids)
                                                        options:@{ CBCentralManagerScanOptionAllowDuplicatesKey: @YES }];
        resolve(nil);
    }
}

RCT_EXPORT_METHOD(stopScan:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [_central.centralManager stopScan];
    
    resolve(nil);
}

RCT_EXPORT_METHOD(createPeripheral:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *sgPeripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:nil];
    if (!sgPeripheral)
    {
        CBPeripheral *cbPeripheral = [self getCBPeripheral:deviceSystemId rejecter:reject];
        if (cbPeripheral)
        {
            __weak BluetoothLe *weakSelf = self;
            // Create our peripheral object
            sgPeripheral = [[SGBlePeripheralQueue alloc]
                            initWithPeripheral:cbPeripheral
                            centralManagerDelegate:_central];
            sgPeripheral.connectionEventHandler = ^(SGBlePeripheralQueue * _Nonnull peripheral, SGBleConnectionEvent connectionEvent, SGBleConnectionEventReason reason) {
                BluetoothLe *self = weakSelf;
                // Check if instance still exist, has listeners and still has a reference to the peripheral
                if (self && self->_hasListeners && [self->_peripherals.allValues containsObject:peripheral])
                {
                    [self sendEventWithName:connectionEventName body:@{
                        @"device": peripheralToDict(peripheral),
                        @"connectionStatus": toString(connectionEvent),
                        @"reason": toString(reason),
                    }];
                }
            };
            
            // And store it
            if (sgPeripheral)
            {
                [_peripherals setObject:sgPeripheral forKey:cbPeripheral];
            }
            else
            {
                rejectWithError(SGBleOutOfMemoryError, reject);
            }
        }
    }
    
    if (sgPeripheral)
    {
        resolve(peripheralToDict(sgPeripheral));
    }
}

RCT_EXPORT_METHOD(releasePeripheral:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    CBPeripheral *cbPeripheral = [self getCBPeripheral:deviceSystemId rejecter:nil]; // Don't reject if invalid id
    [_peripherals removeObjectForKey:cbPeripheral];
    
    resolve(nil);
}

RCT_EXPORT_METHOD(connectPeripheral:(NSString *)deviceSystemId
                  requiredServicesUuids: (NSString *)requiredServicesUuids
                  autoReconnect: (BOOL)autoReconnect
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:reject];
    [peripheral queueConnectWithServices:toCBUUIDArray(requiredServicesUuids)
                       completionHandler:^(NSError *error) {
        if (error)
        {
            rejectWithError(error, reject);;
        }
        else
        {
            resolve(peripheralToDict(peripheral));
        }
    }];
}

RCT_EXPORT_METHOD(disconnectPeripheral:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:nil]; // Don't reject if invalid id
    if (peripheral)
    {
        [peripheral cancelAll];
        [peripheral queueDisconnect:^(NSError *error) {
            if (error)
            {
                rejectWithError(error, reject);;
            }
            else
            {
                resolve(nil);
            }
        }];
    }
    else
    {
        resolve(nil);
    }
}

RCT_EXPORT_METHOD(getPeripheralConnectionStatus:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:reject];
    if (peripheral)
    {
        CBPeripheralState state = peripheral.peripheral.state;
        if (state == CBPeripheralStateConnected && peripheral.isReady)
        {
            resolve(@"ready");
        }
        else
        {
            resolve(toString(state));
        }
    }
}

RCT_EXPORT_METHOD(getPeripheralName:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    CBPeripheral *cbPeripheral = [self getCBPeripheral:deviceSystemId rejecter:reject];
    if (cbPeripheral)
    {
        resolve(cbPeripheral.name);
    }
}

RCT_EXPORT_METHOD(getPeripheralMtu:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    CBPeripheral *cbPeripheral = [self getCBPeripheral:deviceSystemId rejecter:reject];
    if (cbPeripheral)
    {
        // Return the smallest MTU since we don't differentiate the 2 values
        int mtu1 = (int)[cbPeripheral maximumWriteValueLengthForType:CBCharacteristicWriteWithResponse];
        int mtu2 = (int)[cbPeripheral maximumWriteValueLengthForType:CBCharacteristicWriteWithoutResponse];
        int mtu = mtu2 <= 0 || mtu1 <= mtu2 ? mtu1 : mtu2;
        resolve(@(mtu));
    }
}

RCT_EXPORT_METHOD(requestPeripheralMtu:(NSString *)deviceSystemId
                  mtu:(nonnull NSNumber *)mtu
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [self getPeripheralMtu:deviceSystemId resolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(readPeripheralRssi:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:reject];
    [peripheral queueReadRssi:^(NSError *error) {
        if (error)
        {
            rejectWithError(error, reject);;
        }
        else
        {
            resolve(@(peripheral.rssi));
        }
    }];
}

RCT_EXPORT_METHOD(getDiscoveredServices:(NSString *)deviceSystemId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    CBPeripheral *cbPeripheral = [self getCBPeripheral:deviceSystemId rejecter:reject];
    if (cbPeripheral)
    {
        resolve(toUuidsString(cbPeripheral.services));
    }
}

RCT_EXPORT_METHOD(getServiceCharacteristics:(NSString *)deviceSystemId
                  serviceUuid:(NSString *)serviceUuid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    CBService *service = [self getService:deviceSystemId serviceUuid:serviceUuid rejecter:reject];
    if (service)
    {
        resolve(toUuidsString(service.characteristics));
    }
}

RCT_EXPORT_METHOD(getCharacteristicProperties:(NSString *)deviceSystemId
                  serviceUuid:(NSString *)serviceUuid
                  characteristicUuid:(NSString *)characteristicUuid
                  instanceIndex:(nonnull NSNumber *)instanceIndex
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    CBCharacteristic *characteristic = [self getCharacteristic:deviceSystemId serviceUuid:serviceUuid characteristicUuid:characteristicUuid instanceIndex:instanceIndex rejecter:reject];
    if (characteristic)
    {
        resolve(@((int)characteristic.properties));
    }
}

RCT_EXPORT_METHOD(readCharacteristic:(NSString *)deviceSystemId
                  serviceUuid:(NSString *)serviceUuid
                  characteristicUuid:(NSString *)characteristicUuid
                  instanceIndex:(nonnull NSNumber *)instanceIndex
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:reject];
    if (peripheral)
    {
        CBCharacteristic *characteristic = [self getCharacteristic:deviceSystemId serviceUuid:serviceUuid characteristicUuid:characteristicUuid instanceIndex:instanceIndex rejecter:reject];
        if (characteristic)
        {
            [peripheral queueReadValueForCharacteristic:characteristic
                                       valueReadHandler:^(SGBlePeripheralQueue *peripheral, CBCharacteristic *characteristic, NSError *error) {
                if (error)
                {
                    rejectWithError(error, reject);;
                }
                else
                {
                    resolve(dataToArr(characteristic.value));
                }
            }];
        }
    }
}

RCT_EXPORT_METHOD(writeCharacteristic:(NSString *)deviceSystemId
                  serviceUuid:(NSString *)serviceUuid
                  characteristicUuid:(NSString *)characteristicUuid
                  instanceIndex:(nonnull NSNumber *)instanceIndex
                  data:(NSArray *)data
                  withoutResponse:(BOOL)withoutResponse
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (data)
    {
        SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:reject];
        if (peripheral)
        {
            CBCharacteristic *characteristic = [self getCharacteristic:deviceSystemId serviceUuid:serviceUuid characteristicUuid:characteristicUuid instanceIndex:instanceIndex rejecter:reject];
            if (characteristic)
            {
                [peripheral queueWriteValue:toData(data)
                          forCharacteristic:characteristic
                                       type:withoutResponse ? CBCharacteristicWriteWithoutResponse : CBCharacteristicWriteWithResponse
                          completionHandler:^(NSError *error) {
                    if (error)
                    {
                        rejectWithError(error, reject);;
                    }
                    else
                    {
                        resolve(nil);
                    }
                }];
            }
        }
    }
    else
    {
        rejectWithError(SGBleInvalidParameterError, reject);
    }
}

RCT_EXPORT_METHOD(subscribeCharacteristic:(NSString *)deviceSystemId
                  serviceUuid:(NSString *)serviceUuid
                  characteristicUuid:(NSString *)characteristicUuid
                  instanceIndex:(nonnull NSNumber *)instanceIndex
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:reject];
    if (peripheral)
    {
        CBCharacteristic *characteristic = [self getCharacteristic:deviceSystemId serviceUuid:serviceUuid characteristicUuid:characteristicUuid instanceIndex:instanceIndex rejecter:reject];
        if (characteristic)
        {
            __weak BluetoothLe *weakSelf = self;
            [peripheral queueSetNotifyValueForCharacteristic:characteristic
                                         valueChangedHandler:^(SGBlePeripheralQueue *peripheral, CBCharacteristic *, NSError *error) {
                BluetoothLe *self = weakSelf;
                // Check if instance still exist, has listeners and still has a reference to the peripheral
                if (!error && self && self->_hasListeners && [self->_peripherals.allValues containsObject:peripheral])
                {
                    [self sendEventWithName:characteristicValueChangedEventName body:@{
                        @"device": peripheralToDict(peripheral),
                        @"characteristic": characteristicToDict(characteristic, instanceIndex),
                        @"data": dataToArr(characteristic.value),
                    }];
                }
            }
                                           completionHandler:^(NSError *error) {
                if (error)
                {
                    rejectWithError(error, reject);
                }
                else
                {
                    resolve(nil);
                }
            }];
        }
    }
}

RCT_EXPORT_METHOD(unsubscribeCharacteristic:(NSString *)deviceSystemId
                  serviceUuid:(NSString *)serviceUuid
                  characteristicUuid:(NSString *)characteristicUuid
                  instanceIndex:(nonnull NSNumber *)instanceIndex
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    SGBlePeripheralQueue *peripheral = [self getSGBlePeripheralQueue:deviceSystemId rejecter:reject];
    if (peripheral)
    {
        CBCharacteristic *characteristic = [self getCharacteristic:deviceSystemId serviceUuid:serviceUuid characteristicUuid:characteristicUuid instanceIndex:instanceIndex rejecter:reject];
        if (characteristic)
        {
            [peripheral queueSetNotifyValueForCharacteristic:characteristic
                                         valueChangedHandler:nil
                                           completionHandler:^(NSError *error) {
                if (error)
                {
                    rejectWithError(error, reject);
                }
                else
                {
                    resolve(nil);
                }
            }];
        }
    }
}

@end

#import "SGBleCentralManagerDelegate.h"
#import "SGBleUtils.h"
#import "SGBleErrors.h"

@implementation SGBleCentralManagerDelegate

@synthesize peripheralDiscoveryHandler;

//
// Getters
//

- (CBCentralManager *)centralManager
{
    return _centralManager;
}

- (NSArray<CBPeripheral *> *)peripherals
{
    @synchronized(_peripherals)
    {
        return _peripherals.allValues;
    }
}

- (bool)isBluetoothOn
{
    return _centralManager.state == CBManagerStatePoweredOn;
}

//
// Public methods
//

- (instancetype)initWithStateUpdateHandler:(void (^)(CBManagerState state))stateUpdateHandler
{
    if (self = [super init])
    {
        _startScanSync = [NSObject new];
        _stateUpdateHandler = stateUpdateHandler;
        _centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:sgBleGetSerialQueue() options:@{ CBCentralManagerOptionShowPowerAlertKey: @NO }];
        _peripherals = [NSMutableDictionary<NSUUID *,CBPeripheral *> new];
        _peripheralsConnectionEventHandlers = [NSMutableDictionary<CBPeripheral *, SGBleConnectionEventHandler> new];
    }
    return self;
}

#if DEBUG
- (void)dealloc
{
    NSLog(@"SGBleCentralManagerDelegate dealloc");
}
#endif

- (void)clearPeripherals
{
    [_peripherals removeAllObjects];
}

// Returns nil if not found
- (CBPeripheral *)peripheralForIdentifier:(NSUUID *)identifier;
{
    // Note: we could use CBCentralManager.retrievePeripheralsWithIdentifiers which only returns scanned peripherals
    @synchronized(_peripherals)
    {
        return _peripherals[identifier];
    }
}

- (void)setConnectionEventHandler:(SGBleConnectionEventHandler)peripheralConnectionEventHandler
                    forPeripheral:(CBPeripheral *)peripheral
{
    if (peripheral)
    {
        @synchronized (_peripheralsConnectionEventHandlers)
        {
            _peripheralsConnectionEventHandlers[peripheral] = peripheralConnectionEventHandler;
        }
    }
}

//
// Private methods
//

- (void)raiseConnectionEventForPeripheral:(CBPeripheral *)peripheral
                          connectionEvent:(SGBleConnectionEvent)connectionEvent
                                    error:(NSError *)error
{
    SGBleConnectionEventHandler handler;
    @synchronized (_peripheralsConnectionEventHandlers)
    {
        handler = _peripheralsConnectionEventHandlers[peripheral];
    }
    if (handler)
    {
        handler(peripheral, connectionEvent, error);
    }
}

//
// CBCentralManagerDelegate implementation
//

- (void)centralManagerDidUpdateState:(CBCentralManager *)central
{
    if (_stateUpdateHandler)
    {
        _stateUpdateHandler(central.state);
    }
    if (!self.isBluetoothOn)
    {
        // Notify all peripherals disconnected
        NSArray<CBPeripheral *> *peripherals = nil;
        @synchronized (_peripheralsConnectionEventHandlers)
        {
            peripherals = _peripheralsConnectionEventHandlers.allKeys;
        }
        for (CBPeripheral *peripheral in peripherals)
        {
            [self raiseConnectionEventForPeripheral:peripheral connectionEvent:SGBleConnectionEventDisconnected error:SGBleBluetoothStateError];
        }
    }
}

- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary<NSString *,id> *)advertisementData
                  RSSI:(NSNumber *)RSSI
{
    // Need to keep a reference to peripheral so the system doesn't deallocate it
    @synchronized(_peripherals)
    {
        _peripherals[peripheral.identifier] = peripheral;
    }
    SGBlePeripheralDiscoveryHandler handler = self.peripheralDiscoveryHandler;
    if (handler)
    {
        handler(peripheral, advertisementData, RSSI);
    }
}

- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral
{
    [self raiseConnectionEventForPeripheral:peripheral connectionEvent:SGBleConnectionEventConnected error:nil];
}

- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error
{
    [self raiseConnectionEventForPeripheral:peripheral connectionEvent:SGBleConnectionEventDisconnected error:error];
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error
{
    [self raiseConnectionEventForPeripheral:peripheral connectionEvent:SGBleConnectionEventFailedToConnect error:error];
}

// - (void)centralManager:(CBCentralManager *)central connectionEventDidOccur:(CBConnectionEvent)event forPeripheral:(CBPeripheral *)peripheral
// {
// }

@end

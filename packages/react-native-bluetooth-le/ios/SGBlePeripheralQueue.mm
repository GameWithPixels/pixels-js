#import "SGBlePeripheralQueue.h"
#import "SGBleUtils.h"
#import "SGBleErrors.h"

#define NSLog(...) // Turn off logging

@implementation SGBlePeripheralQueue

//
// Getters
//

- (CBPeripheral *)peripheral
{
    return _peripheral;
}

- (bool)isReady
{
    return _isReady;
}

- (int)rssi
{
    return _rssi;
}

//
// Public methods
//

- (instancetype)initWithPeripheral:(CBPeripheral *)peripheral
            centralManagerDelegate:(SGBleCentralManagerDelegate *)centralManagerDelegate
{
    if (self = [super init])
    {
        if (!peripheral || !centralManagerDelegate)
        {
            return nil;
        }
        
        // We can't find any reliable information about the thread safety of CoreBluetooth APIs
        // so we're going to assume that CBCentralManager, CBPeripheral, CBCharacteristic and CBDescriptor
        // achieve any required synchronization with the given queue.
        // When no queue is given to the central manager, it defaults to the main thread serial queue.
        // We create a serial queue as well so we don't have to worry about synchronization when we use
        // the queue ourselves (and obviously CoreBluetooth works well with a serial queue).
        // We're not concerned about performance by using a serial queue as Bluetooth LE operations
        // are "low" frequency by design anyways.
        _queue = sgBleGetSerialQueue();
        _centralDelegate = centralManagerDelegate;
        _peripheral = peripheral;
        _peripheral.delegate = self;
        _pendingRequests = [NSMutableArray<SGBleRequest *> new];
        _valueChangedHandlers = [NSMapTable<CBCharacteristic *, SGBleCharacteristicValueEventHandler> strongToStrongObjectsMapTable];
        
        __weak SGBlePeripheralQueue *weakSelf = self;
        SGBleConnectionEventHandler handler =
        ^(CBPeripheral *peripheral, SGBleConnectionEvent connectionEvent, NSError *error)
        {
            // Be sure to not use self directly (or implicitly by referencing a property)
            // otherwise it creates a strong reference to itself and prevents the instance's deallocation
            SGBlePeripheralQueue *strongSelf = weakSelf;
            if (strongSelf)
            {
                bool connecting = strongSelf->_runningRequest.type == SGBleRequestTypeConnect;
                bool disconnecting = strongSelf->_runningRequest.type == SGBleRequestTypeDisconnect;
                NSLog(@">> PeripheralConnectionEvent: connecting=%i, disconnecting=%i", (int)connecting, (int)disconnecting);

                switch (connectionEvent)
                {
                    case SGBleConnectionEventConnected:
                    {
                        if (connecting)
                        {
                            NSLog(@">> PeripheralConnectionEvent => connected, now discovering services");
                            // We must discover services and characteristics before we can use them
                            strongSelf->_disconnectReason = SGBleConnectionEventReasonSuccess;
                            [peripheral discoverServices:strongSelf->_requiredServices];
                        }
                        else
                        {
                            // Most likely another piece of code has connected to this peripheral
                            NSLog(@">> PeripheralConnectionEvent => connected, but not running a connection request");
                        }
                        break;
                    }
                        
                    case SGBleConnectionEventDisconnected:
                    {
                        NSLog(@">> PeripheralConnectionEvent => disconnected with error %@", error);
                        
                        // Some cleanup
                        strongSelf->_valueReadHandler = nil;
                        [strongSelf->_valueChangedHandlers removeAllObjects];
                        
                        SGBleConnectionEventReason reason = strongSelf->_disconnectReason;
                        if (reason != SGBleConnectionEventReasonSuccess)
                        {
                            // Reset stored reason
                            strongSelf->_disconnectReason = SGBleConnectionEventReasonSuccess;
                            if (reason == SGBleConnectionEventReasonCanceled)
                            {
                                error = SGBleRequestCanceledError;
                            }
                        }
                        else if (!disconnecting)
                        {
                            // We got disconnected but not because we asked for it
                            if (error.domain == CBErrorDomain && error.code == CBErrorConnectionTimeout)
                            {
                               reason = SGBleConnectionEventReasonLinkLoss;
                            }
                            else if (error.domain == SGBleErrorDomain && error.code == SGBleErrorBluetoothState)
                            {
                                reason = SGBleConnectionEventReasonAdapterOff;
                            }
                            else if (error)
                            {
                                reason = SGBleConnectionEventReasonUnknown;
                            }
                        }
                        
                        // We were connecting, we need to have an error
                        if (connecting && !error)
                        {
                            error = SGBleDisconnectedError;
                        }
                        
                        [strongSelf qNotifyConnectionEvent:SGBleConnectionEventDisconnected reason:reason];

                        [strongSelf qReportRequestResult:error forRequestType:strongSelf->_runningRequest.type];
                        break;
                    }

                    // This case happens rarely, and is usually caused by a transient issue
                    // Because connection shouldn't time out, we attempt to connect again
                    case SGBleConnectionEventFailedToConnect:
                    {
                        NSLog(@">> PeripheralConnectionEvent => failed with error %@", error);
                        if (connecting)
                        {
                            [strongSelf->_centralDelegate.centralManager connectPeripheral:strongSelf->_peripheral options:nil];
                        }
                        break;
                    }
                        
                    default:
                        NSLog(@">> PeripheralConnectionEvent = ???"); // TODO
                        break;
                }
            }
        };
        [_centralDelegate setConnectionEventHandler:handler
                                      forPeripheral:_peripheral];
    }
    return self;
}

- (void)dealloc
{
    // No need to call super dealloc when ARC is enabled
    [self internalDisconnect:SGBleConnectionEventReasonSuccess];
    NSLog(@">> SGBlePeripheral dealloc");
}

- (void)queueConnectWithServices:(NSArray<CBUUID *> *)services
               completionHandler:(void (^)(NSError *error))completionHandler
{
    NSLog(@">> queueConnect");
    
    NSArray<CBUUID *> *requiredServices = [services copy];
    SGBleRequestExecuteHandler block = ^{
        NSLog(@">> Connect");
        self->_requiredServices = requiredServices;
        [self qNotifyConnectionEvent:SGBleConnectionEventConnecting reason:SGBleConnectionEventReasonSuccess];
        [self->_centralDelegate.centralManager connectPeripheral:self->_peripheral options:nil];
        return (NSError *)nil;
    };
    
    [self queueRequest:SGBleRequestTypeConnect
        executeHandler:block
     completionHandler:completionHandler];
}

- (void)queueDisconnect:(void (^)(NSError *error))completionHandler
{
    NSLog(@">> queueDisconnect");
    
    SGBleRequestExecuteHandler block = ^{
        NSLog(@">> Disconnect");
        [self qNotifyConnectionEvent:SGBleConnectionEventDisconnecting reason:SGBleConnectionEventReasonSuccess];
        [self internalDisconnect:SGBleConnectionEventReasonSuccess];
        return (NSError *)nil;
    };
    
    [self queueRequest:SGBleRequestTypeDisconnect
        executeHandler:block
     completionHandler:completionHandler];
}

- (void)queueReadRssi:(void (^)(NSError *error))completionHandler
{
    NSLog(@">> queueReadRsssi");
    
    SGBleRequestExecuteHandler block = ^{
        NSLog(@">> ReadRSSI");
        [self->_peripheral readRSSI];
        return (NSError *)nil;
    };

    [self queueRequest:SGBleRequestTypeReadRssi
        executeHandler:block
     completionHandler:completionHandler];
}

- (void)queueReadValueForCharacteristic:(CBCharacteristic *)characteristic
                    valueReadHandler:(SGBleCharacteristicValueEventHandler)valueReadHandler
{
    NSLog(@">> queueReadValueForCharacteristic");
    
    SGBleRequestExecuteHandler block = ^{
        if (!characteristic || !valueReadHandler)
        {
            NSLog(@">> ReadValueForCharacteristic -> invalid parameter");
            return SGBleInvalidArgumentError;
        }
        
        NSLog(@">> ReadValueForCharacteristic");
        self->_valueReadHandler = valueReadHandler;
        [self->_peripheral readValueForCharacteristic:characteristic];
        return (NSError *)nil;
    };

    [self queueRequest:SGBleRequestTypeReadValue
        executeHandler:block
     completionHandler:nil];
}

- (void)queueWriteValue:(NSData *)data
      forCharacteristic:(CBCharacteristic *)characteristic
                   type:(CBCharacteristicWriteType)type
      completionHandler:(void (^)(NSError *error))completionHandler
{
    NSLog(@">> queueWriteValue");
    
    SGBleRequestExecuteHandler block = ^{
        if (!characteristic || !data)
        {
            NSLog(@">> WriteValue -> invalid parameters");
            return SGBleInvalidArgumentError;
        }
        
        NSLog(@">> WriteValue");
        [self->_peripheral writeValue:data forCharacteristic:characteristic type:type];
        if (type == CBCharacteristicWriteWithoutResponse)
        {
            [self qReportRequestResult:nil forRequestType:SGBleRequestTypeWriteValue];
        }
        return (NSError *)nil;
    };

    [self queueRequest:SGBleRequestTypeWriteValue
        executeHandler:block
     completionHandler:completionHandler];
}

- (void)queueSetNotifyValueForCharacteristic:(CBCharacteristic *)characteristic
                         valueChangedHandler:(SGBleCharacteristicValueEventHandler)valueChangedHandler
                           completionHandler:(void (^)(NSError *error))completionHandler
{
    NSLog(@">> queueSetNotifyValueForCharacteristic");
    
    SGBleRequestExecuteHandler block = ^{
        if (!characteristic || !valueChangedHandler)
        {
            NSLog(@">> SetNotifyValueForCharacteristic -> invalid parameters");
            return SGBleInvalidArgumentError;
        }
        
        NSLog(@">> SetNotifyValueForCharacteristic");
        // Replaces a previously registered callback for the same characteristic.
        [self->_valueChangedHandlers setObject:valueChangedHandler forKey:characteristic];
        [self->_peripheral setNotifyValue:valueChangedHandler != nil forCharacteristic:characteristic];
        return (NSError *)nil;
    };

    [self queueRequest:SGBleRequestTypeSetNotifyValue
        executeHandler:block
     completionHandler:completionHandler];
}

- (void)cancelAll
{
    NSLog(@">> cancelAll");
    
    NSArray<SGBleRequest *> *requestsToCancel = nil;
    @synchronized (_pendingRequests)
    {
        // First clear the queue
        if (_pendingRequests.count > 0)
        {
            requestsToCancel = [[NSArray<SGBleRequest *> alloc] initWithArray:_pendingRequests];
            [_pendingRequests removeAllObjects];
        }
    }
    
    dispatch_async(_queue, ^{
        if (self->_runningRequest)
        {
            SGBleRequestType requestType = self->_runningRequest.type;

            // Cancel the running request
            NSLog(@">> Queue canceled while running request of type %@", [SGBleRequest requestTypeToString:requestType]);
            [self qReportRequestResult:SGBleRequestCanceledError forRequestType:requestType];
        
            // If we were trying to connect, cancel connection immediately
            if (requestType == SGBleRequestTypeConnect)
            {
                NSLog(@">> Queue canceled while connecting => cancelling connection");
                [self internalDisconnect:SGBleConnectionEventReasonCanceled];
            }
            
            // Cancel pending requests
            for (SGBleRequest *request in requestsToCancel)
            {
                [request notifyResult:SGBleRequestCanceledError];
            }
        }
    });
}

//
// Private methods
//

- (void)internalDisconnect:(SGBleConnectionEventReason)reason
{
    if ((reason == SGBleConnectionEventReasonCanceled)
        || (_disconnectReason != SGBleConnectionEventReasonCanceled))
    {
        _disconnectReason = reason;
    }
    [_centralDelegate.centralManager cancelPeripheralConnection:_peripheral];
}

// completionHandler can be nil
- (void)queueRequest:(SGBleRequestType)requestType
      executeHandler:(SGBleRequestExecuteHandler)executeHandler
   completionHandler:(SGBleRequestCompletionHandler)completionHandler
{
    @synchronized (_pendingRequests)
    {
        // Queue request and completion handler
        SGBleRequest *request = [[SGBleRequest alloc] initWithRequestType:requestType executeHandler:executeHandler completionHandler:completionHandler];
        [_pendingRequests addObject:request];
        
        NSLog(@">> queueRequest size=%lu", (unsigned long)_pendingRequests.count);
    }

    // Try to run request immediately
    dispatch_async(_queue, ^{
        [self qRunNextRequest];
    });
}

// Should always be called on the queue
- (void)qRunNextRequest
{
    SGBleRequest *request = nil;

    @synchronized (_pendingRequests)
    {
        if (_runningRequest)
        {
            NSLog(@">> Already running a request, type %@", [SGBleRequest requestTypeToString:_runningRequest.type]);
        }
        else if (_pendingRequests.count > 0)
        {
            NSLog(@">> runNextRequest size=%lu", (unsigned long)_pendingRequests.count);
            
            request = _runningRequest = _pendingRequests[0];
            [_pendingRequests removeObjectAtIndex:0];
            NSAssert(request, @"Got a nil request from the queue");
        }
    }
    
    if (request)
    {
        CBPeripheralState state = _peripheral.state;
        bool connectState = (state == CBPeripheralStateConnecting) || (state == CBPeripheralStateConnected);
        bool disconnectState = (state == CBPeripheralStateDisconnecting) || (state == CBPeripheralStateDisconnected);
        if (((request.type == SGBleRequestTypeConnect) && connectState)
            || ((request.type == SGBleRequestTypeDisconnect) && disconnectState))
        {
            // Connect or disconnect requests return immediately a success if peripheral already
            // in desired state or transitioning to it
            [self qReportRequestResult:nil forRequestType:request.type];
        }
        else
        {
            NSError *error = _centralDelegate.isBluetoothOn ?
                [request execute] : SGBleBluetoothStateError;
            if (error)
            {
                [self qReportRequestResult:error forRequestType:request.type];
            }
        }
    }
}

// Should always be called on the queue
- (void)qReportRequestResult:(NSError *)error forRequestType:(SGBleRequestType)requestType
{
    [self qReportRequestResult:error forRequestType:requestType customNotifier:nil];
}

// Should always be called on the queue
- (void)qReportRequestResult:(NSError *)error forRequestType:(SGBleRequestType)requestType customNotifier:(void(^)(NSError *))customNotifier
{
    SGBleRequest *request = nil;
    
    @synchronized (_pendingRequests)
    {
        request = _runningRequest;
        _runningRequest = nil;
    }
    
    if (request.type == requestType)
    {
        NSLog(@">> Notifying result for request of type %@, with error: %@",
              [SGBleRequest requestTypeToString:request.type], error);
        if (customNotifier)
        {
            customNotifier(error);
        }
        else
        {
            [request notifyResult:error];
        }
    }
    else if (requestType)
    {
        NSLog(@">> Got result for request of type %@ while running request of type %@, with error: %@",
              [SGBleRequest requestTypeToString:requestType], [SGBleRequest requestTypeToString:request.type], error);
    }
    
    [self qRunNextRequest];
}

// Should always be called on the queue
- (void)qNotifyConnectionEvent:(SGBleConnectionEvent)connectionEvent
                        reason:(SGBleConnectionEventReason)reason
{
    NSLog(@">> Notifying connection event: %ld, reason: %ld", (long)connectionEvent, (long)reason);
    _isReady = connectionEvent == SGBleConnectionEventReady;
    if (_connectionEventHandler)
    {
        _connectionEventHandler(self, connectionEvent, reason);
    }
}

- (bool)hasAllRequiredServices:(NSArray<CBService *> *)services
{
    for (CBUUID *uuid in _requiredServices)
    {
        bool found = false;
        for (CBService *service in services)
        {
            found = [service.UUID isEqual:uuid];
            if (found) break;
        }
        if (!found) return false;
    }
    return true;
}

//
// CBPeripheralDelegate implementation
//

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error
{
    if (error)
    {
        NSLog(@">> peripheral:didDiscoverServices:error => %@", error);
        [self internalDisconnect:SGBleConnectionEventReasonUnknown];
    }
    else if (![self hasAllRequiredServices:peripheral.services])
    {
        [self internalDisconnect:SGBleConnectionEventReasonNotSupported];
    }
    else
    {
        // Store number of services to discover, we'll consider to be fully connected
        // only all the services have been discovered
        _discoveringServicesCounter = peripheral.services.count;
        
        for (CBService *service in peripheral.services)
        {
            [peripheral discoverCharacteristics:nil forService:service];
        }
    }
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error
{
    if (error)
    {
        NSLog(@">> peripheral:didDiscoverCharacteristicsForService:error => %@", error);
        [self internalDisconnect:SGBleConnectionEventReasonUnknown];
    }
    else
    {
        NSAssert(_discoveringServicesCounter > 0, @"Discovered characteristics for more services than expected");
        --_discoveringServicesCounter;
        if (_discoveringServicesCounter == 0)
        {
            // Notify connected when characteristics are discovered for all services
            // We must assume that each service will at least report one characteristic
            [self qReportRequestResult:error forRequestType:SGBleRequestTypeConnect];
            [self qNotifyConnectionEvent:SGBleConnectionEventReady reason:SGBleConnectionEventReasonSuccess];
        }
    }
}

// - (void)peripheral:(CBPeripheral *)peripheral didDiscoverDescriptorsForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
// {
// }

- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
    if (error)
    {
        NSLog(@">> peripheral:didUpdateValueForCharacteristic:error => %@", error);
    }
    
    if (_valueReadHandler)
    {
        // The value read handler is meant to be used just once
        SGBleCharacteristicValueEventHandler valueReadHandler = _valueReadHandler;
        _valueReadHandler = nil;

        // And report result using the handler
        [self qReportRequestResult:error forRequestType:SGBleRequestTypeReadValue customNotifier:^(NSError *error) {
            valueReadHandler(self, characteristic, error);
        }];
    }
    
    SGBleCharacteristicValueEventHandler valueChangedHandler = [_valueChangedHandlers objectForKey:characteristic];
    if (valueChangedHandler)
    {
        valueChangedHandler(self, characteristic, error);
    }
}

// - (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error
// {
// }

- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
    if (error)
    {
        NSLog(@">> peripheral:didWriteValueForCharacteristic:error => %@", error);
    }
    
    [self qReportRequestResult:error forRequestType:SGBleRequestTypeWriteValue];
}

// - (void)peripheral:(CBPeripheral *)peripheral didWriteValueForDescriptor:(CBDescriptor *)descriptor error:(NSError *)error
// {
// }

// - (void)peripheralIsReadyToSendWriteWithoutResponse:(CBPeripheral *)peripheral
// {
// }

- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
    if (error)
    {
        NSLog(@">> peripheral:didUpdateNotificationStateForCharacteristic:error => %@", error);
    }
    
    [self qReportRequestResult:error forRequestType:SGBleRequestTypeSetNotifyValue];
}

- (void)peripheral:(CBPeripheral *)peripheral didReadRSSI:(NSNumber *)RSSI error:(NSError *)error
{
    if (error)
    {
        NSLog(@">> peripheral:didReadRSSI:error => %@", error);
    }
    
    _rssi = RSSI.intValue;
    [self qReportRequestResult:error forRequestType:SGBleRequestTypeReadRssi];
}

// - (void)peripheralDidUpdateName:(CBPeripheral *)peripheral
// {
// }

@end

/**
 * @file
 * @brief Helper functions for bridge.
 */

#ifndef SGBridgeUtils_h
#define SGBridgeUtils_h

#import <CoreBluetooth/CoreBluetooth.h>
#import "SGBlePeripheralQueue.h"
#include <cstdint>

inline NSString *toString(NSUUID *uuid)
{
    return uuid.UUIDString.lowercaseString;
}

inline NSString *toString(CBUUID *uuid)
{
    NSString *str = uuid.UUIDString.lowercaseString;
    NSUInteger len = str.length;
    if (len == 4)
    {
        // Most common case: 16-bit UUID
        str = [NSString stringWithFormat:@"0000%@-0000-1000-8000-00805f9b34fb", str];
    }
    else if (len <= 8)
    {
        str = [NSString stringWithFormat:@"%@-0000-1000-8000-00805f9b34fb", str];
        len = str.length;
        if (len < 36)
        {
            str = [[@"00000000" substringFromIndex:8 - 36 + len] stringByAppendingString:str];
        }
    }
    return str;
}

inline NSString *getPeripheralId(CBPeripheral *peripheral)
{
    return toString(peripheral.identifier);
}

// Convert c-string to array of CBUUID
inline NSArray<CBUUID *> *toCBUUIDArray(NSString *serviceUuids)
{
    NSArray<NSString *> *servicesList = [serviceUuids componentsSeparatedByString:@","];
    if (servicesList.count > 0)
    {
        NSMutableArray<CBUUID *> *arr = [NSMutableArray<CBUUID *> arrayWithCapacity:servicesList.count];
        for (NSString *uuidStr in servicesList)
        {
            if (uuidStr.length)
            {
                // Convertion to CBUUID throws if given an invalid string
                CBUUID *uuid = [CBUUID UUIDWithString:uuidStr];
                if (uuid != nil)
                {
                    [arr addObject:uuid];
                }
            }
        }
        return arr;
    }
    return nil;
}

inline NSString *toUuidsString(NSArray<CBAttribute *> *attributes)
{
    NSMutableString *uuids = [[NSMutableString alloc] initWithCapacity:36 * attributes.count]; // A UUID has 36 characters including the dashes
    for (CBService *attr in attributes)
    {
        if (uuids.length > 0)
        {
            [uuids appendString:@","];
        }
        [uuids appendString:toString(attr.UUID)];
    }
    return uuids;
}

inline NSDictionary *peripheralToDict(CBPeripheral* peripheral)
{
    return @{
        @"systemId": toString(peripheral.identifier),
        @"address": @0,
        @"name": peripheral.name ? peripheral.name : @"",
    };
}

inline NSDictionary *peripheralToDict(SGBlePeripheralQueue* peripheral)
{
    return peripheralToDict(peripheral.peripheral);
}

inline NSArray<NSNumber *> *bytesToArr(const void *bytes, NSUInteger start, NSUInteger end)
{
    NSMutableArray<NSNumber *> *data = [[NSMutableArray alloc] initWithCapacity:end - start];
    for (NSUInteger i = start; i < end; i++)
    {
        [data addObject:@(((std::uint8_t *)bytes)[i])];
    }
    return data;
}

inline NSArray<NSNumber *> *dataToArr(NSData *data)
{
    return bytesToArr(data.bytes, 0, data.length);
}

inline NSDictionary *advertisementToDict(NSDictionary<NSString *,id> *advertisementData, NSNumber *rssi)
{
    // Get the different bits of advertising data
    NSData *manufacturerData = advertisementData[CBAdvertisementDataManufacturerDataKey];
    NSDictionary<CBUUID *, NSData *> *serviceData = advertisementData[CBAdvertisementDataServiceDataKey];
    NSArray<CBUUID *> *serviceUUIDs = advertisementData[CBAdvertisementDataServiceUUIDsKey];
    NSNumber *txPowerLevel = advertisementData[CBAdvertisementDataTxPowerLevelKey];
    NSNumber *isConnectable = advertisementData[CBAdvertisementDataIsConnectable];
    NSArray<CBUUID *> *solicitedServiceUUIDs = advertisementData[CBAdvertisementDataSolicitedServiceUUIDsKey];
    NSTimeInterval timestamp = [[NSDate date] timeIntervalSince1970];

    NSMutableDictionary<NSString *, id> *dict = [NSMutableDictionary dictionary];
    [dict setValue:@([isConnectable boolValue]) forKey:@"isConnectable"];
    [dict setValue:rssi forKey:@"rssi"];
    [dict setValue:txPowerLevel forKey:@"txPowerLevel"];
    [dict setValue:@(timestamp * 1000) forKey:@"timestamp"];

    if (serviceUUIDs.count)
    {
        NSMutableArray<NSString *> *services = [NSMutableArray new];
        [dict setValue:services forKey:@"services"];
        // Iterate services
        NSUInteger len = serviceUUIDs.count;
        for (NSUInteger i = 0; i < len; i++)
        {
            [services addObject:toString(serviceUUIDs[i])];
        }
    }
    
    if (solicitedServiceUUIDs.count)
    {
        NSMutableArray<NSString *> *services = [NSMutableArray new];
        [dict setValue:services forKey:@"solicitedServices"];
        // Iterate services
        NSUInteger len = solicitedServiceUUIDs.count;
        for (NSUInteger i = 0; i < len; i++)
        {
            [services addObject:toString(solicitedServiceUUIDs[i])];
        }
    }
    
    if (manufacturerData.length >= 2)
    {
        auto *bytes = (const std::uint8_t *)manufacturerData.bytes;
        // Company id
        uint16_t companyId = bytes[1] | ((uint16_t)bytes[0] << 8);
        // Update dict
        [dict setValue:@[@{
            @"companyId": @(companyId),
            @"data": bytesToArr(bytes, 2, manufacturerData.length),
        }] forKey:@"manufacturersData"];
    }
    
    if (serviceData.count)
    {
        NSMutableArray<NSDictionary *> *servDataDict = [NSMutableArray new];
        [dict setValue:servDataDict forKey:@"servicesData"];
        // Iterate services
        for (CBUUID *uuid in serviceData)
        {
            NSData *dataSrc = [serviceData objectForKey:uuid];
            [servDataDict addObject:@{
                @"service": toString(uuid),
                @"data": bytesToArr(dataSrc.bytes, 0, dataSrc.length),
            }];
        }
    }
    
    return dict;
}

inline NSData* toData(NSArray<NSNumber *> *array)
{
    NSInteger length = array.count;
    NSMutableData *data = [[NSMutableData alloc] initWithLength:length];
    auto *bytes = (std::uint8_t *)data.bytes;
    for (NSInteger i = 0; i < length; ++i)
    {
        *bytes = [[array objectAtIndex:i] unsignedCharValue];
        ++bytes;
    }
    return data;
}

inline NSDictionary *characteristicToDict(CBCharacteristic *characteristic, NSNumber *instanceIndex)
{
    return @{
        @"serviceUuid" : toString(characteristic.service.UUID),
        @"uuid" : toString(characteristic.UUID),
        @"instanceIndex" : instanceIndex,
    };
}

#endif /* SGBridgeUtils_h */

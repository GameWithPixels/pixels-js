/**
 * @file
 * @brief A few internal functions.
 */

#ifndef SGBleUtils_h
#define SGBleUtils_h

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>

// Gets the serial queue used to run all BLE operations
dispatch_queue_t sgBleGetSerialQueue();

#endif /* SGBleUtils_h */

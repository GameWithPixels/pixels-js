/**
 * @file
 * @brief Library error codes.
 */

#ifndef SGBleErrors_h
#define SGBleErrors_h

#import <Foundation/Foundation.h>

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
    
    /// Bluetooth not in proper state to execute request.
    SGBleErrorBluetoothState,
    
    /// Peripheral request got canceled.
    SGBleErrorRequestCanceled,
    
    /// Peripheral got disconnected while executing request.
    SGBleErrorPeripheralDisconnected,
};

/**
 * @brief This library error domain.
 * @ingroup Apple_Objective-C
 */
extern NSErrorDomain SGBleErrorDomain;

/**
 * @brief Application out of memory.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleOutOfMemoryError;

/**
 * @brief Call not implemented.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleNotImplementedError;

/**
 * @brief Peripheral request was given one or more invalid parameters.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleInvalidParameterError;

/**
 * @brief Bluetooth not in proper state to execute request.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleBluetoothStateError;

/**
 * @brief Peripheral request got canceled.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleRequestCanceledError;

/**
 * @brief Peripheral got disconnected.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleDisconnectedError;

/**
 * @brief No know peripheral for the given identifier.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleUnknownPeripheralError;

#endif /* SGBleErrors_h */

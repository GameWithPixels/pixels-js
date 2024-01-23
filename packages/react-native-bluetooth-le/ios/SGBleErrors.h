/**
 * @file
 * @brief Library error codes.
 */

#ifndef SGBleErrors_h
#define SGBleErrors_h

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
 * @brief Bluetooth or peripheral not in proper state to execute request.
 * @ingroup Apple_Objective-C
 */
extern NSError *SGBleInvalidStateError;

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

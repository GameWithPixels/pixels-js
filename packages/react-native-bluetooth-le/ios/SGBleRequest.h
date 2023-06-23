/**
 * @file
 * @brief Internal types for representing a BLE request.
 */

#ifndef SGBleRequest_h
#define SGBleRequest_h

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @brief Internal type, list the Bluetooth operations supported by SGBleRequest.
 * @ingroup Apple_Objective-C
 */
typedef NS_ENUM(NSInteger, SGBleRequestType)
{
    SGBleRequestTypeUnknown = 0,
    SGBleRequestTypeConnect,
    SGBleRequestTypeDisconnect,
    SGBleRequestTypeReadRssi,
    SGBleRequestTypeReadValue,
    SGBleRequestTypeWriteValue,
    SGBleRequestTypeSetNotifyValue,
};

/**
 * @brief Internal type, runs the Bluetooth operation associated with a SGBleRequest object.
 * @ingroup Apple_Objective-C
 */
typedef NSError * _Nullable (^SGBleRequestExecuteHandler)();

/**
 * @brief Internal type, completion handler for operations associated with a SGBleRequest object.
 * @ingroup Apple_Objective-C
 */
typedef void (^SGBleRequestCompletionHandler)(NSError * _Nullable error);

/**
 * @brief Internal type, represents a Bluetooth operation to be performed on a
 *        <a href="https://developer.apple.com/documentation/corebluetooth/cbperipheral">
 *        peripheral</a>. Used by SGBlePeripheralQueue.
 * @ingroup Apple_Objective-C
 */
@interface SGBleRequest : NSObject
//! @cond
{
    SGBleRequestType _type;
    SGBleRequestExecuteHandler _executeHandler;
    SGBleRequestCompletionHandler _completionHandler;
}

// Property getters
- (SGBleRequestType)type;
//! @endcond

/**
 * @brief Gets the type of request associated with this instance.
 */
@property(readonly, getter=type) SGBleRequestType type;

/**
 * @brief Initializes a SGBleRequest instance with a specific Bluetooth operation to run.
 * 
 * @param requestType The type of request associated with this instance.
 * @param executeHandler The operation to run, returns an error if it has failed to be run.
 * @param completionHandler Called when the operation has completed (successfully or not), may be nil.
 */
- (instancetype)initWithRequestType:(SGBleRequestType)requestType executeHandler:(SGBleRequestExecuteHandler)executeHandler  completionHandler: (nullable SGBleRequestCompletionHandler)completionHandler;

/**
 * @brief Execute the associated request.
 */
- (nullable NSError *)execute;

/**
 * @brief Called by the execution block to notify this instance of the request outcome.
 */
- (void)notifyResult:(nullable NSError *)error;

/**
 * @brief Gets the string version of a SGBleRequestType value.
 */
+ (NSString *)requestTypeToString:(SGBleRequestType)typeSGBleRequest;

@end

NS_ASSUME_NONNULL_END

#endif /* SGBleRequest_h */

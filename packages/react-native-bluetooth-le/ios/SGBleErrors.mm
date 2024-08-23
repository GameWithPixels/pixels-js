#import "SGBleErrors.h"

NSErrorDomain SGBleErrorDomain = [NSString stringWithFormat:@"%@.sgBLE.errorDomain", [[NSBundle mainBundle] bundleIdentifier]];

NSError *SGBleOutOfMemoryError = [NSError errorWithDomain:SGBleErrorDomain
                                                     code:SGBleErrorOutOfMemory
                                                 userInfo:@{ NSLocalizedDescriptionKey: @"Out of memory" }];

NSError *SGBleInvalidArgumentError = [NSError errorWithDomain:SGBleErrorDomain
                                                         code:SGBleErrorInvalidParameter
                                                     userInfo:@{ NSLocalizedDescriptionKey: @"Invalid argument" }];

NSError *SGBleBluetoothStateError = [NSError errorWithDomain:SGBleErrorDomain
                                                        code:SGBleErrorBluetoothState
                                                    userInfo:@{ NSLocalizedDescriptionKey: @"Bluetooth not in powered on state" }];

NSError *SGBleRequestCanceledError = [NSError errorWithDomain:SGBleErrorDomain
                                                         code:SGBleErrorRequestCanceled
                                                     userInfo:@{ NSLocalizedDescriptionKey: @"Request canceled" }];

NSError *SGBleDisconnectedError = [NSError errorWithDomain:SGBleErrorDomain
                                                      code:SGBleErrorPeripheralDisconnected
                                                  userInfo:@{ NSLocalizedDescriptionKey: @"Peripheral disconnected" }];

NSError *SGBleUnknownPeripheralError = [NSError errorWithDomain:SGBleErrorDomain
                                                           code:SGBleErrorPeripheralDisconnected
                                                       userInfo:@{ NSLocalizedDescriptionKey: @"Unknown peripheral" }];

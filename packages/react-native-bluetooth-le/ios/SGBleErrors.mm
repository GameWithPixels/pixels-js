#import "SGBleErrors.h"

NSErrorDomain SGBleErrorDomain = [NSString stringWithFormat:@"%@.sgBLE.errorDomain", [[NSBundle mainBundle] bundleIdentifier]];

NSError *SGBleOutOfMemoryError = [NSError errorWithDomain:SGBleErrorDomain
                                                     code:SGBleErrorOutOfMemory
                                                 userInfo:@{ NSLocalizedDescriptionKey: @"Out of memory" }];

NSError *SGBleNotImplementedError = [NSError errorWithDomain:SGBleErrorDomain
                                                        code:SGBleErrorNotImplemented
                                                    userInfo:@{ NSLocalizedDescriptionKey: @"Call not implemented" }];

NSError *SGBleInvalidParameterError = [NSError errorWithDomain:SGBleErrorDomain
                                                          code:SGBleErrorInvalidParameter
                                                      userInfo:@{ NSLocalizedDescriptionKey: @"Invalid parameter" }];

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

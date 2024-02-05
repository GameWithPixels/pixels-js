#import "SGBleErrors.h"

static NSErrorDomain errorDomain = [NSString stringWithFormat:@"%@.sgBLE.errorDomain", [[NSBundle mainBundle] bundleIdentifier]];

NSError *SGBleOutOfMemoryError = [NSError errorWithDomain:errorDomain
                                                     code:SGBleErrorOutOfMemory
                                                 userInfo:@{ NSLocalizedDescriptionKey: @"Out of memory" }];

NSError *SGBleNotImplementedError = [NSError errorWithDomain:errorDomain
                                                        code:SGBleErrorNotImplemented
                                                    userInfo:@{ NSLocalizedDescriptionKey: @"Call not implemented" }];

NSError *SGBleInvalidParameterError = [NSError errorWithDomain:errorDomain
                                                          code:SGBleErrorInvalidParameter
                                                      userInfo:@{ NSLocalizedDescriptionKey: @"Invalid parameter" }];

NSError *SGBleBluetoothStateError = [NSError errorWithDomain:errorDomain
                                                        code:SGBleErrorBluetoothState
                                                    userInfo:@{ NSLocalizedDescriptionKey: @"Bluetooth not in powered on state" }];

NSError *SGBleRequestCanceledError = [NSError errorWithDomain:errorDomain
                                                         code:SGBleErrorRequestCanceled
                                                     userInfo:@{ NSLocalizedDescriptionKey: @"Request canceled" }];

NSError *SGBleDisconnectedError = [NSError errorWithDomain:errorDomain
                                                      code:SGBleErrorPeripheralDisconnected
                                                  userInfo:@{ NSLocalizedDescriptionKey: @"Peripheral disconnected" }];

NSError *SGBleUnknownPeripheralError = [NSError errorWithDomain:errorDomain
                                                           code:SGBleErrorPeripheralDisconnected
                                                       userInfo:@{ NSLocalizedDescriptionKey: @"Unknown peripheral" }];

#import "SGBleErrors.h"
#import "SGBleTypes.h"

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

NSError *SGBleInvalidStateError = [NSError errorWithDomain:errorDomain
                                                      code:SGBleErrorInvalidState
                                                  userInfo:@{ NSLocalizedDescriptionKey: @"Invalid state" }];

NSError *SGBleRequestCanceledError = [NSError errorWithDomain:errorDomain
                                                         code:SGBleErrorRequestCanceled
                                                     userInfo:@{ NSLocalizedDescriptionKey: @"Request canceled" }];

NSError *SGBleDisconnectedError = [NSError errorWithDomain:errorDomain
                                                      code:SGBleErrorPeripheralDisconnected
                                                  userInfo:@{ NSLocalizedDescriptionKey: @"Peripheral disconnected" }];

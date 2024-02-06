#import "SGBleRequest.h"

@implementation SGBleRequest

- (SGBleRequestType)type
{
    return _type;
}

- (instancetype)initWithRequestType:(SGBleRequestType)requestType executeHandler:(SGBleRequestExecuteHandler)executeHandler  completionHandler:(SGBleRequestCompletionHandler)completionHandler
{
    if (self = [super init])
    {
        if (!executeHandler)
        {
            return nil;
        }

        _type = requestType;
        _executeHandler = executeHandler;
        _completionHandler = completionHandler;
    }
    return self;
}

- (NSError *)execute
{
    return _executeHandler();
}

- (void)notifyResult:(NSError *)error
{
    if (_completionHandler)
    {
        _completionHandler(error);
    }
}

+ (NSString *)requestTypeToString:(SGBleRequestType)type
{
    switch (type)
    {
        case SGBleRequestTypeConnect: return @"Connect";
        case SGBleRequestTypeDisconnect: return @"Disconnect";
        case SGBleRequestTypeReadRssi: return @"ReadRssi";
        case SGBleRequestTypeReadValue: return @"ReadValue";
        case SGBleRequestTypeWriteValue: return @"WriteValue";
        case SGBleRequestTypeSetNotifyValue: return @"SetNotifyValue";
        default: return @"Unknwown";
    }
}

@end

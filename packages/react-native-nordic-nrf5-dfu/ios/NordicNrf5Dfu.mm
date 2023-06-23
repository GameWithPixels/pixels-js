#import "NordicNrf5Dfu.h"

static NSString *stateEventName = @"state";
static NSString *progressEventName = @"progress";

// Store some of arguments given to startDfu for later use
@interface StartDfuInfo : NSObject
{
    NSString *_identifier;
    RCTPromiseResolveBlock _resolver;
    RCTPromiseRejectBlock _rejecter;
}

@property(readonly, getter=identifier) NSString *identifier;

- (void)setInfo:(NSString *)identifier
       resolver:(RCTPromiseResolveBlock)resolve
       rejecter:(RCTPromiseRejectBlock)reject;
- (void)clear;

@end

@implementation StartDfuInfo

- (NSString *)identifier
{
    return _identifier;
}

// Lock object before calling this method
- (void)setInfo:(NSString *)identifier
       resolver:(RCTPromiseResolveBlock)resolve
       rejecter:(RCTPromiseRejectBlock)reject
{
    _identifier = identifier;
    _resolver = resolve;
    _rejecter = reject;
}

// Lock object before calling this method
- (void)getInfo:(NSString **)identifier
       resolver:(RCTPromiseResolveBlock*)resolve
       rejecter:(RCTPromiseRejectBlock*)reject
{
    *identifier = _identifier;
    *resolve = _resolver;
    *reject = _rejecter;
}

// Lock object before calling this method
- (void)clear
{
    _identifier = nil;
    _resolver = nil;
    _rejecter = nil;
}

@end

@implementation NordicNrf5Dfu
{
    StartDfuInfo *_info;
    DFUServiceController *_controller;
    // Flag telling us if there's any listener to our JavaScript events
    bool _hasListeners;
}

RCT_EXPORT_MODULE()

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeNordicNrf5DfuSpecJSI>(params);
}
#endif

- (id)init
{
    if (self = [super init])
    {
        _info = [[StartDfuInfo alloc] init];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

-(void)startObserving
{
    _hasListeners = YES;
}

-(void)stopObserving
{
    _hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[
        stateEventName,
        progressEventName,
    ];
}

-(void)bridgeReloading
{
    // TODO
}

RCT_EXPORT_METHOD(startDfu:(NSString *)targetIdentifier
                  firmwarePath:(NSString *)firmwarePath
                  disableButtonlessServiceInSecureDfu:(BOOL)disableButtonlessServiceInSecureDfu
                  forceDfu:(BOOL)forceDfu
                  forceScanningForNewAddressInLegacyDfu:(BOOL)forceScanningForNewAddressInLegacyDfu
                  alternativeAdvertisingName:(NSString *)alternativeAdvertisingName
                  connectionTimeout:(int)connectionTimeout
                  prepareDataObjectDelay:(int)prepareDataObjectDelay
                  disableResume:(BOOL)disableResume
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSURL * url = [NSURL URLWithString:firmwarePath];
    NSError *error;
    DFUFirmware *fw = [[DFUFirmware alloc] initWithUrlToZipFile:url error:&error];
    if (!error)
    {
        dispatch_queue_t queue = dispatch_get_main_queue();
        DFUServiceInitiator *initiator = [[DFUServiceInitiator alloc] initWithQueue:queue
                                                                      delegateQueue:queue
                                                                      progressQueue:queue
                                                                        loggerQueue:queue
                                                              centralManagerOptions:nil];
        (void)[initiator withFirmware:fw];
        initiator.delegate = self;
        initiator.progressDelegate = self;
        initiator.forceDfu = forceDfu;
        initiator.forceScanningForNewAddressInLegacyDfu = forceScanningForNewAddressInLegacyDfu;
        if (connectionTimeout > 0)
        {
            initiator.connectionTimeout = connectionTimeout;
        }
        if (prepareDataObjectDelay > 0)
        {
            initiator.dataObjectPreparationDelay = prepareDataObjectDelay;
        }
        if (alternativeAdvertisingName.length > 0)
        {
            initiator.alternativeAdvertisingName = alternativeAdvertisingName;
        }
        initiator.enableUnsafeExperimentalButtonlessServiceInSecureDfu = !disableButtonlessServiceInSecureDfu;
        initiator.disableResume = disableResume;
        
        NSUUID *identifier = nil;
        NSString *errorCode = nil;
        NSString *errorMessage = nil;
        @synchronized (_info)
        {
            if (!_info.identifier)
            {
                identifier = [[NSUUID alloc] initWithUUIDString:targetIdentifier];
                if (identifier)
                {
                    [_info setInfo:targetIdentifier resolver:resolve rejecter:reject];
                }
                else
                {
                    errorCode = @"DFU_INVALID_IDENTIFIER";
                    errorMessage = @"The given peripheral identifier is not a valid UUID";
                }
            }
            else
            {
                errorCode = @"DFU_BUSY";
                errorMessage = @"There is already an on-going DFU";
            }
        }
        if (!errorCode)
        {
            assert(identifier);
            _controller = [initiator startWithTargetWithIdentifier:identifier];
            if (!_controller)
            {
                // A controller will always be returned if the firmware file has already
                // been set, so this error should never happen
                @synchronized (_info)
                {
                    [_info clear];
                }
                errorCode = @"DFU_START_FAILED";
                errorMessage = @"Failed to start DFU for an unknown reason";
            }
        }
        
        if (errorCode)
        {
            reject(errorCode, errorMessage, nil);
        }
    }
    else
    {
        reject(@"DFU_INVALID_URI", error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(abortDfu)
{
    (void)[_controller abort];
}

- (void)dfuStateDidChangeTo:(DFUState)state
{
    NSString *identifier = nil;
    RCTPromiseResolveBlock resolve = nil;
    RCTPromiseRejectBlock reject = nil;
    @synchronized (_info)
    {
        [_info getInfo:&identifier resolver:&resolve rejecter:&reject];
        if (state == DFUStateCompleted || state == DFUStateAborted)
        {
            [_info clear];
        }
    }
    if (identifier)
    {
        if (_hasListeners)
        {
            [self sendEventWithName:stateEventName body:@{
                @"targetIdentifier": identifier,
                @"state": [self stateToString:state],
            }];
        }
        if (state == DFUStateCompleted && resolve)
        {
           resolve(nil);
        }
        if (state == DFUStateAborted && reject)
        {
            reject(@"DFU_ABORTED", @"DFU aborted", nil);
        }
    }
}

- (void)dfuError:(DFUError)error didOccurWithMessage:(NSString *)message
{
    NSString *identifier = nil;
    RCTPromiseResolveBlock resolve = nil;
    RCTPromiseRejectBlock reject = nil;
    @synchronized (_info)
    {
        [_info getInfo:&identifier resolver:&resolve rejecter:&reject];
        [_info clear];
    }
    if (identifier)
    {
        if (_hasListeners)
        {
            [self sendEventWithName:stateEventName body:@{
                @"targetIdentifier": identifier,
                @"state": [self stateToString:DFUStateAborted],
            }];
        }
        reject([self errorToString:error], message, nil);
    }
}

- (void)dfuProgressDidChangeFor:(NSInteger)part outOf:(NSInteger)totalParts to:(NSInteger)progress currentSpeedBytesPerSecond:(double)currentSpeedBytesPerSecond avgSpeedBytesPerSecond:(double)avgSpeedBytesPerSecond
{
    NSString *identifier = _info.identifier;
    if (_hasListeners && identifier)
    {
        [self sendEventWithName:progressEventName body:@{
            @"targetIdentifier": identifier,
            @"progress": @(progress),
        }];
    }
}

- (NSString *)stateToString:(DFUState)state
{
  switch (state)
  {
    case DFUStateAborted:
      return @"dfuAborted";
    case DFUStateStarting:
      return @"dfuStarting";
    case DFUStateCompleted:
      return @"dfuCompleted";
    case DFUStateUploading:
      return @"dfuUploading";
    case DFUStateConnecting:
      return @"deviceConnecting";
    case DFUStateValidating:
      return @"firmwareValidating";
    case DFUStateDisconnecting:
      return @"deviceDisconnecting";
    case DFUStateEnablingDfuMode:
      return @"enablingDfuMode";
    default:
      return @"unknown";
  }
}

- (NSString *)errorToString:(DFUError)error
{
  switch(error)
  {
    case DFUErrorCrcError:
      return @"DFUErrorCrcError";
    case DFUErrorBytesLost:
      return @"DFUErrorBytesLost";
    case DFUErrorFileInvalid:
      return @"DFUErrorFileInvalid";
    case DFUErrorFailedToConnect:
      return @"DFUErrorFailedToConnect";
    case DFUErrorFileNotSpecified:
      return @"DFUErrorFileNotSpecified";
    case DFUErrorBluetoothDisabled:
      return @"DFUErrorBluetoothDisabled";
    case DFUErrorDeviceDisconnected:
      return @"DFUErrorDeviceDisconnected";
    case DFUErrorDeviceNotSupported:
      return @"DFUErrorDeviceNotSupported";
    case DFUErrorInitPacketRequired:
      return @"DFUErrorInitPacketRequired";
    case DFUErrorUnsupportedResponse:
      return @"DFUErrorUnsupportedResponse";
    case DFUErrorReadingVersionFailed:
      return @"DFUErrorReadingVersionFailed";
    case DFUErrorRemoteLegacyDFUSuccess:
      return @"DFUErrorRemoteLegacyDFUSuccess";
    case DFUErrorRemoteSecureDFUSuccess:
      return @"DFUErrorRemoteSecureDFUSuccess";
    case DFUErrorServiceDiscoveryFailed:
      return @"DFUErrorServiceDiscoveryFailed";
    case DFUErrorRemoteLegacyDFUCrcError:
      return @"DFUErrorRemoteLegacyDFUCrcError";
    case DFUErrorEnablingControlPointFailed:
      return @"DFUErrorEnablingControlPointFailed";
    case DFUErrorExtendedInitPacketRequired:
      return @"DFUErrorExtendedInitPacketRequired";
    case DFUErrorReceivingNotificationFailed:
      return @"DFUErrorReceivingNotificationFailed";
    case DFUErrorRemoteButtonlessDFUSuccess:
      return @"DFUErrorRemoteButtonlessDFUSuccess";
    case DFUErrorRemoteLegacyDFUInvalidState:
      return @"DFUErrorRemoteLegacyDFUInvalidState";
    case DFUErrorRemoteLegacyDFUNotSupported:
      return @"DFUErrorRemoteLegacyDFUNotSupported";
    case DFUErrorWritingCharacteristicFailed:
      return @"DFUErrorWritingCharacteristicFailed";
    case DFUErrorRemoteSecureDFUExtendedError:
      return @"DFUErrorRemoteSecureDFUExtendedError";
    case DFUErrorRemoteSecureDFUInvalidObject:
      return @"DFUErrorRemoteSecureDFUInvalidObject";
    case DFUErrorRemoteLegacyDFUOperationFailed:
      return @"DFUErrorRemoteLegacyDFUOperationFailed";
    case DFUErrorRemoteSecureDFUOperationFailed:
      return @"DFUErrorRemoteSecureDFUOperationFailed";
    case DFUErrorRemoteSecureDFUUnsupportedType:
      return @"DFUErrorRemoteSecureDFUUnsupportedType";
    case DFUErrorRemoteLegacyDFUDataExceedsLimit:
      return @"DFUErrorRemoteLegacyDFUDataExceedsLimit";
    case DFUErrorRemoteSecureDFUInvalidParameter:
      return @"DFUErrorRemoteSecureDFUInvalidParameter";
    case DFUErrorRemoteSecureDFUSignatureMismatch:
      return @"DFUErrorRemoteSecureDFUSignatureMismatch";
    case DFUErrorRemoteSecureDFUOpCodeNotSupported:
      return @"DFUErrorRemoteSecureDFUOpCodeNotSupported";
    case DFUErrorRemoteButtonlessDFUOperationFailed:
      return @"DFUErrorRemoteButtonlessDFUOperationFailed";
    case DFUErrorRemoteSecureDFUInsufficientResources:
      return @"DFUErrorRemoteSecureDFUInsufficientResources";
    case DFUErrorRemoteSecureDFUOperationNotPermitted:
      return @"DFUErrorRemoteSecureDFUOperationNotPermitted";
    case DFUErrorRemoteButtonlessDFUOpCodeNotSupported:
      return @"DFUErrorRemoteButtonlessDFUOpCodeNotSupported";
    case DFUErrorRemoteExperimentalButtonlessDFUSuccess:
      return @"DFUErrorRemoteExperimentalButtonlessDFUSuccess";
    case DFUErrorRemoteExperimentalButtonlessDFUOperationFailed:
      return @"DFUErrorRemoteExperimentalButtonlessDFUOperationFailed";
    case DFUErrorRemoteExperimentalButtonlessDFUOpCodeNotSupported:
      return @"DFUErrorRemoteExperimentalButtonlessDFUOpCodeNotSupported";
    default:
      return @"DFU_UNKNOWN_ERROR";
  }
}

@end

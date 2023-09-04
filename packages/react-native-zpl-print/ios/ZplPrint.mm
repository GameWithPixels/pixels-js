#import "ZplPrint.h"

@implementation ZplPrint
RCT_EXPORT_MODULE()

// Example method
// See // https://reactnative.dev/docs/native-modules-ios
RCT_REMAP_METHOD(printHtml,
                 printerName:(NSString *)printerName
                 html:(NSString *)html
                 imageWidth:(double)imageWidth
                 enableJs:(BOOL)enableJs
                 blacknessThreshold:(double)blacknessThreshold
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
    reject(@"unsupported", @"unsupported", nil);
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeZplPrintSpecJSI>(params);
}
#endif

@end

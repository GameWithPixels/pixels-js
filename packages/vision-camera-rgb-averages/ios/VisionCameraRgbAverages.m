#import "VisionCameraRgbAverages.h"
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>

@interface QRCodeFrameProcessorPlugin : NSObject
@end

@implementation QRCodeFrameProcessorPlugin

static inline id getImageRgbAverages(Frame* frame, NSArray* args) {
  CMSampleBufferRef buffer = frame.buffer;
  UIImageOrientation orientation = frame.orientation;
  // code goes here
  return @[];
}

VISION_EXPORT_FRAME_PROCESSOR(getImageRgbAverages)

@end

@implementation VisionCameraRgbAverages

RCT_EXPORT_MODULE()

// Example method
// See // https://reactnative.dev/docs/native-modules-ios
RCT_REMAP_METHOD(multiply,
                 multiplyWithA:(nonnull NSNumber*)a withB:(nonnull NSNumber*)b
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  NSNumber *result = @([a floatValue] * [b floatValue]);

  resolve(result);
}

@end

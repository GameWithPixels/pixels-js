#ifdef __cplusplus
#import "systemic-games-vision-camera-rgb-averages.h"
#endif

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNVisionCameraRgbAveragesSpec.h"

@interface VisionCameraRgbAverages : NSObject <NativeVisionCameraRgbAveragesSpec>
#else
#import <React/RCTBridgeModule.h>

@interface VisionCameraRgbAverages : NSObject <RCTBridgeModule>
#endif

@end

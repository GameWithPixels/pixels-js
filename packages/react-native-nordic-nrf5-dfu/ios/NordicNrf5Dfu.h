@import iOSDFULibrary; // Require -fcxx-modules compiler flag

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNNordicNrf5DfuSpec.h"

@interface NordicNrf5Dfu : NSObject <NativeNordicNrf5DfuSpec, DFUServiceDelegate, DFUProgressDelegate>
#else
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface NordicNrf5Dfu : RCTEventEmitter <RCTBridgeModule, DFUServiceDelegate, DFUProgressDelegate>
#endif

@end


#ifdef RCT_NEW_ARCH_ENABLED
#import "RNZplPrintSpec.h"

@interface ZplPrint : NSObject <NativeZplPrintSpec>
#else
#import <React/RCTBridgeModule.h>

@interface ZplPrint : NSObject <RCTBridgeModule>
#endif

@end

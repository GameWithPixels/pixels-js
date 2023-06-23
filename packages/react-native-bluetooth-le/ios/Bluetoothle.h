#ifdef RCT_NEW_ARCH_ENABLED
#import "RNBluetoothLeSpec.h"

@interface BluetoothLe : NSObject <NativeBluetoothLeSpec>
#else
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface BluetoothLe : RCTEventEmitter <RCTBridgeModule>
#endif

@end

#import "SGBleUtils.h"
#import "SGBleTypes.h"

dispatch_queue_t sgBleGetSerialQueue()
{
    static dispatch_queue_t queue =
        dispatch_queue_create("com.systemic.pixels.ble", DISPATCH_QUEUE_SERIAL);
    return queue;
}

#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>
#import <Endian.h>

@interface QRCodeFrameProcessorPlugin : NSObject
@end

@implementation QRCodeFrameProcessorPlugin

static id processImage(void *baseAddress, CVImageBufferRef imageBuffer, int subSamplingX, int subSamplingY, bool writeRbgImager, bool writeYuvPlanes)
{
    NSUInteger planeCount = CVPixelBufferGetPlaneCount(imageBuffer);
    OSType type = CVPixelBufferGetPixelFormatType(imageBuffer);

    // Check image type = 420v
    if (type != *((OSType*)"v024"))
    {
        return @"Image format must be YCbCrBiPlanar";
    }
    // Check number of planes
    if (planeCount != 2)
    {
        return @"Image data must have exactly two planes";
    }
    if (subSamplingX <= 0)
    {
        return @"subSampling value must be 1 or greater";
    }
    if (subSamplingY <= 0)
    {
        return @"subSampling value must be 1 or greater";
    }

    // Track how long it takes to process the image
    NSDate *startTime = [NSDate date];
    
    // Get image info
    NSUInteger width = CVPixelBufferGetWidth(imageBuffer);
    NSUInteger height = CVPixelBufferGetHeight(imageBuffer);
    NSUInteger plane0Width = CVPixelBufferGetWidthOfPlane(imageBuffer, 0);
    NSUInteger plane0BytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 0);
    NSUInteger plane1BytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 1);

    uint8_t *yBuffer = baseAddress;
    uint8_t *uBuffer = baseAddress + plane0Width;
    uint8_t *vBuffer = baseAddress + plane0Width + 1;

    NSUInteger yRowStride = plane0BytesPerRow * subSamplingY;
    NSUInteger yPixelStride = subSamplingX;
    NSUInteger uvRowStride = plane1BytesPerRow * subSamplingY / 2;
    NSUInteger uvPixelStride = subSamplingX / 2;

    // U/V Values are sub-sampled i.e. each pixel in U/V channel in a
    // YUV_420 image act as chroma value for 4 neighboring pixels
    NSUInteger uvIndex = 0, uvIndexRowStart = 0;

    NSUInteger pixelsCount = (width / subSamplingX) * (height / subSamplingY);
    //final byte[] argb = writeRgbImage ? getArgbBuffer(pixelsCount * 4) : null;
    NSUInteger argbIndex = 0;

    double rSum = 0, gSum = 0, bSum = 0;
    NSUInteger yIndex = 0, yIndexRowStart = 0;

    bool isSubSamplingX = subSamplingX > 1;
    bool isSubSamplingY = subSamplingY > 1;
    for (NSUInteger y = 0; y < height; y += subSamplingY)
    {
        for (NSUInteger x = 0; x < width; x += subSamplingX)
        {
            int yValue = yBuffer[yIndex] & 0xFF;
            
            // U/V values ideally fall under [-0.5, 0.5] range. To fit them into
            // [0, 255] range they are scaled up and centered to 128.
            // Operation below brings U/V values to [-128, 127].
            int uValue = (uBuffer[uvIndex] & 0xFF) - 128;
            int vValue = (vBuffer[uvIndex] & 0xFF) - 128;

            // https://en.wikipedia.org/wiki/YUV#Y%E2%80%B2UV420sp_(NV21)_to_RGB_conversion_(Android)
            // Fast integer computing with a small approximation
            int r = yValue + ((351 * vValue) >> 8);
            int g = yValue - ((179 * vValue + 86 * uValue) >> 8);
            int b = yValue + ((443 * uValue) >> 8);
//                int r = (int)(0.5f + yValue + 1.370705f * vValue);
//                int g = (int)(0.5f + yValue - 0.698001f * vValue - 0.337633f * uValue);
//                int b = (int)(0.5f + yValue + 1.732446f * uValue);

            // Use raw values (not clamped to [0, 255])
            rSum += r;
            gSum += g;
            bSum += b;

            // Next pixel, taking sub-sampling into account
            yIndex += yPixelStride;
            if (isSubSamplingX || (x & 1) != 0)
            {
                uvIndex += uvPixelStride;
            }
        }

        // Next line, taking sub-sampling into account
        yIndexRowStart += yRowStride;
        yIndex = yIndexRowStart;
        if (isSubSamplingY || (y & 1) != 0)
        {
            uvIndexRowStart += uvRowStride;
        }
        uvIndex = uvIndexRowStart;
    }

    NSDate *endTime = [NSDate date];
    NSTimeInterval timestamp = [endTime timeIntervalSince1970];
    NSTimeInterval duration = [endTime timeIntervalSinceDate:startTime];
    return @{
        @"timestamp": [NSNumber numberWithDouble:1000 * timestamp],
        @"duration": [NSNumber numberWithDouble:1000 * duration],
        @"width": [NSNumber numberWithUnsignedInteger:width],
        @"height": [NSNumber numberWithUnsignedInteger:height],
//        @"yRowStride", yRowStride);
//        @"yPixelStride", yPixelStride);
//        @"uvRowStride", uvRowStride);
//        @"uvPixelStride", uvPixelStride);
        @"redAverage": [NSNumber numberWithDouble:rSum / pixelsCount],
        @"greenAverage": [NSNumber numberWithDouble:gSum / pixelsCount],
        @"blueAverage": [NSNumber numberWithDouble:bSum / pixelsCount],
    };
}

static inline id getImageRgbAverages(Frame* frame, NSArray* args)
{
    // Read parameters (must match processImage() parameters)
    int subSamplingX = 1;
    int subSamplingY = 1;
    bool writeRbgImage = false;
    bool writeYuvPlanes = false;

    int paramCounter = 0;
    for (NSObject *param in args)
    {
        if ([param isKindOfClass:[NSNumber class]])
        {
            NSNumber *num = (NSNumber *)param;
            if (paramCounter < 2)
            {
                if (paramCounter == 0)
                {
                    subSamplingX = num.intValue;
                }
                else if (paramCounter == 1)
                {
                    subSamplingY = num.intValue;
                }
            }
            else
            {
                if (paramCounter == 2)
                {
                    writeRbgImage = num.boolValue;
                }
                else //if (paramCounter == 3) {
                {
                    writeYuvPlanes = num.boolValue;
                }
            }
        }
        ++paramCounter;
    }


    CMSampleBufferRef buffer = frame.buffer;
    UIImageOrientation orientation = frame.orientation;
    CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(buffer);
    
    id result = nil;
    if (imageBuffer)
    {
        CVPixelBufferLockBaseAddress(imageBuffer, 0);
        
        void *baseAddress = CVPixelBufferGetBaseAddress(imageBuffer);

        if (baseAddress)
        {
//            NSData *data = [NSData dataWithBytes:baseAddress length:bytesPerRow * height];
            result = processImage(baseAddress, imageBuffer, subSamplingX, subSamplingY, writeRbgImage, writeYuvPlanes);
        }
        
        CVPixelBufferUnlockBaseAddress(imageBuffer, 0);
    }

    return result;
}

VISION_EXPORT_FRAME_PROCESSOR(getImageRgbAverages)

@end

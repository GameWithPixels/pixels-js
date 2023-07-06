#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>
#import <Endian.h>
@import Accelerate;

@interface QRCodeFrameProcessorPlugin : NSObject
@end

@implementation QRCodeFrameProcessorPlugin

static id processImage(void *baseAddress, CVImageBufferRef imageBuffer, int subSamplingX, int subSamplingY, bool useVectorProc)
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
        return @"Invalid parameter, subSamplingX must be 1 or greater";
    }
    if (subSamplingY <= 0)
    {
        return @"Invalid parameter, subSamplingY must be 1 or greater";
    }
    
    // Track how long it takes to process the image
    NSDate *startTime = [NSDate date];
    
    // FPS check
    //    static NSDate *lastTime = NULL;
    //    if (lastTime)
    //    {
    //        NSLog(@"Time between calls: %f", [startTime timeIntervalSinceDate:lastTime]);
    //    }
    //    lastTime = startTime;
    
    // Get image size
    const NSUInteger width = CVPixelBufferGetWidth(imageBuffer);
    const NSUInteger height = CVPixelBufferGetHeight(imageBuffer);
    
    int64_t rSum = 0, gSum = 0, bSum = 0;
    
    if (useVectorProc)
    {
        // Convert to RGB buffer
        
        // Buffer
        static uint32_t *rgbBuffer = NULL;
        static uint64_t bufferSize = 0;
        const size_t requiredBufferSize = width * height * 4;
        if (rgbBuffer && bufferSize < requiredBufferSize)
        {
            free(rgbBuffer);
            rgbBuffer = NULL;
        }
        
        // Image convertion parameters
        static vImage_YpCbCrPixelRange pixelRange;
        static vImage_YpCbCrToARGB info;
        vImage_Error convError = kvImageNoError;
        if (!rgbBuffer)
        {
            // https://developer.apple.com/documentation/accelerate/vimage_ypcbcrpixelrange?language=objc
            // video range 8-bit, clamped to video range
            pixelRange.Yp_bias = 16;
            pixelRange.CbCr_bias = 128;
            pixelRange.YpRangeMax = 265;
            pixelRange.CbCrRangeMax = 240;
            pixelRange.YpMax = 235;
            pixelRange.YpMin = 16;
            pixelRange.CbCrMax = 240;
            pixelRange.CbCrMin = 16;
            
            convError = vImageConvert_YpCbCrToARGB_GenerateConversion(kvImage_YpCbCrToARGBMatrix_ITU_R_601_4,
                                                                      &pixelRange,
                                                                      &info,
                                                                      kvImage422CbYpCrYp8,
                                                                      kvImageARGB8888,
                                                                      kvImageNoFlags);
            
            if (convError == kvImageNoError)
            {
                rgbBuffer = malloc(requiredBufferSize);
            }
        }
        
        if (convError == kvImageNoError)
        {
            vImage_Buffer yImgBuffer;
            yImgBuffer.data = CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 0);;
            yImgBuffer.width = CVPixelBufferGetWidthOfPlane(imageBuffer, 0);
            yImgBuffer.height = CVPixelBufferGetHeightOfPlane(imageBuffer, 0);
            yImgBuffer.rowBytes = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 0);
            vImage_Buffer uvImgBuffer;
            uvImgBuffer.data = CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 1);;
            uvImgBuffer.width = CVPixelBufferGetWidthOfPlane(imageBuffer, 1);
            uvImgBuffer.height = CVPixelBufferGetHeightOfPlane(imageBuffer, 1);
            uvImgBuffer.rowBytes = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 1);
            vImage_Buffer rgbImgBuffer;
            rgbImgBuffer.data = rgbBuffer;
            rgbImgBuffer.width = width;
            rgbImgBuffer.height = height;
            rgbImgBuffer.rowBytes = 4 * width;
            
            convError = vImageConvert_420Yp8_CbCr8ToARGB8888(&yImgBuffer, &uvImgBuffer, &rgbImgBuffer, &info, nil, 0, kvImageNoFlags);
        }
        
        if (convError == kvImageNoError)
        {
            uint32_t *rgbPtr = rgbBuffer; //rgbBuffer;
            for (NSUInteger y = 0; y < height; y += subSamplingY)
            {
                for (NSUInteger x = 0; x < width; x += subSamplingX)
                {
                    const uint32_t argb = *rgbPtr;
                    const int r = (argb & 0x0000ff00) >> 8;
                    const int b = (argb & 0xff000000) >> 24;
                    const int g = (argb & 0x00ff0000) >> 16;
                    
                    // Use raw values (not clamped to [0, 255])
                    rSum += r;
                    gSum += g;
                    bSum += b;
                    
                    rgbPtr += subSamplingX;
                }
                
                rgbPtr += (subSamplingY - 1) * width;
            }
        }
        else
        {
            return @"Error converting image to RGB";
        }
    }
    else
    {
        const bool isSubSamplingX = subSamplingX > 1;
        const bool isSubSamplingY = subSamplingY > 1;
        
        // Get image info
        NSUInteger yBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 0);
        NSUInteger uvBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 1);
        const NSUInteger yRowStride = yBytesPerRow * subSamplingY;
        const NSUInteger yPixelStride = subSamplingX;
        const NSUInteger uvRowStride = uvBytesPerRow * (isSubSamplingY ? subSamplingY / 2 : 1);
        const NSUInteger uvPixelStride = 2 * (isSubSamplingX ? subSamplingX / 2 : 1);
        
        const uint8_t *yBuffer = CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 0);
        const uint8_t *uBuffer = CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 1);
        const uint8_t *vBuffer = uBuffer + 1;
        
        // U/V Values are sub-sampled i.e. each pixel in U/V channel in a
        // YUV_420 image act as chroma value for 4 neighboring pixels
        NSUInteger uvIndex = 0, uvIndexRowStart = 0;
        NSUInteger yIndex = 0, yIndexRowStart = 0;
        
        for (NSUInteger y = 0; y < height; y += subSamplingY)
        {
            for (NSUInteger x = 0; x < width; x += subSamplingX)
            {
                int yValue = yBuffer[yIndex] & 0xFF;
                
                // U/V values ideally fall under [-0.5, 0.5] range. To fit them into
                // [0, 255] range they are scaled up and centered to 128.
                // Operation below brings U/V values to [-128, 127].
                const int uValue = (uBuffer[uvIndex] & 0xFF) - 128;
                const int vValue = (vBuffer[uvIndex] & 0xFF) - 128;
                
                // https://en.wikipedia.org/wiki/YUV#Y%E2%80%B2UV420sp_(NV21)_to_RGB_conversion_(Android)
                // Fast integer computing with a small approximation
                const int r = yValue + ((351 * vValue) >> 8);
                const int g = yValue - ((179 * vValue + 86 * uValue) >> 8);
                const int b = yValue + ((443 * uValue) >> 8);
                
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
    }
    
    const int64_t pixelsCount = (width / subSamplingX) * (height / subSamplingY);
    const NSTimeInterval timestamp = [startTime timeIntervalSince1970];
    const NSTimeInterval duration = [[NSDate date] timeIntervalSinceDate:startTime];
    return @{
        @"timestamp": [NSNumber numberWithDouble:1000 * timestamp],
        @"duration": [NSNumber numberWithDouble:1000 * duration],
        @"redAverage": [NSNumber numberWithInteger:rSum / pixelsCount],
        @"greenAverage": [NSNumber numberWithInteger:gSum / pixelsCount],
        @"blueAverage": [NSNumber numberWithInteger:bSum / pixelsCount],
        @"widthSubSampling": [NSNumber numberWithUnsignedInteger:subSamplingX],
        @"heightSubSampling": [NSNumber numberWithUnsignedInteger:subSamplingY],
        @"imageWidth": [NSNumber numberWithUnsignedInteger:width],
        @"imageHeight": [NSNumber numberWithUnsignedInteger:height],
    };
}

static inline id getImageRgbAverages(Frame* frame, NSArray* args)
{
    // Read parameters (must match processImage() parameters)
    int maxPixelsToProcess = 0;
    bool useVectorProc = false;
    
    int paramCounter = 0;
    for (NSObject *param in args)
    {
        if ([param isKindOfClass:[NSNumber class]])
        {
            NSNumber *num = (NSNumber *)param;
            if (paramCounter == 0)
            {
                maxPixelsToProcess = num.intValue;
            }
            else if (paramCounter == 1)
            {
                useVectorProc = num.boolValue;
            }
        }
        ++paramCounter;
    }
    
    CMSampleBufferRef buffer = frame.buffer;
    // UIImageOrientation orientation = frame.orientation;
    CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(buffer);
    
    id result = nil;
    if (imageBuffer)
    {
        CVPixelBufferLockBaseAddress(imageBuffer, 0);
        
        void *baseAddress = CVPixelBufferGetBaseAddress(imageBuffer);
        if (baseAddress)
        {
            // Compute sub-sampling based on maximum number of pixels to process
            int subSamplingX = 1;
            int subSamplingY = 1;
            if (maxPixelsToProcess > 0)
            {
                // Get image size
                const NSUInteger width = CVPixelBufferGetWidth(imageBuffer);
                const NSUInteger height = CVPixelBufferGetHeight(imageBuffer);
                while ((width / subSamplingX * height / subSamplingY) > maxPixelsToProcess)
                {
                    if (subSamplingX > subSamplingY)
                    {
                        subSamplingY <<= 1;
                    }
                    else if (subSamplingY > subSamplingX)
                    {
                        subSamplingX <<= 1;
                    }
                    else if (width > height)
                    {
                        subSamplingX <<= 1;
                    }
                    else
                    {
                        subSamplingY <<= 1;
                    }
                }
            }
            
            result = processImage(baseAddress,
                                  imageBuffer,
                                  subSamplingX,
                                  subSamplingY,
                                  useVectorProc);
        }
        else
        {
            result = @"Error getting image base address";
        }
        
        CVPixelBufferUnlockBaseAddress(imageBuffer, 0);
    }
    else
    {
        result = @"Error getting image buffer";
    }
    
    return result;
}

VISION_EXPORT_FRAME_PROCESSOR(getImageRgbAverages)

@end

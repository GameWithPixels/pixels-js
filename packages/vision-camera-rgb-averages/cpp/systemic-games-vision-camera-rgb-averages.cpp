#include "systemic-games-vision-camera-rgb-averages.h"
#include <algorithm>
#include <chrono>
#ifdef ANDROID
#include "../../../node_modules/react-native-vision-camera/android/src/main/cpp/frameprocessors/FrameHostObject.h"
using namespace vision;
#else
#include "../../../node_modules/react-native-vision-camera/ios/FrameProcessors/FrameHostObject.h"
#endif

namespace systemicgames_visioncamerargbaverages {
    using namespace facebook;

    void install(jsi::Runtime& runtime) {
        auto myPlugin = [=](jsi::Runtime &runtime,
                            const jsi::Value &thisArg,
                            const jsi::Value *args,
                            size_t count) -> jsi::Value
        {
#if __ANDROID_API__ >= 26
			if (!count) {
				throw jsi::JSError(runtime, "No arguments provided!");
			}

			const auto start = std::chrono::system_clock::now();

            // auto frame = std::static_pointer_cast<FrameHostObject>(runtime.getHostObject(args[0].asObject(runtime)))->getFrame(); // Requires modifying HostObject class to compile
            const auto frameHost = args[0].asObject(runtime).asHostObject<FrameHostObject>(runtime);
            const auto frame = frameHost->getFrame();

			int subSamplingX = 2;
			int subSamplingY = 2;
			if (count > 1) {
				const auto opt = args[0].asObject(runtime);
				const auto ssx = opt.getProperty(runtime, "subSamplingX");
				if (ssx.isNumber()) {
					subSamplingX = std::max(1, (int)ssx.getNumber());
				}
				const auto ssy = opt.getProperty(runtime, "subSamplingY");
				if (ssy.isNumber()) {
					subSamplingY = std::max(1, (int)ssy.getNumber());
				}
			}


            // if (!frame->getIsValid()) {
            // 	throw jsi::JSError(runtime, "Frame is not valid!");
            // }
            // if (frame->getPixelFormat()->getUnionValue()->toStdString() != "yuv") {
            // 	throw jsi::JSError(runtime, "Frame is not in YUV format!");
            // }

            const auto hardwareBuffer = frame->getHardwareBuffer();
            AHardwareBuffer_acquire(hardwareBuffer);

            AHardwareBuffer_Desc bufferDescription;
            AHardwareBuffer_describe(hardwareBuffer, &bufferDescription);
            // __android_log_print(ANDROID_LOG_INFO, "Frame", "Converting %i x %i @ %i HardwareBuffer...", bufferDescription.width, bufferDescription.height, bufferDescription.stride);

            // Check layers & format

            const uint32_t width = bufferDescription.width;
            const uint32_t height = bufferDescription.height;

            static std::vector<uint8_t> data{};
            data.resize(height * bufferDescription.stride * 1.5);

            void *rawBuffer;
            const auto result = AHardwareBuffer_lock(hardwareBuffer, AHARDWAREBUFFER_USAGE_CPU_READ_RARELY, -1, nullptr, &rawBuffer);
            if (result != 0) {
                throw jsi::JSError(runtime, "Failed to lock HardwareBuffer for reading!");
            }
            memcpy(data.data(), rawBuffer, data.size());

            // AHardwareBuffer_Planes planes;
            // const auto result = AHardwareBuffer_lockPlanes(hardwareBuffer, AHARDWAREBUFFER_USAGE_CPU_READ_RARELY, -1, nullptr, &planes);
            // if (result != 0) {
            // 	throw jsi::JSError(runtime, "Failed to lock HardwareBuffer for reading!");
            // }

            // static std::vector<uint8_t> yData{};
            // yData.resize(height * planes.planes[0].rowStride);
            // static std::vector<uint8_t> uvData{};
            // uvData.resize(height * planes.planes[2].rowStride / 2);
            // memcpy(yData.data(), planes.planes[0].data, yData.size());
            // memcpy(uvData.data(), planes.planes[2].data, uvData.size());

            // const auto planesCount = frame->getPlanesCount();
            // const auto bytePerRow = frame->getBytesPerRow();
            // const auto mirrored = frame->getIsMirrored();
            // const auto orientation = frame->getOrientation()->getUnionValue()->toStdString();
            // // 640x480, 3 planes, 640 bytes per row orientation: landscape-right format: yuv
            // const auto str =
            // 	std::to_string(width) + "x" + std::to_string(height) + (mirrored ? " mirrored, " : ", ") +
            // 	std::to_string(planesCount) + " planes, " + std::to_string(bytePerRow) + " bytes per row " +
            // 	"orientation: " + orientation + " format: " + format
            // ;

            AHardwareBuffer_unlock(hardwareBuffer, nullptr);
            AHardwareBuffer_release(hardwareBuffer);

            const bool isSubSamplingX = subSamplingX > 1;
            const bool isSubSamplingY = subSamplingY > 1;

            int rowStride0 = bufferDescription.stride;
            int rowStride1 = rowStride0;
            int pixelStride0 = 1;
            int pixelStride1 = 2;
            // int pixelStride0 = planes.planes[0].pixelStride;
            // int pixelStride1 = planes.planes[2].pixelStride;

            // Get image info
            const uint32_t yBytesPerRow = rowStride0;
            const uint32_t yRowStride = isSubSamplingY ? subSamplingY * yBytesPerRow : yBytesPerRow;
            const uint32_t yPixelStride = pixelStride0 * (isSubSamplingX ? subSamplingX : 1);
            const uint32_t uvBytesPerRow = rowStride1;
            const uint32_t uvRowStride = uvBytesPerRow * (isSubSamplingY ? subSamplingY / 2 : 1);
            const uint32_t uvPixelStride = pixelStride1 * (isSubSamplingX ? subSamplingX / 2 : 1);

            // const uint8_t* yBuffer = static_cast<uint8_t*>(planes.planes[0].data);
            // const uint8_t* uBuffer = static_cast<uint8_t*>(planes.planes[1].data);
            // const uint8_t* vBuffer = static_cast<uint8_t*>(planes.planes[2].data);
            const uint8_t* yBuffer = data.data();
            const uint8_t *vBuffer = yBuffer + yBytesPerRow * height;
            const uint8_t *uBuffer = vBuffer + 1;
            // const uint8_t* yBuffer = yData.data();
            // const uint8_t *vBuffer = uvData.data();
            // const uint8_t *uBuffer = vBuffer + 1;

            // U/V Values are sub-sampled i.e. each pixel in U/V channel in a
            // YUV_420 image act as chroma value for 4 neighboring pixels
            uint32_t uvIndex = 0, uvIndexRowStart = 0;
            uint32_t yIndex = 0, yIndexRowStart = 0;
            int64_t rSum = 0, gSum = 0, bSum = 0;

            for (uint32_t y = 0; y < height; y += subSamplingY) {
                for (uint32_t x = 0; x < width; x += subSamplingX) {
                    int yValue = yBuffer[yIndex] & 0xFF;

                    // U/V values ideally fall under [-0.5, 0.5] range. To fit them into
                    // [0, 255] range they are scaled up and centered to 128.
                    // Operation below brings U/V values to [-128, 127].
                    const int uValue = (int)(uBuffer[uvIndex] & 0xFF) - 128;
                    const int vValue = (int)(vBuffer[uvIndex] & 0xFF) - 128;

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
                    if (isSubSamplingX || (x & 1) != 0) {
                        uvIndex += uvPixelStride;
                    }
                }

                // Next line, taking sub-sampling into account
                yIndexRowStart += yRowStride;
                yIndex = yIndexRowStart;
                if (isSubSamplingY || (y & 1) != 0) {
                    uvIndexRowStart += uvRowStride;
                }
                uvIndex = uvIndexRowStart;
            }

            const int64_t pixelsCount = ((int64_t)width / subSamplingX) * ((int64_t)height / subSamplingY);

            const auto end = std::chrono::system_clock::now();
            const auto timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(start.time_since_epoch()).count();
            const auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

            auto obj = jsi::Object(runtime);
            obj.setProperty(runtime, "timestamp", double(timestamp));
            obj.setProperty(runtime, "duration", int(duration));
            obj.setProperty(runtime, "redAverage", int(rSum / pixelsCount));
            obj.setProperty(runtime, "greenAverage", int(gSum / pixelsCount));
            obj.setProperty(runtime, "blueAverage", int(bSum / pixelsCount));
            obj.setProperty(runtime, "widthSubSampling", subSamplingX);
            obj.setProperty(runtime, "heightSubSampling", subSamplingY);
            obj.setProperty(runtime, "imageWidth", int(width));
            obj.setProperty(runtime, "imageHeight", int(height));
            return jsi::Value(runtime, obj);
#else
            throw jsi::JSError(runtime, "Cannot read frame buffer, only available on Android API 26 or above. Set your app's minSdk version to 26 and try again.");
#endif 
        };


        auto jsiFunc = jsi::Function::createFromHostFunction(runtime,
                                                             jsi::PropNameID::forUtf8(runtime,
                                                                                      "frameProcessor"),
                                                             1,
                                                             myPlugin);

        runtime.global().setProperty(runtime, "frameProcessor", jsiFunc);
    }
}

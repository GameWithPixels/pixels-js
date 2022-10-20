package com.systemic.visioncamerargbaverages;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.ImageFormat;
import android.media.Image;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.camera.core.ImageProxy;

import com.facebook.react.bridge.WritableNativeMap;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;

import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;

// Frame Processor that computes the image red, green and blue averages
public class VisionCameraRgbAveragesFrameProcessor extends FrameProcessorPlugin {
    final static String TAG = "SystemicGames";

    // Those 3 members are used for writing images to disk
    String _picturesPath;
    int _imageFileCounter;
    ArrayList<byte[]> _buffersCache = new ArrayList<>(); // Keep a few buffers to avoid allocations on each frame

    public VisionCameraRgbAveragesFrameProcessor(String picturesPath) {
        super("getImageRgbAverages");
        _picturesPath = picturesPath;
    }

    @Override
    public Object callback(@NotNull ImageProxy image, @NotNull Object[] params) {
        // Read parameters (must match processImage() parameters)
        int subSamplingX = 1;
        int subSamplingY = 1;
        boolean writeRbgImage = false;
        boolean writeYuvPlanes = false;

        int paramCounter = 0;
        for (Object param : params) {
            if ((paramCounter < 2) && (param instanceof Double)) {
                double d = (Double) param;
                if (paramCounter == 0) {
                    subSamplingX = (int) d;
                } else if (paramCounter == 1) {
                    subSamplingY = (int) d;
                }
            } else if ((paramCounter >= 2) && (param instanceof Boolean)) {
                if (paramCounter == 2) {
                    writeRbgImage = (Boolean) param;
                } else { //if (paramCounter == 3) {
                    writeYuvPlanes = (Boolean) param;
                }
            }
            ++paramCounter;
        }
//        for (Object param : params) {
//            Log.d(TAG, "  -> " + (param == null ? "(null)" : param.toString() + " (" + param.getClass().getName() + ")"));
//        }
        @SuppressLint("UnsafeOptInUsageError")
        Image img = image.getImage();

        if (img == null) {
            throw new IllegalArgumentException("Failed to get image contents");
        }

        return processImage(img, subSamplingX, subSamplingY, writeRbgImage, writeYuvPlanes);
    }

    // Be careful with sub sampling, it must be > 2 and work with the given resolution
    private WritableNativeMap processImage(@NotNull Image image, final int subSamplingX, final int subSamplingY, final boolean writeRgbImage, final boolean writeYuvPlanes) {
        if (image.getFormat() != ImageFormat.YUV_420_888) {
            throw new IllegalArgumentException("Image format must be YUV_420_888");
        }
        if (subSamplingX <= 0) {
            throw new IllegalArgumentException("subSampling value must be 1 or greater");
        }
        if (subSamplingY <= 0) {
            throw new IllegalArgumentException("subSampling value must be 1 or greater");
        }

        //Log.d(TAG, "processImage  -> subSamplingX=" + subSamplingX + ", subSamplingY=" + subSamplingY + ", writeRgbImage=" + writeRgbImage + ", writeYuvPlanes=" + writeYuvPlanes);

        // Track how long it takes to process the image
        final long startTime = System.nanoTime();

        // 1280 x 720
        final int imageWidth = image.getWidth();
        final int imageHeight = image.getHeight();

        // Base on code sample from:
        // https://blog.minhazav.dev/how-to-convert-yuv-420-sp-android.media.Image-to-Bitmap-or-jpeg/#pure-java-approach

        // Plane 0 is always Y
        // Plane 1 is always U & plane 2 is always V
        // https://developer.android.com/reference/android/graphics/ImageFormat#YUV_420_888
        final Image.Plane[] planes = image.getPlanes();
        final ByteBuffer yBuffer = planes[0].getBuffer();
        yBuffer.position(0);
        final ByteBuffer uBuffer = planes[1].getBuffer();
        uBuffer.position(0);
        final ByteBuffer vBuffer = planes[2].getBuffer();
        vBuffer.position(0);

        // The U/V planes are guaranteed to have the same row stride and pixel stride
        final int yRowStride = planes[0].getRowStride() * subSamplingY;
        final int yPixelStride = planes[0].getPixelStride() * subSamplingX;
        final int uvRowStride = planes[1].getRowStride() * subSamplingY / 2;
        final int uvPixelStride = planes[1].getPixelStride() * subSamplingX / 2;

        // U/V Values are sub-sampled i.e. each pixel in U/V channel in a
        // YUV_420 image act as chroma value for 4 neighbouring pixels
        int uvIndex = 0, uvIndexRowStart = 0;

        final int pixelsCount = (imageWidth / subSamplingX) * (imageHeight / subSamplingY);
        final byte[] argb = writeRgbImage ? getArgbBuffer(pixelsCount * 4) : null;
        int argbIndex = 0;

        double rSum = 0, gSum = 0, bSum = 0;
        int yIndex = 0, yIndexRowStart = 0;

        final boolean isSubSamplingX = subSamplingX > 1;
        final boolean isSubSamplingY = subSamplingY > 1;
        for (int y = 0; y < imageHeight; y += subSamplingY) {
            for (int x = 0; x < imageWidth; x += subSamplingX) {
                final int yValue = yBuffer.get(yIndex) & 0xFF;

                // U/V values ideally fall under [-0.5, 0.5] range. To fit them into
                // [0, 255] range they are scaled up and centered to 128.
                // Operation below brings U/V values to [-128, 127].
                final int uValue = (uBuffer.get(uvIndex) & 0xFF) - 128;
                final int vValue = (vBuffer.get(uvIndex) & 0xFF) - 128;

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

                if (writeRgbImage) {
                    argb[argbIndex++] = (byte) (Math.max(0, Math.min(255, r)));
                    argb[argbIndex++] = (byte) (Math.max(0, Math.min(255, g)));
                    argb[argbIndex++] = (byte) (Math.max(0, Math.min(255, b)));
                    argb[argbIndex++] = (byte) 255;
                }

                yIndex += yPixelStride;
                if (isSubSamplingX || (x & 1) != 0) {
                    uvIndex += uvPixelStride;
                }
            }
            yIndexRowStart += yRowStride;
            yIndex = yIndexRowStart;
            if (isSubSamplingY || (y & 1) != 0) {
                uvIndexRowStart += uvRowStride;
            }
            uvIndex = uvIndexRowStart;
        }

        if (writeRgbImage && !writeImage(
                _picturesPath + "/cameraFiltered-" + _imageFileCounter + ".jpg",
                imageWidth / subSamplingX,
                imageHeight / subSamplingY,
                argb)) {
            Log.e(TAG, "Failed to save RGB image to file");
        }

        if (writeYuvPlanes) {
            String pathname = _picturesPath + "/camera%s-" + _imageFileCounter + ".jpg";
            if (!writePlane(String.format(pathname, "Y"), planes[0], imageWidth, imageHeight)) {
                Log.e(TAG, "Failed to save Y plane to file");
            }
            if (!writePlane(String.format(pathname, "U"), planes[1], imageWidth / 2, imageHeight / 2)) {
                Log.e(TAG, "Failed to save U plane to file");
            }
            if (!writePlane(String.format(pathname, "V"), planes[2], imageWidth / 2, imageHeight / 2)) {
                Log.e(TAG, "Failed to save V plane to file");
            }
        }

        if (writeRgbImage || writeYuvPlanes) {
            _imageFileCounter += 1;
        }

        // Put time as double as we can't do long
        WritableNativeMap map = new WritableNativeMap();
        map.putDouble("timestamp", System.currentTimeMillis());
        map.putDouble("duration", (System.nanoTime() - startTime) / 1000.0);
        map.putInt("width", imageWidth);
        map.putInt("height", imageHeight);
//        map.putInt("yRowStride", yRowStride);
//        map.putInt("yPixelStride", yPixelStride);
//        map.putInt("uvRowStride", uvRowStride);
//        map.putInt("uvPixelStride", uvPixelStride);
        map.putDouble("redAverage", rSum / pixelsCount);
        map.putDouble("greenAverage", gSum / pixelsCount);
        map.putDouble("blueAverage", bSum / pixelsCount);
        return map;
    }

    private byte[] getArgbBuffer(final int length) {
        for (int i = 0; i < _buffersCache.size(); ++i) {
            byte[] buffer = _buffersCache.get(i);
            if (buffer.length == length) {
                return buffer;
            }
        }
        byte[] buffer = new byte[length];
        _buffersCache.add(buffer);
        return buffer;
    }

    private boolean writePlane(final String imagePathname, @NonNull final Image.Plane plane, final int imageWidth, final int imageHeight) {
        final ByteBuffer buffer = plane.getBuffer();
        buffer.position(0);
        final int rowStride = plane.getRowStride();
        final int pixelStride = plane.getPixelStride();

        final int pixelsCount = imageWidth * imageHeight;
        final byte[] argb = getArgbBuffer(pixelsCount * 4);
        int index = 0, indexRowStart = 0;
        int argbIndex = 0;
        for (int y = 0; y < imageHeight; ++y) {
            for (int x = 0; x < imageWidth; ++x) {
                final byte val = buffer.get(index);
                argb[argbIndex++] = val;
                argb[argbIndex++] = val;
                argb[argbIndex++] = val;
                argb[argbIndex++] = (byte) 255;
                index += pixelStride;
            }
            indexRowStart += rowStride;
            index = indexRowStart;
        }

        return writeImage(imagePathname, imageWidth, imageHeight, argb);
    }

    private static boolean writeImage(String pathname, int width, int height, byte[] argbData) {
        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        bmp.copyPixelsFromBuffer(ByteBuffer.wrap(argbData));
        File f = new File(pathname);
        try {
            FileOutputStream fos = new FileOutputStream(f);
            boolean result = bmp.compress(Bitmap.CompressFormat.JPEG, 70, fos);
            fos.close();
            if (!result) {
                f.delete();
            }
            return result;
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return false;
    }
}

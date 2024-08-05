package com.systemic.zplprint;

import android.graphics.Bitmap;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

public class ZplPrint {
    @Nullable
    public static List<byte[]> getBarcode() {
        return toBytes(new String[]{"^XA",
            "^FO50,60^A0,40^FDWorld's Best Griddle^FS",
            "^FO60,120^BY3^BCN,60,,,,A^FD1234ABC^FS ^FO25,25^GB380,200,2^FS",
            "^XZ"});
    }

    @Nullable
    public static List<byte[]> getImage(@NonNull Bitmap bitmap,
                                        int x,
                                        int y,
                                        double blacknessThreshold,
                                        int numCopies,
                                        @Nullable ExecutorService executorService,
                                        int threadCount) {
        final int width = bitmap.getWidth();
        final int height = bitmap.getHeight();
        final int[] pixels = new int[width * height];
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height);

        String data;
        if (executorService != null && threadCount > 1) {
            // Run conversion on multiple threads
            ArrayList<Callable<String>> tasks = new ArrayList<>();
            int yStart = 0, yEnd;
            for (int t = 1; t <= threadCount; ++t) {
                if (t < threadCount) {
                    yEnd = yStart + height / threadCount;
                } else {
                    yEnd = height;
                }
                tasks.add(new ConvertBitmapTask(
                    pixels, width, height, yStart, yEnd, (float) blacknessThreshold));
                yStart = yEnd;
            }
            try {
                // Run all tasks
                List<Future<String>> futures = executorService.invokeAll(tasks);
                data = "";
                // And concatenate results
                for (Future<String> f : futures) {
                    data += f.get();
                }
            } catch (InterruptedException | ExecutionException e) {
                return null;
            }
        } else {
            // Run conversion immediately
            final ConvertBitmapTask task = new ConvertBitmapTask(
                pixels, width, height, 0, height, (float) blacknessThreshold);
            try {
                // And get result
                data = task.call();
            } catch (Exception e) {
                return null;
            }
        }

        // Build ZPL instructions
        final int bytesPerRow = (width + 7) / 8;
        final int sizeInBytes = bytesPerRow * height;
        return toBytes(new String[]{"^XA",
            "^PW" + width,
            "^FO" + x + "," + y + "^GFA," + sizeInBytes + "," + sizeInBytes + "," + bytesPerRow + "," + data + "^FS",
            "^PQ" + numCopies,
            "^XZ"});
    }

    @Nullable
    private static List<byte[]> toBytes(String[] zpl) {
        try {
            final List<byte[]> bytes = new ArrayList();
            for (String block : zpl) {
                bytes.add(toBytes(block));
            }
            return bytes;
        } catch (UnsupportedEncodingException e) {
            return null;
        }
    }

    private static byte[] toBytes(@NonNull String str) throws UnsupportedEncodingException {
        final byte[] b = str.getBytes("utf-8");
        return new String(b, "utf-8").getBytes("gbk");
    }

    private static class ConvertBitmapTask implements Callable<String> {
        final int[] pixels;
        final int width;
        final int height;
        final int yStart;
        final int yEnd;
        final float blacknessThreshold;

        ConvertBitmapTask(int[] pixels, int width, int height, int yStart, int yEnd, float blacknessThreshold) {
            this.pixels = pixels;
            this.width = width;
            this.height = height;
            this.yStart = yStart;
            this.yEnd = yEnd;
            this.blacknessThreshold = blacknessThreshold;
        }

        @Override
        public String call() throws Exception {
            String data = "";
            int i = width * yStart;
            final float threshold = 255 * (1 - blacknessThreshold);
            for (int py = yStart; py < yEnd; ++py) {
                int b = 0;
                int shift = 0;
                for (int px = 0; px < width; ++px) {
                    // Read pixel color
                    final int color = pixels[i];
                    // And convert to grayscale
                    final int red = (color & 0xFF0000) >> 16;
                    final int green = (color & 0x00FF00) >> 8;
                    final int blue = color & 0x0000FF;
                    final float grayscale = 0.299f * red + 0.587f * green + 0.114f * blue;
                    // Store bit if pixel is dark enough
                    if (grayscale < threshold) {
                        b |= 1 << (7 - shift);
                    }
                    // Next bit
                    ++shift;
                    if (shift >= 8) {
                        // Convert byte to hex string and store it
                        data += byteToHex(b);
                        shift = 0;
                        b = 0;
                    }
                    ++i;
                }
                if (shift > 0) {
                    data += byteToHex(b);
                }
            }
            return data;
        }

        static final String[] hexChars = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"};

        // Trying to speed up hex conversion
        private static String byteToHex(int byteValue) {
            int b = byteValue & 0xFF;
            if (b <= 0xF) {
                return "0" + hexChars[b];
            } else {
                return hexChars[b >> 4] + hexChars[b & 0xF];
            }
        }
    }
}

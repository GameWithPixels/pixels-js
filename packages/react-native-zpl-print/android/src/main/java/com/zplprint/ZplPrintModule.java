package com.systemic.zplprint;

import android.Manifest;
import android.bluetooth.BluetoothDevice;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.util.Pair;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import com.izettle.html2bitmap.Html2Bitmap;
import com.izettle.html2bitmap.content.WebViewContent;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@ReactModule(name = ZplPrintModule.NAME)
public class ZplPrintModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ZplPrint";

    private final int threadCount = 4;
    private final ExecutorService executor = Executors.newFixedThreadPool(threadCount);

    public ZplPrintModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void printHtml(String printerName, String html, int imageWidth, double blacknessThreshold, Promise promise) {
        if (ActivityCompat.checkSelfPermission(getReactApplicationContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            promise.resolve("Bluetooth not authorized");
        } else {
            final Pair<BluetoothDevice, String> printerAndResult =
                BluetoothPrinter.getBluetoothPrinter(getReactApplicationContext(), printerName);
            BluetoothDevice printer = printerAndResult.first;
            if (printer != null) {
                executor.execute(() -> {
                    String result = "success";

                    // Convert HTML to bitmap
                    final WebViewContent content = WebViewContent.html(html);
                    final Html2Bitmap.Builder builder = new Html2Bitmap.Builder(
                        getCurrentActivity().getBaseContext(), content);
                    if (imageWidth > 0) {
                        builder.setBitmapWidth(imageWidth);
                    }
                    final Bitmap bitmap = builder.build().getBitmap();

                    // Print bitmap
                    if (bitmap != null) {
                        List<byte[]> zplBytes = ZplPrint.getImage(
                            bitmap, 0, 0, blacknessThreshold, executor, threadCount);
                        if (zplBytes != null) {
                            try {
                                BluetoothPrinter.print(printer, zplBytes);
                            } catch (IOException e) {
                                result = "Print error";
                            } catch (SecurityException e) {
                                result = "Access error";
                            }
                        } else {
                            result = "ZPL conversion failed";
                        }
                    } else {
                        result = "Bitmap conversion failed";
                    }

                    // Return result
                    promise.resolve(result);
                });
            } else {
                promise.resolve(printerAndResult.second);
            }
        }
    }
}

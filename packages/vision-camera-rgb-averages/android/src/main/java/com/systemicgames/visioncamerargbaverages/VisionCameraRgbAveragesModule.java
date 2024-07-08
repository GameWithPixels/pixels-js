package com.systemicgames.visioncamerargbaverages;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = VisionCameraRgbAveragesModule.NAME)
public class VisionCameraRgbAveragesModule extends VisionCameraRgbAveragesSpec {
  public static final String NAME = "VisionCameraRgbAverages";

  VisionCameraRgbAveragesModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  static {
    System.loadLibrary("systemic-games-vision-camera-rgb-averages");
  }

  public static native void nativeInstall(long jsi);

  @Override
  @ReactMethod(isBlockingSynchronousMethod = true)
  public void install() {
    JavaScriptContextHolder jsContext = getReactApplicationContext().getJavaScriptContextHolder();
    if(jsContext.get() != 0) {
      nativeInstall(jsContext.get());
    } else {
      Log.e("SimpleJsiModule", "JSI Runtime is not available in debug mode");
    }
  }
}

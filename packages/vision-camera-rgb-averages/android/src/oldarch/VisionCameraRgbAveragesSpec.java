package com.systemicgames.visioncamerargbaverages;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;

abstract class VisionCameraRgbAveragesSpec extends ReactContextBaseJavaModule {
  VisionCameraRgbAveragesSpec(ReactApplicationContext context) {
    super(context);
  }

  public abstract void multiply(double a, double b, Promise promise);
}

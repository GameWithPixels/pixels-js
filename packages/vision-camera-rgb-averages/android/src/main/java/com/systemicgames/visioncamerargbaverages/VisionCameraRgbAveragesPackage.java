package com.systemic.visioncamerargbaverages;

import android.os.Environment;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin;
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry;

public class VisionCameraRgbAveragesPackage implements ReactPackage {
  static {
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("__getImageRgbAverages", VisionCameraRgbAveragesFrameProcessorPluginPackage::new);
  }

  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}

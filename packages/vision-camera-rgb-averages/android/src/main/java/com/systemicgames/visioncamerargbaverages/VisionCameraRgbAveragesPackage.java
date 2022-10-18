package com.systemicgames.visioncamerargbaverages;

import android.os.Environment;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;

import java.util.Collections;
import java.util.List;

public class VisionCameraRgbAveragesPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        String picturesPath = reactContext.getExternalFilesDir(Environment.DIRECTORY_PICTURES).getAbsolutePath();
        FrameProcessorPlugin.register(new VisionCameraRgbAveragesFrameProcessor(picturesPath));
        return Collections.emptyList();
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}

package com.systemic.visioncamerargbaverages;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.ImageFormat;
import android.media.Image;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.annotation.NonNull;
import androidx.camera.core.ImageProxy;

import com.facebook.react.bridge.WritableNativeMap;

import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Map;

import com.mrousavy.camera.frameprocessors.Frame;
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin;
import com.mrousavy.camera.frameprocessors.VisionCameraProxy;

// Frame Processor that computes the image red, green and blue averages
public class VisionCameraRgbAveragesFrameProcessorPluginPackage extends FrameProcessorPlugin {
  VisionCameraRgbAveragesFrameProcessorPluginPackage(@NonNull VisionCameraProxy proxy, @Nullable Map<String, Object> options) {}

  @Nullable
  @Override
  public Object callback(@NonNull Frame frame, @Nullable Map<String, Object> arguments) throws Throwable {
    // code goes here
    return null;
  }
}

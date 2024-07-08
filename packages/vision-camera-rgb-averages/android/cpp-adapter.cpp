#include <jni.h>
#include "systemic-games-vision-camera-rgb-averages.h"

extern "C"
JNIEXPORT jdouble JNICALL
Java_com_systemicgames_visioncamerargbaverages_VisionCameraRgbAveragesModule_nativeMultiply(JNIEnv *env, jclass type, jdouble a, jdouble b) {
    return systemicgames_visioncamerargbaverages::multiply(a, b);
}

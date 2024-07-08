#include <jni.h>
#include <jsi/jsi.h>
#include "systemic-games-vision-camera-rgb-averages.h"

extern "C"
JNIEXPORT void JNICALL
Java_com_systemicgames_visioncamerargbaverages_VisionCameraRgbAveragesModule_nativeInstall(JNIEnv *env, jclass type, jlong jsi) {
    auto runtime = reinterpret_cast<facebook::jsi::Runtime *>(jsi);
    if (runtime) {
        systemicgames_visioncamerargbaverages::install(*runtime);
    }
}

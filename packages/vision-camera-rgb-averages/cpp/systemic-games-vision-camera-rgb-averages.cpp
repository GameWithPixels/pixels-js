#include "systemic-games-vision-camera-rgb-averages.h"
#ifdef ANDROID
#include "../../../node_modules/react-native-vision-camera/android/src/main/cpp/frameprocessors/FrameHostObject.h"
using namespace vision;
#else
#include "../../../node_modules/react-native-vision-camera/ios/FrameProcessors/FrameHostObject.h"
#endif

namespace systemicgames_visioncamerargbaverages {
	using namespace facebook;

    void install(jsi::Runtime& runtime) {
        auto myPlugin = [=](jsi::Runtime &runtime,
                            const jsi::Value &thisArg,
                            const jsi::Value *args,
                            size_t count) -> jsi::Value
        {
            auto frame = args[0].asObject(runtime).asHostObject<FrameHostObject>(runtime);
			// auto frame = std::static_pointer_cast<FrameHostObject>(runtime.getHostObject(args[0].asObject(runtime))); // Requires modifying HostObject class to compile
			return jsi::Value((int)frame->getFrame()->getHeight());
        };

        auto jsiFunc = jsi::Function::createFromHostFunction(runtime,
                                                             jsi::PropNameID::forUtf8(runtime,
                                                                                      "frameProcessor"),
                                                             1,
                                                             myPlugin);

        runtime.global().setProperty(runtime, "frameProcessor", jsiFunc);
    }
}

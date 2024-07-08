cmake_minimum_required(VERSION 3.4.1)
project(VisionCameraRgbAverages)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_package(react-native-vision-camera REQUIRED CONFIG)

add_library(systemic-games-vision-camera-rgb-averages            SHARED
            ../cpp/systemic-games-vision-camera-rgb-averages.cpp
            cpp-adapter.cpp
)

# Specifies a path to native header files.
include_directories(
            ../cpp
            ../../../node_modules/react-native/React
            ../../../node_modules/react-native/React/Base
            ../../../node_modules/react-native/ReactCommon/jsi
            ../../../node_modules/react-native-vision-camera/android/src/main/cpp/frameprocessors
            ../../../node_modules/react-native-vision-camera/android/src/main/cpp/frameprocessors/java-bindings
)

target_link_libraries(
        systemic-games-vision-camera-rgb-averages
        android  
        ReactAndroid::jsi
        fbjni::fbjni
        react-native-vision-camera::VisionCamera
)

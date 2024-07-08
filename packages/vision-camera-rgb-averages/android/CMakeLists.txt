cmake_minimum_required(VERSION 3.4.1)
project(VisionCameraRgbAverages)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)

add_library(systemic-games-vision-camera-rgb-averages            SHARED
            ../cpp/systemic-games-vision-camera-rgb-averages.cpp
            cpp-adapter.cpp
)

# Specifies a path to native header files.
include_directories(
            ../cpp
)

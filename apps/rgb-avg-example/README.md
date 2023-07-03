# RGB Averages Example

Example app for `systemic-games/vision-camera-rgb-averages`
package in React Native (no Expo).

At the moment, package hoisting is deactivated on the project
because it creates too many issues with React Native (CLI) not
being installed in the project's `node_modules` directory.

*Note*: there is a maximum limit to the absolute path of this project
(at least on Windows).
As of React Native 0.71, if the path gets too long the Android build
will fail with a flood of seemingly unrelated messages:
"CMake Warning [...]: An old version of CMake is being used [...]".

There are still a few of those warnings for a successful build, but
just not nearly as many.

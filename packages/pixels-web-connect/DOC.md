# Pixels Web Connect

## Introduction

This is the Pixels package for front end web developers.
It enables communications between Pixels dice and a web browser
using Bluetooth Low Energy.

To learn more about Pixels dice please checkout our [Kickstarter](
    https://www.kickstarter.com/projects/pixels-dice/pixels-the-electronic-dice
) page.

Please open a [ticket](
    https://github.com/GameWithPixels/PixelsWebPackage/issues
) in GitHub if you're having any issue.

We also have libraries for React Native, Unity, .NET, C++ and python.
See our [GitHub](
    https://github.com/GameWithPixels
) main page for more information.

## An Open Source Ecosystem

The Pixels ecosystem is made of open source hardware and software.
Communications with a device such as a computer or a phone is achieved using
Bluetooth Low Energy which is an open standard for short-range radio frequency
communication.

To communicate with a Pixels die, one has to connect to it using the Bluetooth
Low Energy protocol, and then retrieve the two Bluetooth characteristics that
the die is using to communicate with other Bluetooth devices (note: a Bluetooth
characteristic is like a wireless communication channel).

One of the two characteristics is used to send messages to the die and the other one
to receive messages from it.

The open source Pixels [firmware](
    https://github.com/GameWithPixels/DiceFirmware/
) lists all the supported messages and their associated data structure.

This open knowledge and reliance on the Bluetooth standard enables developers
to write code that communicate with Pixels using any combination of language
and system they wish as long as they have access to the Bluetooth Low Energy
stack.

However we want to make it as easy possible for any developer to integrate
Pixels within their project. So we've picked a selection of platforms for which we provide support libraries, such as this one.

Those libraries encapsulate the details of the Bluetooth protocol and Pixels
message serialization so the developer only need to write a few lines of code
without prior knowledge to start communicating with Pixels dice.

## The Challenge Of Wireless Communications

Using this package, connecting to a Pixel and immediately retrieving its roll
state is quite straightforward:

```JavaScript
// Ask user to select a Pixel
const pixel = await requestPixel();
// Connect to die
await pixel.connect();
// Get last roll state
const rollState = pixel.rollState;
console.log(`=> roll state: ${rollState.state}, face up: ${rollState.face}`);
```

However there are a number of challenges associated with those few lines of
code.

Like with any other wireless device, communicating with Pixels happens
asynchronously so this code might take longer than anticipated to execute.

In average, it takes a few seconds to connect to a Pixel and a couple hundred
milliseconds to get its roll state. But there are a number of reasons such as
interferences or the distance between devices that may slow down
communications.

The above code might also never complete as wireless communications are by
nature unreliable. The Bluetooth protocol is designed to help with that but
there are a number of things that may happen and for which failure is the only
possible outcome.

Here is a short list of the most common cause of communication failures:
- Device is taken out of range of by the user.
- Device is turned off or restarted by the user.
- Device ran out of battery.
- Too much wireless interference.

Any of these issues might happen while our code sample is being executed and
will result in an exception being thrown by one of the asynchronous call made
to the Pixels package.

Additionally the user might just cancel the request to connect to a die which
will result in the call to [`requestPixel()`](
    ../functions/_systemic_games_pixels_web_connect.requestPixel.html
) throwing an exception.

## User Experience

In the above section we've seen that communicating with Pixels may sometimes
result in a long wait time (more than a few hundred milliseconds) or with an
outright failure to complete (in which case the code throws an exception).

Those outcomes should be infrequent but they will occur nonetheless. In order
to keep the user engaged, the user interface should be designed to gracefully
respond to such events.

We recommend that the user interface should display some indication to the user
(like a spinner) when waiting for an asynchronous call to complete as well as
offering the user the option to either retry the operation or fallback to
another option (like a virtual roll) when there is a failure to communicate
with the die.

Other unexpected events will inevitably happen while using Pixels dice. For
example the user might re-roll their die or roll the wrong one (in case of a
multi dice setup).

The overall quality of the user experience will depend as much on the quality
of the Pixels dice as on how the user interface responds to physical events.
It is one of the main challenges of integrating a physical device with a piece
of software. For this link to feel true to the user, the software needs to
reflect as much as possible what is happening in the physical world.

In the case of Pixels dice, the key is in handling and responding to connection
and roll events.

*Note:*

In order to lessen the burden on developers, we are working on higher level
library features that will integrate in their design language the handling of
dice connection and roll events with one or more die at a time.

## Reading Rolls

Pixels dice automatically send their roll state when connected.
The [`Pixel`](
    ../classes/_systemic_games_pixels_web_connect.Pixel.html    
) class offer several ways to access that value:
- Get the last known roll state value with the [`rollState`](
    ../classes/_systemic_games_pixels_web_connect.Pixel.html#rollState
) accessor.
- Subscribe to "roll" or "rollState" events with [`addEventListener()`](
    ../classes/_systemic_games_pixels_web_connect.Pixel.html#addEventListener
).

The `rollState` accessor is only useful when needing to query the last know
roll state. However when waiting for a roll to happen, the preferred way is to
subscribe to the "roll" event and wait for it.

```JavaScript
const onRolled = (face) => {
    // Unsubscribe so further roll events are ignored
    pixel.removeEventListener("roll", onRolled);
    // Use the roll event
    console.log(`=> rolled face: ${face}`);
};
// Add listener to get notified on rolls
pixel.addEventListener("roll", onRolled);
```

The "rollState" event may be used to also get notified when the die inferred
roll state changes. Possible states are "onFace", "handling", "rolling" and
"crooked".

## One Die, Many Dice

The decision to connect to one die or to several dice at a time has a major
impact on the UX design of a project integrating with Pixels.

Technically speaking connecting to multiple dice at a time is just a matter of
keeping track of several `Pixel` instances, one for each physical die that is
being connected to.

However from a UX perspective, dealing with multiple dice creates new
challenges. In particular the user interface should allow to mix Pixels dice
with virtual ones, as not every user might have all the required Pixels dice.

When waiting on the user to roll their dice:
- The user might roll their die one by one or all at a time. It is usually
  best to display the roll results as they come in rather than waiting for all
  them before displaying anything.
- Some die might disconnect while others have already been rolled, so it
  should be possible for the user to reconnect to any die or to roll a virtual
  die without loosing the rolls already made.
- The user might re-roll a die, accidentally or not, before rolling all the
  requested dice.

Regarding the last item (some dice being re-rolled), different situations may
call for different UX decisions. It is preferable to ask the user if the
re-roll was intended rather then force the decision on them (which can be
frustrating).

Regardless of the decision, we strongly recommend to inform the user which
dice have been re-rolled and whether or not the new roll was taken into
account.

For example, one user may accidentally bump an already rolled die and not
realize it. If no information is displayed, the user might think the system is
not working properly has the roll result displayed on screen will not match the
physical die.

When multiple users are involved, we recommend that they are shown the same
information regarding roll results and re-rolls as the one actually rolling dice.

## Pixels Connection Status

The `Pixel` class lets the developer check for the die connection [status](
    ../classes/_systemic_games_pixels_web_connect.Pixel.html#status
).

As stated in the documentation, this is the *last know* connection status
rather the one at the instant the call is made. Because of the nature of
wireless communications, there is a delay before the Bluetooth stack
acknowledges that an unintended disconnection has occurred (such as one caused
by an out of range device or a power loss).

It is also worth noting that even if the returned `status` was to be accurate
the die might still be disconnected the next instant.

As a consequence the following code may still result in the call to
`queryRssi()` throwing an exception.

```JavaScript
if (pixel.status === "ready") {
    // Querying RSSI may still fail!!
    const rssi = await pixel.queryRssi();
    console.log(`=> rssi: ${rssi}`);
} else {
    // Die not connected
}
```

Therefore checking for the connection status is usually not a good practice.
It's best to always catch exceptions when invoking asynchronous methods of a
`Pixel` instance.

```JavaScript
try {
    // Querying RSSI
    const rssi = await pixel.queryRssi();
    console.log(`=> rssi: ${rssi}`);
} catch {
    // Die not connected
}
```

## Browser Support

This package relies on the [*Web Bluetooth API*](
    https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
) for accessing Bluetooth from the browser.
At the time of writing only Chromium based browsers such as Chrome, Edge
and Opera have support for these APIs.
on as it enables many other experimental web platform features.

On Linux, you need to enable Web Bluetooth support with this flag:
`chrome://flags/#enable-web-bluetooth`.

*Note:*
Currently all our testing is being done with Chrome on Windows.

## License

MIT

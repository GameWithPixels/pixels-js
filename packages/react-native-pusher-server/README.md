# react-native-pusher-server

Port from the official [pusher-http-node](
    https://github.com/pusher/pusher-http-node
) package to React Native with Typescript (encryption not supported)

## Installation

```sh
npm install react-native-pusher-server
```

## Usage


```js
import { Pusher } from 'react-native-pusher-server';

// ...

const pusher = new Pusher({
  appId: "APP_ID",
  key: "APP_KEY",
  secret: "SECRET_KEY",
  useTLS: USE_TLS, // optional, defaults to false
  cluster: "CLUSTER", // if `host` is present, it will override the `cluster` option.
  host: "HOST", // optional, defaults to api.pusherapp.com
  port: PORT, // optional, defaults to 80 for non-TLS connections and 443 for TLS connections
});
```

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

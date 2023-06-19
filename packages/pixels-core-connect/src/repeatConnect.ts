import { Pixel } from "./Pixel";
import { exponentialBackOff } from "./exponentialBackOff";

/**
 * Repeatedly attempts to connect a Pixel die using an exponential back off
 * strategy. It stops trying to connect once it has reached the given number
 * of retries.
 *
 * @see
 * Auto-reconnect code provided by Google:
 * https://googlechrome.github.io/samples/web-bluetooth/automatic-reconnect-async-await.html
 *
 * @param pixel The Pixel to connect to.
 * @param opt.retries Number of retries before aborting.
 * @param opt.onWillRetry Called before scheduling a retry.
 * @category Pixel
 */
export async function repeatConnect(
  pixel: Pixel,
  opt?: {
    retries?: number;
    onWillRetry?: (delay: number, retriesLeft: number, error: unknown) => void;
  }
): Promise<void> {
  await exponentialBackOff(
    opt?.retries ?? 3,
    1000,
    pixel.connect.bind(pixel),
    opt
  );
}

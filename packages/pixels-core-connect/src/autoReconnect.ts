import Pixel from "./Pixel";
import exponentialBackOff from "./exponentialBackOff";

export default async function (pixel: Pixel, retries = 4) {
  await exponentialBackOff(retries, 1000, pixel.connect.bind(pixel));
}

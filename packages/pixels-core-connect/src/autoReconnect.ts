import exponentialBackOff from "./exponentialBackOff";
import Pixel from "./Pixel";

export default async function (pixel: Pixel, retries = 4) {
  await exponentialBackOff(retries, 1000, pixel.connect.bind(pixel));
}

import got from "got";
import get from "lodash/get";
import * as env from "./env";
import logger from "./logging";

export async function getLatLongFromAddress(
  address: string
): Promise<[number, number] | undefined> {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  let responseBody;
  try {
    const response = await got.get(url, {
      query: {
        key: env.GOOGLE_API_KEY,
        address
      }
    });
    responseBody = JSON.parse(response.body);
  } catch (err) {
    logger.error({ message: "Google geocode failed ", address, err });
    return;
  }

  if (responseBody.status === "REQUEST_DENIED") {
    logger.error({
      message: "Google geocode request denied",
      address,
      errorMessage: responseBody.error_message
    });
  }

  const coords = get(responseBody, "results[0].geometry.location");
  if (!coords) {
    logger.error({
      message: "No lat/long found for address",
      address
    });
    return;
  }

  return [coords.lng, coords.lat];
}

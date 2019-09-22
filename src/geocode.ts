import got from "got";
import get from "lodash/get";
import * as env from "./env";

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
    console.error(err);
    return;
  }

  if (responseBody.status === "REQUEST_DENIED") {
    console.error(
      `Google geocode request denied: ${responseBody.error_message}`
    );
  }

  const coords = get(responseBody, "results[0].geometry.location");
  if (!coords) {
    console.error(
      `Address lookup succeeded, but no lat/long provided for address ${address}`
    );
    return;
  }

  return [coords.lng, coords.lat];
}

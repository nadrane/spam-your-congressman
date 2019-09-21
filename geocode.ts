import { Response } from "got";
import got from "got";
import get from "lodash/get";
import * as env from "./env";

export async function getLatLongFromAddress(
  address: string
): Promise<[number, number] | undefined> {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  let response: Response<string>;
  try {
    response = await got.get(url, {
      query: {
        key: env.GOOGLE_API_KEY,
        address
      }
    });
  } catch (err) {
    console.error(err);
    return;
  }

  const coords = get(JSON.parse(response.body), "results[0].geometry.location");
  if (!coords) {
    console.error(
      `Address lookup succeeded, but no lat/long provided for address ${address}`
    );
    return;
  }

  return [coords.lng, coords.lat];
}

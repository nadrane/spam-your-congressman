import * as shapefile from "shapefile";
import { Feature, Geometry, GeoJsonProperties } from "geojson";
import * as path from "path";
import * as turf from "@turf/turf";
import { getLatLongFromAddress } from "./geocode";
import { Congress, CongressPerson } from "./interfaces";
import fs from "fs";
import { promisify } from "util";
import { fipsToState } from "../data/fipsToState";

const readFileAsync = promisify(fs.readFile);

type Coordinates = [number, number];
type CongressionalIdentifier = { district: string; state: string };

class CongressPersonLookup {
  districts?: Array<Feature<Geometry, GeoJsonProperties>>;
  congress?: Congress;

  async loadCongressAndDistrictData() {
    console.log("Loading congress and district data");
    const dataDir = path.join("__dirname", "..", "data");

    try {
      const featureCollectionPromise = shapefile.read(
        path.join(dataDir, "arcgisDistricts", "tl_2018_us_cd116.shp"),
        path.join(dataDir, "arcgisDistricts", "tl_2018_us_cd116.dbf")
      );
      const congressPromise = readFileAsync(path.join(dataDir, "congress.jl"));

      const [featureCollection, congress] = await Promise.all([
        featureCollectionPromise,
        congressPromise
      ]);

      this.congress = congress
        .toString()
        .split("\n")
        .filter(line => line)
        .map(congressmanString => JSON.parse(congressmanString));
      this.districts = featureCollection.features;
    } catch (err) {
      console.error(err);
      throw new Error("Failed to load district or congress data");
    }
    console.log("Finished loading congress and district data");
  }

  private findDistrict(
    coords: Coordinates
  ): CongressionalIdentifier | undefined {
    if (!this.districts) {
      throw new Error(
        "Must call loadCongressAndDistrictData before searching the district data set"
      );
    }
    const point = turf.point(coords);
    for (const district of this.districts) {
      // There should be any features of other types, but this typeguard satisfies the compiler
      if (district.geometry.type === "Polygon") {
        const polygon = turf.polygon(
          district.geometry.coordinates,
          district.properties
        );
        if (turf.booleanPointInPolygon(point, polygon)) {
          if (!polygon.properties) {
            throw new Error("District polygon not properly defined");
          }
          return {
            district: polygon.properties.CD116FP.replace(/^0+/, ""),
            state: fipsToState[polygon.properties.STATEFP]
          };
        }
      }
    }
  }

  async findByAddress(address: string): Promise<CongressPerson | undefined> {
    if (!this.congress) {
      throw new Error(
        "Must call loadCongressAndDistrictData before searching for a congress person"
      );
    }

    const coords = await getLatLongFromAddress(address);
    if (!coords) {
      return;
    }

    const congressionalIdentifier = this.findDistrict(coords);
    if (!congressionalIdentifier) {
      return;
    }

    console.log(congressionalIdentifier);
    return this.congress.find(
      (congressPerson: CongressPerson) =>
        congressPerson.district === congressionalIdentifier.district &&
        congressionalIdentifier.state === congressPerson.state
    );
  }
}

export default new CongressPersonLookup();

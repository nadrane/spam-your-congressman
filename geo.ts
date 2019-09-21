import * as shapefile from "shapefile";
import { Feature, Geometry, GeoJsonProperties } from "geojson";
import * as path from "path";
import * as turf from "@turf/turf";

type Coordinates = [number, number];

export class DistrictLookup {
  districts?: Array<Feature<Geometry, GeoJsonProperties>>;

  async loadDistrictData() {
    const dataDir = path.join("__dirname", "..", "data");
    try {
      const featureCollection = await shapefile.read(
        path.join(dataDir, "arcgisDistricts", "tl_2018_us_cd116.shp"),
        path.join(dataDir, "arcgisDistricts", "tl_2018_us_cd116.dbf")
      );
      this.districts = featureCollection.features;
    } catch (err) {
      throw new Error("Failed to load district data");
    }
  }

  findDistrict(coords: Coordinates) {
    if (!this.districts) {
      throw new Error(
        "Must call loadDistrictData before searching the district data set"
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
          console.log(polygon.properties);
        }
      }
    }
  }
}

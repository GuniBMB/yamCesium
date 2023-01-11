import * as Cesium from "cesium";

import BaiduMercatorProjection from "./BaiduMercatorProjection";
import CoordTransform from "../../transform/CoordTransform";
import { Cartesian2, Ellipsoid } from "cesium";

interface BaiduMercatorTilingSchemeOptions {
  resolutions?: number[];
  ellipsoid?: Ellipsoid;
  numberOfLevelZeroTilesX?: number;
  numberOfLevelZeroTilesY?: number;
  rectangleSouthwestInMeters?: Cartesian2;
  rectangleNortheastInMeters?: Cartesian2;
}


/**
 * @class
 * @extends Cesium.WebMercatorTilingScheme
 */
class BaiduMercatorTilingScheme extends Cesium.WebMercatorTilingScheme {
  _projection: any = {};
  resolutions: any = [];
  _rectangle: any = {};

  constructor(options: BaiduMercatorTilingSchemeOptions) {
    super(options);
    let projection = new BaiduMercatorProjection();
    this._projection.project = function(cartographic: any, result: any = []) {
      result = result || {};
      result = CoordTransform.WGS84ToGCJ02(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude)
      );
      result = CoordTransform.GCJ02ToBD09(result[0], result[1]);
      result[0] = Math.min(result[0], 180);
      result[0] = Math.max(result[0], -180);
      result[1] = Math.min(result[1], 74.000022);
      result[1] = Math.max(result[1], -71.988531);
      result = projection.lngLatToPoint({
        lng: result[0],
        lat: result[1]
      });
      return new Cesium.Cartesian2(result.x, result.y);
    };
    this._projection.unproject = function(cartesian: any, result: any = []) {
      result = result || {};
      result = projection.mercatorToLngLat({
        lng: cartesian.x,
        lat: cartesian.y
      });
      result = CoordTransform.BD09ToGCJ02(result.lng, result.lat);
      result = CoordTransform.GCJ02ToWGS84(result[0], result[1]);
      return new Cesium.Cartographic(
        Cesium.Math.toRadians(result[0]),
        Cesium.Math.toRadians(result[1])
      );
    };
    this.resolutions = options.resolutions || [];
  }

  /**
   *
   * @param x
   * @param y
   * @param level
   * @param result
   * @returns {module:cesium.Rectangle|*}
   */
  // @ts-ignore
  tileXYToNativeRectangle(x: number, y: number, level: string, result: any) {
    const tileWidth = this.resolutions[level];
    const west = x * tileWidth;
    const east = (x + 1) * tileWidth;
    const north = ((y = -y) + 1) * tileWidth;
    const south = y * tileWidth;

    if (!Cesium.defined(result)) {
      return new Cesium.Rectangle(west, south, east, north);
    }

    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }

  /**
   *
   * @param position
   * @param level
   * @param result
   * @returns {undefined|*}
   */
  // @ts-ignore
  positionToTileXY(position: any, level: string, result: any) {
    const rectangle = this._rectangle;
    if (!Cesium.Rectangle.contains(rectangle, position)) {
      return undefined;
    }
    const projection = this._projection;
    const webMercatorPosition = projection.project(position);
    if (!Cesium.defined(webMercatorPosition)) {
      return undefined;
    }
    const tileWidth = this.resolutions[level];
    const xTileCoordinate = Math.floor(webMercatorPosition.x / tileWidth);
    const yTileCoordinate = -Math.floor(webMercatorPosition.y / tileWidth);
    if (!Cesium.defined(result)) {
      return new Cesium.Cartesian2(xTileCoordinate, yTileCoordinate);
    }
    result.x = xTileCoordinate;
    result.y = yTileCoordinate;
    return result;
  }
}

export default BaiduMercatorTilingScheme;

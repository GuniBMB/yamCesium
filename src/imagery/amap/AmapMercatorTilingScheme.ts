import * as Cesium from "cesium";

import CoordTransform from "../../transform/CoordTransform";
import { Cartesian2, Ellipsoid } from "cesium";

/**
 * @class
 * @desc 高德地图瓦片坐标系
 * @extends Cesium.WebMercatorTilingScheme
 */
class AmapMercatorTilingScheme extends Cesium.WebMercatorTilingScheme {
  _projection: any = {};

  constructor(options?: {
    ellipsoid?: Ellipsoid;
    numberOfLevelZeroTilesX?: number;
    numberOfLevelZeroTilesY?: number;
    rectangleSouthwestInMeters?: Cartesian2;
    rectangleNortheastInMeters?: Cartesian2;
  }) {
    super(options);
    let projection = new Cesium.WebMercatorProjection();
    this._projection.project = function(cartographic: any, result: any = []) {
      result = CoordTransform.WGS84ToGCJ02(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude)
      );
      result = projection.project(
        new Cesium.Cartographic(
          Cesium.Math.toRadians(result[0]),
          Cesium.Math.toRadians(result[1])
        )
      );
      return new Cesium.Cartesian2(result.x, result.y);
    };
    this._projection.unproject = function(cartesian: any, result: any = []) {
      let cartographic = projection.unproject(cartesian);
      result = CoordTransform.GCJ02ToWGS84(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude)
      );
      return new Cesium.Cartographic(
        Cesium.Math.toRadians(result[0]),
        Cesium.Math.toRadians(result[1])
      );
    };
  }
}

export default AmapMercatorTilingScheme;

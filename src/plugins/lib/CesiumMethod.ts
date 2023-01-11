// @ts-ignore
// const turf = window.turf;
import * as turf from "@turf/turf";
import * as Cesium from "cesium";

class CesiumMethod {
  viewer: Cesium.Viewer;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  /**
   * 笛卡尔转经纬度
   * @param {Cartesian3} cartesian
   * @param withHeight
   * @return {Array<Number>}
   */
  static cartesian3ToLngLat(cartesian: Cesium.Cartesian3, withHeight: boolean = false) {
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    let lon = Cesium.Math.toDegrees(cartographic.longitude);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let height = cartographic.height;
    if (withHeight) {
      return [lon, lat, height];
    } else {
      return [lon, lat];
    }
  }

  /**
   * 笛卡尔转经纬度
   * @param {Cartesian3} cartesian
   * @param withHeight
   * @return {Array<Number>}
   */
  static cartesian2ToLngLat(cartesian: Cesium.Cartesian3, withHeight: boolean = false) {
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    let lon = Cesium.Math.toDegrees(cartographic.longitude);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let height = cartographic.height;
    if (withHeight) {
      return [lon, lat, height];
    } else {
      return [lon, lat];
    }
  }

  /**
   * 笛卡尔转经纬度
   * @param cartesian3s
   * @param withHeight
   * @return {Array<Array<number>>}
   */
  static cartesian3sToLngLats(cartesian3s: Array<Cesium.Cartesian3>, withHeight: boolean = false) {
    let coordinates = [];
    for (let i = 0, len = cartesian3s.length; i < len; i++) {
      coordinates.push(this.cartesian3ToLngLat(cartesian3s[i], withHeight));
    }
    return coordinates;
  }

  /**
   * 根据笛卡尔解析绝对中心坐标点
   * @param {Array<Cartesian3>} cartesian3s
   * @return {Feature<Point, Properties>}
   */
  static calcAbsoluteCenterByCartesian3s(cartesian3s: Array<Cesium.Cartesian3>) {
    let turfPoints = [];
    for (let i = 0, len = cartesian3s.length; i < len; i++) {
      turfPoints.push(turf.point(this.cartesian3ToLngLat(cartesian3s[i])));
    }
    return turf.center(turf.featureCollection(turfPoints));
  }

  /**
   * 根据笛卡尔解析绝对中心坐标点
   * @param {Array<Cartesian3>} cartesian3s
   * @return {{coord: coord, cart: Cartesian3}}
   */
  static countPolygonCenter(cartesian3s: Array<Cesium.Cartesian3>) {
    let tempPos = [];
    for (let i = 0, len = cartesian3s.length; i < len; i++) {
      tempPos.push(turf.point(this.cartesian3ToLngLat(cartesian3s[i])));
    }
    let center = turf.center(turf.featureCollection(tempPos));
    let coord = center.geometry.coordinates;
    let cartesian = Cesium.Cartesian3.fromDegrees(coord[0], coord[1]);
    return {
      coord: coord,
      cart: cartesian
    };
  }

  /**
   * 计算多边形面积
   * @param {Array<Array>} coords 一个包含经纬度坐标的二维数组
   * @return {number}
   */
  static calcPolygonArea(coords: Array<Array<number>>) {
    let polygon = turf.polygon([coords]);
    return turf.area(polygon);
  }

  /**
   * 获取地形高度
   * @param positions
   * @param callback
   */
  getTerrainHeight(positions: Cesium.Cartographic[], callback: Function) {
    let terrain = this.viewer.scene.terrainProvider;
    let promise = Cesium.sampleTerrainMostDetailed(terrain, positions);
    // @ts-ignore
    // Cesium.when(promise, function(updatedPositions: Cesium.Cartesian3) {
    //   callback(updatedPositions);
    // }).otherwise(function(error: any) {
    //   console.log(error);
    // });
  }

  /**
   * 获取camera高度
   */
  getCameraHeight() {
    if (this.viewer) {
      let scene = this.viewer.scene;
      let ellipsoid = scene.globe.ellipsoid;
      return ellipsoid.cartesianToCartographic(this.viewer.camera.position).height;
    }
    return null;
  }

  /**
   * 获取camera中心点坐标
   * @returns {{lon: number, lat: number, height: number}}
   */
  getCenterPosition() {
    let result = this.viewer.camera.pickEllipsoid(new Cesium.Cartesian2(this.viewer.canvas.clientWidth / 2, this.viewer.canvas
      .clientHeight / 2));
    let curPosition: Cesium.Cartographic;
    if (!result) {
      return {};
    }
    curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(result);
    let lon = curPosition.longitude * 180 / Math.PI;
    let lat = curPosition.latitude * 180 / Math.PI;
    let height = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(this.viewer.camera.position).height;
    return {
      lon: lon,
      lat: lat,
      height: height
    };
  }

  /**
   * 笛卡尔添加高度
   */
  static addHeightWithCartesian3(cartesian: Cesium.Cartesian3, height: number) {
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    return Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height + height);
  }

  /**
   * 根据两个笛卡尔坐标获取之间的距离
   * @param cartesian1
   * @param cartesian2
   */
  static measureDistanceWithCartesian3(cartesian1: Cesium.Cartesian3, cartesian2: Cesium.Cartesian3) {
    return Cesium.Cartesian3.distance(cartesian1, cartesian2);
  }

  static _computeCirclePolygon(positions: any) {
    let _this = this;
    try {
      if (!positions || positions.length < 2) {
        return null;
      }
      let cp = positions[0];
      let r = _this._computeCircleRadius3D(positions);
      return _this._computeCirclePolygon2(cp, r);
    } catch (err) {
      return null;
    }
  }

  static _computeCirclePolygon2(center: any, radius: any) {
    try {
      if (!center || radius <= 0) {
        return null;
      }
      // @ts-ignore
      let cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
        center: center,
        semiMajorAxis: radius,
        semiMinorAxis: radius,
        rotation: 0,
        granularity: 0.005
      }, false, true);
      if (!cep || !cep.outerPositions) {
        return null;
      }
      let pnts = Cesium.Cartesian3.unpackArray(cep.outerPositions);
      pnts[pnts.length] = pnts[0];
      return pnts;
    } catch (err) {
      return null;
    }
  }

  static _computeCircleRadius3D(positions: any) {
    let c1 = positions[0];
    let c2 = positions[1];
    let x = Math.pow(c1.x - c2.x, 2);
    let y = Math.pow(c1.y - c2.y, 2);
    let z = Math.pow(c1.z - c2.z, 2);
    return Math.sqrt(x + y + z);
  }
}

export default CesiumMethod;

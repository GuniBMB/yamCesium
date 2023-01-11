declare module  "src/types/yamCesium" {

  import * as Cesium from "cesium";

  export class Map {
    camera: Camera;
    constructor(viewer: Cesium.Viewer);
  }

  export class Immersion {
    viewer: Cesium.Viewer;
    scene: Cesium.Scene;
    canvas: HTMLCanvasElement;
    viewModel: any;
    constructor(viewer: Cesium.Viewer);
    enable(): undefined;
    bindModel(): undefined;
  }

  export class Camera {
    viewer: Cesium.Viewer;
    /**
     * 第一人称视角
     */
    immersion: Immersion;
    constructor(viewer: any);
  }

  export class CesiumMethod {
    /**
     * 笛卡尔转经纬度
     * @param {Cartesian3} cartesian
     * @param withHeight
     * @return {Array<Number>}
     */
    static cartesian3ToLngLat(cartesian: Cesium.Cartesian3, withHeight: boolean): Array<number>;

    /**
     * 笛卡尔转经纬度
     * @param {Cartesian3} cartesian
     * @param withHeight
     * @return {Array<Number>}
     */
    static cartesian2ToLngLat(cartesian: Cesium.Cartesian3, withHeight: boolean): Array<number>;

    /**
     * 笛卡尔转经纬度
     * @param cartesian3s
     * @param withHeight
     * @return {Array<Array<number>>}
     */
    static cartesian3sToLngLats(cartesian3s: Array<Cesium.Cartesian3>, withHeight: boolean): Array<Array<number>>;

    /**
     * 根据笛卡尔解析绝对中心坐标点
     * @param {Array<Cartesian3>} cartesian3s
     * @return {Feature<Point, Properties>}
     */
    static calcAbsoluteCenterByCartesian3s(cartesian3s: Array<Cesium.Cartesian3>): any;


    /**
     * 根据笛卡尔解析绝对中心坐标点
     * @param {Array<Cartesian3>} cartesian3s
     * @return {{coord: coord, cart: Cartesian3}}
     */
    static countPolygonCenter(cartesian3s: Array<Cesium.Cartesian3>): any;

    /**
     * 计算多边形面积
     * @param {Array<Array>} coords 一个包含经纬度坐标的二维数组
     * @return {number}
     */
    static calcPolygonArea(coords: Array<Array<number>>) : any;

    /**
     * 获取地形高度
     * @param positions
     * @param callback
     */
    getTerrainHeight(positions: Cesium.Cartographic[], callback: Function): void;

    /**
     * 获取camera高度
     */
    getCameraHeight(): number;

    /**
     * 获取camera中心点坐标
     * @returns {{lon: number, lat: number, height: number}}
     */
    getCenterPosition(): any;

    /**
     * 笛卡尔添加高度
     */
    static addHeightWithCartesian3(cartesian: Cesium.Cartesian3, height: number): Cesium.Cartesian3;

    /**
     * 根据两个笛卡尔坐标获取之间的距离
     * @param cartesian1
     * @param cartesian2
     */
    static measureDistanceWithCartesian3(cartesian1: Cesium.Cartesian3, cartesian2: Cesium.Cartesian3): number;
  }

  export class Canvas2Image {
    /**
     * 将canvas转换为图片
     * @param canvas
     * @param width
     * @param height
     * @param type
     * @param fileName
     * @returns {string}
     */
    static saveAsImage(canvas: HTMLCanvasElement | string, width: number, height: number, type: string, fileName: string): any;
  }

  export class CesiumZh {
    /**
     * 语言包
     */
    load: Function;
  }

  // export {default as turf } from "@turf/turf";
}
declare module "src/scene/camera/Immersion" {
  import {Immersion} from "src/types/yamCesium";
  export default Immersion;
}
declare module "src/scene/camera/Camera" {
  import {Camera} from "src/types/yamCesium";
  export default Camera;
}
declare module "src/cesium/Map" {
  import {Map} from "src/types/yamCesium";
  export default Map;
}

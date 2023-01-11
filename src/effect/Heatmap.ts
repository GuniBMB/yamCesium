/**
 * 热力图
 */

import HeatMap from "heatmap-ts";

import { RendererConfig } from "heatmap-ts/dist/renderer";
import * as Cesium from "cesium";

interface config extends RendererConfig {
  onExtremaChange?: Function;
  container?: HTMLElement;
}

interface heatMapOptions {
  viewer: Cesium.Viewer;
  rect: Cesium.Rectangle;
  max: number;
  data: any[];
  radius?: number;
  maxOpacity?: number;
  minOpacity?: number;
  blur?: number;
}

class Heatmap {

  /**
   * Viewer
   * @readonly
   * @private
   */
  private readonly _viewer: Cesium.Viewer;

  /**
   * 热力图
   * @private
   */
  heatmap: any;

  constructor(options: heatMapOptions) {
    this._viewer = options.viewer;
    const heatDoc = document.createElement("div");
    heatDoc.setAttribute("style", "width:1000px;height:1000px;margin: 0px;display: none;");
    document.body.appendChild(heatDoc);
    let config: config = {
      container: heatDoc,
      radius: Cesium.defaultValue(options.radius, 20),
      maxOpacity: Cesium.defaultValue(options.maxOpacity, .5),
      minOpacity: Cesium.defaultValue(options.minOpacity, 0),
      blur: Cesium.defaultValue(options.blur, .75)
    };
    this.heatmap = new HeatMap(config);
    this.render(options.max, options.data);
    this.createRectangle(this._viewer, options.rect);
    return this.heatmap;
  }

  render(max: number, data: any) {
    this.heatmap.setData({
      max: max,
      data: data
    });
  }

  createRectangle(viewer: Cesium.Viewer, rect: Cesium.Rectangle) {
    this.heatmap = viewer.entities.add({
      name: "Rotating rectangle with rotating texture coordinate",
      show: true,
      rectangle: {
        coordinates: rect,
        material: this.heatmap.renderer.canvas // 核心语句，填充热力图
      }
    });
  }

  /**
   * 构建一些随机数据点
   * @param len 数据点个数
   */
  static randomData(len: number) {
    const points = [];
    let max = 0;
    const width = 1000;
    const height = 1000;
    while (len--) {
      const val = Math.floor(Math.random() * 1000);
      max = Math.max(max, val);
      const point = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        value: val
      };
      points.push(point);
    }
    return { max: max, data: points };
  }

}

export default Heatmap;

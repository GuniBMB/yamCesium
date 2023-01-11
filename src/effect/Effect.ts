/**
 * 效果
 */

import CircleSpread from "./CircleSpread";
import RadarScan from "./RadarScan";
import HeatMap from "./Heatmap";

class Effect {

  /**
   * 圆扩散
   */
  circleSpread = CircleSpread;

  /**
   * 雷达扫描
   */
  radarScan = RadarScan;

  /**
   * 热力图
   */
  heatMap = HeatMap;
}

export default new Effect();

import * as Cesium from "cesium";

import AmapMercatorTilingScheme from "./AmapMercatorTilingScheme";

const IMG_URL =
  "https://webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";

const ELEC_URL =
  "https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";

const CVA_URL =
  "https://webst{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";

interface AmapImageryProviderOptions extends Cesium.UrlTemplateImageryProvider.ConstructorOptions {
  style?: string;
  crs?: string;
}

/**
 * @class
 * @desc 高德地图图层
 * @extends Cesium.UrlTemplateImageryProvider
 */
class AmapImageryProvider extends Cesium.UrlTemplateImageryProvider {
  constructor(options: AmapImageryProviderOptions) {
    options["url"] =
      options["url"]
        ? options["url"]
        : options.style === "img"
          ? IMG_URL
          : options.style === "cva"
            ? CVA_URL
            : ELEC_URL;
    if (!options.subdomains || !options.subdomains.length) {
      options["subdomains"] = ["01", "02", "03", "04"];
    }
    if (options.crs === "WGS84") {
      options["tilingScheme"] = new AmapMercatorTilingScheme();
    }
    super(options);
  }
}

export default AmapImageryProvider;

import * as Cesium from "cesium";

const MAP_URL =
  "https://t{s}.tianditu.gov.cn/DataServer?T={style}_w&x={x}&y={y}&l={z}&tk={key}";

interface TdtImageryProviderOptions extends Cesium.UrlTemplateImageryProvider.ConstructorOptions {
  style?: string;
  subdomains?: string[];
  key?: string;
}

class TdtImageryProvider extends Cesium.UrlTemplateImageryProvider {
  constructor(options: TdtImageryProviderOptions) {
    super({
      url: MAP_URL.replace(/\{style\}/g, options.style || "vec").replace(
        /\{key\}/g,
        options.key || ""
      ),
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      maximumLevel: 18
    });
  }
}

export default TdtImageryProvider;

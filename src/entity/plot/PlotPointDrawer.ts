import PlotToolTip from "./PlotToolTip";
import * as Cesium from "cesium";
import layer from "../../plugins/lib/layer/Layer";
import Plot from "./Plot";

interface drawOptions {
  confirmHandler?: Function; // 自定义确认弹窗事件
  position?: any;
}

class PlotPointDrawer {
  viewer: any;
  scene: any;
  clock: any;
  canvas: any;
  camera: any;
  ellipsoid: any;
  tooltip: any;
  entity: any;
  position: any;
  drawHandler: any;
  modifyHandler: any;
  okHandler: any;
  cancelHandler: any;
  image: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjUlEQVQ4T5WTO0gDQRCG598TUohgLqUIChcSEBsfjQ9MEWvtFDs7E+0tUllaa5JSECzstLdI46NQGxESc2JELBMLCxEuO86dXkhiAndX7c3O/PvPzregHl+sWBlpOioOQyXdbW7qsjGgq/VM4r07Hd0Bs2gfMfMkgT6hKcKAI0nfTBwF8NDIWJvtNR0CZsF+kcSaBFO9nEnskQiDjaw17u+3BKKF6q38TPcp7Agz0d1HNj7jBj2BWNHeF9sLspwLIiA5p9LOaz1j7cLM26Ni+wygqYDFXhoz3YOwCvPwaRkKObG1FEZAzF+S1nuI5e0dDV6XXubDCdANGCeIFp63xNAGiBdDCTBdM9Qxhg+qKWUgJyLpMAIMKrFD0oJQp1mdBx2hf4g7SgW94o3RpU+udVaWE0FcSHFJxlhzqWyB5FIobYwFEZAJ1HwaO1D+o9EWkbU+QldyesSnsEVie7JLpdacFotf4siQgqYicjTTkFK4cOlrz//3Gr07ETqJdRJQiV/qdIWgyo1t663b2Q/kAI6uzOBy0gAAAABJRU5ErkJggg==";
  toolBarIndex: any;
  layerId: string = "globeEntityDrawerLayer";
  isClickConfirm: boolean = false;

  constructor(viewer: any) {
    this.viewer = viewer;
    this.scene = viewer.scene;
    this.clock = viewer.clock;
    this.canvas = viewer.scene.canvas;
    this.camera = viewer.scene.camera;
    this.ellipsoid = viewer.scene.globe.ellipsoid;
    this.tooltip = new PlotToolTip(viewer.container);
  }

  clear() {
    if (this.drawHandler) {
      this.drawHandler.destroy();
      this.drawHandler = null;
    }
    if (this.modifyHandler) {
      this.modifyHandler.destroy();
      this.modifyHandler = null;
    }
    if (this.toolBarIndex != null) {
      // layer.close(this.toolBarIndex);
    }
    this.entity = null;
    this._clearMarkers(this.layerId);
    this.tooltip.setVisible(false);
  }

  showModifyPoint(options: drawOptions) {
    // this.position = position;
    // this.okHandler = okHandler;
    // this.cancelHandler = cancelHandler;
    this.isClickConfirm = false;
    this.entity = null;
    // this._createPoint();
    // this._startModify();

    return this.startDrawPoint(options);
  }

  startDrawPoint(options: drawOptions) {
    // this.okHandler = okHandler;
    // this.cancelHandler = cancelHandler;
    this.entity = null;
    this.position = options.position; // 如果有传入position，则直接使用，没有传入则为undefined
    const floatingPoint = null;
    this.drawHandler = new Cesium.ScreenSpaceEventHandler(this.canvas);

    this.drawHandler.setInputAction((event: any) => {
      const wp = event.position;
      if (!Cesium.defined(wp)) {
        return;
      }
      const ray = this.camera.getPickRay(wp);
      if (!Cesium.defined(ray)) {
        return;
      }
      const cartesian = this.scene.globe.pick(ray, this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      this.position = cartesian;
      this.entity.position.setValue(cartesian);
      this.tooltip.setVisible(false);
      this._startModify();
      this.isClickConfirm = true;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.drawHandler.setInputAction((event: any) => {
      const wp = event.endPosition;
      if (!Cesium.defined(wp)) {
        return;
      }
      this.tooltip.showAt(wp, "<p>选择位置</p>");
      const ray = this.camera.getPickRay(wp);
      if (!Cesium.defined(ray)) {
        return;
      }
      const cartesian = this.scene.globe.pick(ray, this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      this.position = cartesian;
      if (this.entity == null) {
        this._createPoint();
      } else {
        this.entity.position.setValue(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return new Promise((resolve, reject) => {
      // 等待点击确认点位
      const timeId = setInterval(() => {
        // 如果确认点位则清楚定时器
        if (this.isClickConfirm) {
          this.isClickConfirm = false;
          clearInterval(timeId);
          // 如果自定义了确认按钮则显示自定义按钮
          if (options && options.confirmHandler) {
            // confirmHandler需返回一个promise事件
            options.confirmHandler().then(() => {
              this.clear();
              resolve(this.position);
            }).catch(() => {
              this.clear();
              reject();
            });
          } else {
            this._showToolBar().then(() => {
              this.clear();
              resolve(this.position);
            }).catch((err) => {
              this.clear();
              reject(err);
            });
          }
        }
      }, 100);
    });
  }

  _startModify() {
    let isMoving = false;
    let pickedAnchor: any = null;
    if (this.drawHandler) {
      this.drawHandler.destroy();
      this.drawHandler = null;
    }
    // this._showToolBar();

    this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.canvas);

    this.modifyHandler.setInputAction((event: any) => {
      const wp = event.position;
      if (!Cesium.defined(wp)) {
        return;
      }
      const ray = this.camera.getPickRay(wp);
      if (!Cesium.defined(ray)) {
        return;
      }
      const cartesian = this.scene.globe.pick(ray, this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (isMoving) {
        isMoving = false;
        pickedAnchor.position.setValue(cartesian);
        const oid = pickedAnchor.oid;
        this.position = cartesian;
        this.tooltip.setVisible(false);
      } else {
        const pickedObject = this.scene.pick(wp);
        if (!Cesium.defined(pickedObject)) {
          return;
        }
        if (!Cesium.defined(pickedObject.id)) {
          return;
        }
        const entity = pickedObject.id;
        if (entity.layerId != this.layerId || entity.flag != "anchor") {
          return;
        }
        pickedAnchor = entity;
        isMoving = true;
        this.tooltip.showAt(wp, "<p>移动位置</p>");
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.modifyHandler.setInputAction((event: any) => {
      if (!isMoving) {
        return;
      }
      const wp = event.endPosition;
      if (!Cesium.defined(wp)) {
        return;
      }
      this.tooltip.showAt(wp, "<p>移动位置</p>");

      const ray = this.camera.getPickRay(wp);
      if (!Cesium.defined(ray)) {
        return;
      }
      const cartesian = this.scene.globe.pick(ray, this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      pickedAnchor.position.setValue(cartesian);
      const oid = pickedAnchor.oid;
      this.position = cartesian;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  _createPoint() {
    const point = this.viewer.entities.add({
      position: this.position,
      billboard: {
        image: this.image,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //绝对贴地
        clampToGround: true,
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    });
    point.oid = 0;
    point.layerId = this.layerId;
    point.flag = "anchor";
    this.entity = point;
    return point;
  }

  _showToolBar() {
    return new Promise<void>((resolve, reject) => {
      layer.confirm({
        title: false,
        content: "是否确认该点位？",
        type: 1,
        area: ["300px", "200px"],
        offset: "80px",
        skin: "yam-layer-title-lan", //加上边框
        shade: false,
        shadeClose: false,
        move: true
      }).then((index: any) => {
        this.clear();
        layer.close(index);
        resolve();
      }).catch((index: any) => {
        this.clear();
        layer.close(index);
        reject();
      });
    });
  }

  _getLonLat(cartesian: any) {
    const cartographic = this.ellipsoid.cartesianToCartographic(cartesian);
    cartographic.height = this.viewer.scene.globe.getHeight(cartographic);
    const pos = {
      lon: cartographic.longitude,
      lat: cartographic.latitude,
      alt: cartographic.height,
      height: cartographic.height
    };
    pos.lon = Cesium.Math.toDegrees(pos.lon);
    pos.lat = Cesium.Math.toDegrees(pos.lat);
    return pos;
  }

  _clearMarkers(layerName: string) {
    var entityList = this.viewer.entities.values;
    if (entityList == null || entityList.length < 1)
      return;
    for (let i = 0; i < entityList.length; i++) {
      var entity = entityList[i];
      if (entity.layerId == layerName) {
        this.viewer.entities.remove(entity);
        i--;
      }
    }
  }
}
export default PlotPointDrawer;

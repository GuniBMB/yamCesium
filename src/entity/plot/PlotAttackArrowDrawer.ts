import PlotToolTip from "./PlotToolTip";
import * as Cesium from "cesium";
import { xp } from "./algorithm";
import layer from "../../plugins/lib/layer/Layer";

class PlotAttackArrowDrawer {
  viewer: any;
  scene: any;
  clock: any;
  canvas: any;
  camera: any;
  ellipsoid: any;
  tooltip: any;
  entity: any;
  positions: any = [];
  tempPositions: any = [];
  drawHandler: any;
  modifyHandler: any;
  okHandler: any;
  cancelHandler: any;
  dragIcon: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA+0lEQVQoU2NkQALX5VjTGBkYXYBCllDh40B6k8ajX0tgyhhhjBtybKuAHAUGhv9T/zExHwSJM/37a8/AwJj9n4HhAVBTGEgMrAGq+Kr6o1+NN2TY9BgZ/9v8Z2L4wfiP4bL649+nb8qx1QM1+QI1mTBCnZEA5FhBJRqQnQk0sQFskBzbpv8M/7cwAhmLGP7/Pw6UOPOfkfEUsmI4+x+DPgPjf2sGRkZLkIb7LP8YXf8w/7Nj+M84F5sGxv//s5n/M+36w/R/N1kaSHMS1NM+QE/7EfD0MaCnF8CC9QyQsZlAsGqD4oK8iEOK7Rgg2w85aQCdsUfz0e9ZMDUAG9CXv0chMrwAAAAASUVORK5CYII=";
  dragIconLight: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjUlEQVQ4T5WTO0gDQRCG598TUohgLqUIChcSEBsfjQ9MEWvtFDs7E+0tUllaa5JSECzstLdI46NQGxESc2JELBMLCxEuO86dXkhiAndX7c3O/PvPzregHl+sWBlpOioOQyXdbW7qsjGgq/VM4r07Hd0Bs2gfMfMkgT6hKcKAI0nfTBwF8NDIWJvtNR0CZsF+kcSaBFO9nEnskQiDjaw17u+3BKKF6q38TPcp7Agz0d1HNj7jBj2BWNHeF9sLspwLIiA5p9LOaz1j7cLM26Ni+wygqYDFXhoz3YOwCvPwaRkKObG1FEZAzF+S1nuI5e0dDV6XXubDCdANGCeIFp63xNAGiBdDCTBdM9Qxhg+qKWUgJyLpMAIMKrFD0oJQp1mdBx2hf4g7SgW94o3RpU+udVaWE0FcSHFJxlhzqWyB5FIobYwFEZAJ1HwaO1D+o9EWkbU+QldyesSnsEVie7JLpdacFotf4siQgqYicjTTkFK4cOlrz//3Gr07ETqJdRJQiV/qdIWgyo1t663b2Q/kAI6uzOBy0gAAAABJRU5ErkJggg==";
  material: any;
  outlineMaterial: any;
  fill = true;
  outline = true;
  outlineWidth = 2;
  extrudedHeight = 0;
  toolBarIndex: any;
  markers: any = {};
  layerId = "globeDrawerLayer";
  shapeColor: any;
  outlineColor: any;
  shapeName: any;
  terrainHeight: any;
  isClickConfirm = false;

  constructor(viewer: any) {
    let _this = this;
    _this.viewer = viewer;
    _this.scene = viewer.scene;
    _this.clock = viewer.clock;
    _this.canvas = viewer.scene.canvas;
    _this.camera = viewer.scene.camera;
    _this.ellipsoid = viewer.scene.globe.ellipsoid;
    _this.tooltip = new PlotToolTip(viewer.container);
  }

  clear() {
    let _this = this;
    if (_this.drawHandler) {
      _this.drawHandler.destroy();
      _this.drawHandler = null;
    }
    if (_this.modifyHandler) {
      _this.modifyHandler.destroy();
      _this.modifyHandler = null;
    }
    if (_this.toolBarIndex != null) {
      // layer.close(_this.toolBarIndex, function() {
      //   $("#shapeEditContainer").remove();
      // });
      _this.toolBarIndex = null;
    }
    _this._clearMarkers(_this.layerId);
    _this.tooltip.setVisible(false);
    // $("#shapeEditContainer").hide(); // 设置确定按钮隐藏
  }

  showModifyAttackArrow(options: any) {
    let _this = this;
    const arr = [];
    for (let i = 0; i < options.custom.length; i++) {
      const p = options.custom[i];
      const c = Cesium.Cartesian3.fromDegrees(p[0], p[1]);
      arr.push(c);
    }
    _this.positions = arr;
    _this._showModifyRegion2Map();

    return new Promise((resolve, reject) => {
      if (options && options.confirmHandler) {
        // confirmHandler需返回一个promise事件
        options.confirmHandler().then(() => {
          const lonLats = _this._getLonLatArr(_this.positions);
          const doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
          const positions = doubleArrow.polygonalPoint;
          const custom = doubleArrow.controlPoint;
          resolve({ positions: positions, custom: custom });
          this.clear();
          this.viewer.entities.remove(this.entity);
        }).catch(() => {
          this.clear();
          reject();
        });
      } else {
        this.createToolBar().then(() => {
          const lonLats = _this._getLonLatArr(_this.positions);
          const doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
          const positions = doubleArrow.polygonalPoint;
          const custom = doubleArrow.controlPoint;
          resolve({ positions: positions, custom: custom });
          this.clear();
          this.viewer.entities.remove(this.entity);
        }).catch(() => {
          this.clear();
          reject();
        });
      }
    });
  }

  startDrawAttackArrow(options: any) {
    let _this = this;
    _this.positions = [];
    let floatingPoint: any = null;

    // let definedColor = $("#paigusu").data("color2");
    // if (definedColor) {
    //     _this.shapeColor = "rgba(" + definedColor + ")"; // 设置自定义的绘图颜色
    // }

    _this.drawHandler = new Cesium.ScreenSpaceEventHandler(_this.canvas);

    _this.drawHandler.setInputAction((event: any) => {
      let position = event.position;
      if (!Cesium.defined(position)) {
        return;
      }
      let ray = _this.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = _this.scene.globe.pick(ray, _this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      let num = _this.positions.length;
      if (num == 0) {
        _this.positions.push(cartesian);
        floatingPoint = _this._createPoint(cartesian, -1);
        _this._showRegion2Map();
      }
      _this.positions.push(cartesian);
      let oid = _this.positions.length - 2;
      _this._createPoint(cartesian, oid);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    _this.drawHandler.setInputAction((event: any) => {
      let position = event.endPosition;
      if (!Cesium.defined(position)) {
        return;
      }
      if (_this.positions.length < 1) {
        _this.tooltip.showAt(position, "<p>选择起点</p>");
        return;
      }
      _this.tooltip.showAt(position, "<p>新增控制点</p><p>右键结束绘制</p>");

      let ray = _this.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = _this.scene.globe.pick(ray, _this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      floatingPoint.position.setValue(cartesian);
      _this.positions.pop();
      _this.positions.push(cartesian);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    _this.drawHandler.setInputAction((movement: any) => {
      if (_this.positions.length < 2) {
        return;
      }
      this.isClickConfirm = true;
      _this.positions.pop();
      _this.viewer.entities.remove(floatingPoint);
      _this.tooltip.setVisible(false);
      _this._startModify();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    _this.drawHandler.setInputAction((movement: any) => {
      if (_this.positions.length < 2) {
        return;
      }
      this.isClickConfirm = true;
      _this.positions.pop();
      _this.viewer.entities.remove(floatingPoint);
      _this.tooltip.setVisible(false);
      _this._startModify();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

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
              const lonLats = _this._getLonLatArr(_this.positions);
              const doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
              const positions = doubleArrow.polygonalPoint;
              const custom = doubleArrow.controlPoint;
              resolve({ positions: positions, custom: custom });
              this.clear();
              this.viewer.entities.remove(this.entity);
            }).catch(() => {
              this.clear();
              reject();
            });
          } else {
            this.createToolBar().then(() => {
              const lonLats = _this._getLonLatArr(_this.positions);
              const doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
              const positions = doubleArrow.polygonalPoint;
              const custom = doubleArrow.controlPoint;
              resolve({ positions: positions, custom: custom });
              this.clear();
              this.viewer.entities.remove(this.entity);
            }).catch(() => {
              this.clear();
              reject();
            });
          }
        }
      }, 100);
    });
  }

  _startModify() {
    let _this = this;
    let isMoving = false;
    let pickedAnchor: any = null;
    if (_this.drawHandler) {
      _this.drawHandler.destroy();
      _this.drawHandler = null;
    }

    _this.modifyHandler = new Cesium.ScreenSpaceEventHandler(_this.canvas);

    _this.modifyHandler.setInputAction((event: any) => {
      let position = event.position;
      if (!Cesium.defined(position)) {
        return;
      }
      let ray = _this.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = _this.scene.globe.pick(ray, _this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (isMoving) {
        isMoving = false;
        pickedAnchor.position.setValue(cartesian);
        let oid = pickedAnchor.oid;
        _this.positions[oid] = cartesian;
        _this.tooltip.setVisible(false);
      } else {
        let pickedObject = _this.scene.pick(position);
        if (!Cesium.defined(pickedObject)) {
          return;
        }
        if (!Cesium.defined(pickedObject.id)) {
          return;
        }
        let entity = pickedObject.id;
        if (entity.layerId != _this.layerId || entity.flag != "anchor") {
          return;
        }
        pickedAnchor = entity;
        isMoving = true;
        _this.tooltip.showAt(position, "<p>移动控制点</p>");
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    _this.modifyHandler.setInputAction((event: any) => {
      if (!isMoving) {
        return;
      }
      let position = event.endPosition;
      if (!Cesium.defined(position)) {
        return;
      }
      _this.tooltip.showAt(position, "<p>移动控制点</p>");

      let ray = _this.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = _this.scene.globe.pick(ray, _this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      pickedAnchor.position.setValue(cartesian);
      let oid = pickedAnchor.oid;
      _this.positions[oid] = cartesian;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  _showRegion2Map() {
    let _this = this;
    // if (_this.material == null) {
    _this.material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)");
    // }
    // if (_this.outlineMaterial == null) {
    _this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    // }

    let dynamicHierarchy = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 1) {
        let lonLats = _this._getLonLatArr(_this.positions);
        let doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
        let positions = doubleArrow.polygonalPoint;
        if (positions == null || positions.length < 3) {
          return null;
        }
        let pHierarchy = new Cesium.PolygonHierarchy(positions);
        return pHierarchy;
      } else {
        return null;
      }
    }, false);
    let outlineDynamicPositions = new Cesium.CallbackProperty(function() {
      if (_this.positions.length < 2) {
        return null;
      }
      let lonLats = _this._getLonLatArr(_this.positions);
      let doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
      let positions = doubleArrow.polygonalPoint;
      if (positions == null || positions.length < 3) {
        return null;
      }
      let firstPoint = positions[0];
      positions.push(firstPoint);
      return positions;
    }, false);
    let bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: _this.material,
        show: _this.fill
      }),
      polyline: {
        positions: outlineDynamicPositions,
        clampToGround: true,
        width: _this.outlineWidth,
        material: _this.outlineMaterial,
        show: _this.outline
      }
    };

    _this.entity = _this.viewer.entities.add(bData);
    _this.entity.layerId = _this.layerId;
  }

  _showModifyRegion2Map() {
    let _this = this;

    _this._startModify();
    _this._computeTempPositions();

    let dynamicHierarchy = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 1) {
        let lonLats = _this._getLonLatArr(_this.positions);
        let doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
        let positions = doubleArrow.polygonalPoint;
        if (positions == null || positions.length < 3) {
          return null;
        }
        let pHierarchy = new Cesium.PolygonHierarchy(positions);
        return pHierarchy;
      } else {
        return null;
      }
    }, false);
    let outlineDynamicPositions = new Cesium.CallbackProperty(function() {
      if (_this.positions.length < 2) {
        return null;
      }
      let lonLats = _this._getLonLatArr(_this.positions);
      let doubleArrow = xp.algorithm.tailedAttackArrow(lonLats);
      let positions = doubleArrow.polygonalPoint;
      if (positions == null || positions.length < 2) {
        return null;
      }
      let firstPoint = positions[0];
      positions.push(firstPoint);
      return positions;
    }, false);

    // if (_this.material == null) {
    _this.material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)")
    // }
    // if (_this.outlineMaterial == null) {
    _this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    // }
    let bData = {
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: _this.material,
        show: _this.fill
      }),
      polyline: {
        positions: outlineDynamicPositions,
        clampToGround: true,
        width: _this.outlineWidth,
        material: _this.outlineMaterial,
        show: _this.outline
      }
    };
    _this.entity = _this.viewer.entities.add(bData);
    _this.entity.layerId = _this.layerId;
    let positions = _this.positions;
    for (let i = 0; i < positions.length; i++) {
      _this._createPoint(positions[i], i);
    }
  }

  _createPoint(cartesian: any, oid: any) {
    let _this = this;
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: _this.dragIconLight,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
    point.oid = oid;
    point.layerId = _this.layerId;
    point.flag = "anchor";
    _this.markers[oid] = point;
    return point;
  }

  _computeTempPositions() {
    let _this = this;

    let pnts = [].concat(_this.positions);
    let num = pnts.length;
    let first = pnts[0];
    let last = pnts[num - 1];
    if (!_this._isSimpleXYZ(first, last)) {
      pnts.push(first);
      num += 1;
    }
    _this.tempPositions = [];
    for (let i = 1; i < num; i++) {
      let p1 = pnts[i - 1];
      let p2 = pnts[i];
      let cp = _this._computeCenterPotition(p1, p2);
      _this.tempPositions.push(p1);
      _this.tempPositions.push(cp);
    }
  }

  _computeCenterPotition(p1: any, p2: any) {
    let _this = this;
    let c1 = _this.ellipsoid.cartesianToCartographic(p1);
    let c2 = _this.ellipsoid.cartesianToCartographic(p2);
    let cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5);
    let cp = _this.ellipsoid.cartographicToCartesian(cm);
    return cp;
  }

  createToolBar() {
    return new Promise<void>((resolve, reject) => {
      layer.confirm({
        title: false,
        content: "是否完成绘制？",
        type: 1,
        area: ["300px", "200px"],
        offset: "80px",
        skin: "yam-layer-title-lan", //加上边框
        shade: false,
        shadeClose: false,
        move: true
      }).then((index: any) => {
        // this.clear();
        layer.close(index);
        resolve();
      }).catch((index: any) => {
        // this.clear();
        layer.close(index);
        reject();
      });
    });
  }

  _getLonLat(cartesian: any) {
    let _this = this;
    let cartographic = _this.ellipsoid.cartesianToCartographic(cartesian);
    cartographic.height = _this.viewer.scene.globe.getHeight(cartographic);
    let pos = {
      lon: cartographic.longitude,
      lat: cartographic.latitude,
      alt: cartographic.height
    };
    pos.lon = Cesium.Math.toDegrees(pos.lon);
    pos.lat = Cesium.Math.toDegrees(pos.lat);
    return pos;
  }

  _getLonLatArr(positions: any) {
    let _this = this;
    let arr = [];
    for (let i = 0; i < positions.length; i++) {
      let p = _this._getLonLat(positions[i]);
      if (p != null) {
        arr.push([p.lon, p.lat]);
      }
    }
    return arr;
  }

  _isSimpleXYZ(p1: any, p2: any) {
    if (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z) {
      return true;
    }
    return false;
  }

  _clearMarkers(layerName: string) {
    let _this = this;
    let viewer = _this.viewer;
    let entityList = viewer.entities.values;
    if (entityList == null || entityList.length < 1)
      return;
    for (let i = 0; i < entityList.length; i++) {
      let entity = entityList[i];
      if (entity.layerId == layerName) {
        viewer.entities.remove(entity);
        i--;
      }
    }
  }

  _clearAnchors() {
    let _this = this;
    for (let key in _this.markers) {
      let m = _this.markers[key];
      _this.viewer.entities.remove(m);
    }
    _this.markers = {};
  }

}
export default PlotAttackArrowDrawer;

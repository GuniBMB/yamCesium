import PlotToolTip from "./PlotToolTip";
import * as Cesium from "cesium";
import layer from "../../plugins/lib/layer/Layer";

class PlotCircleDrawer {
  viewer: any;
  scene: any;
  clock: any;
  canvas: any;
  camera: any;
  ellipsoid: any;
  tooltip: any;
  entity: any;
  outlineEntity: any;
  positions: any = [];
  drawHandler: any;
  modifyHandler: any;
  okHandler: any;
  cancelHandler: any;
  dragIcon: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA+0lEQVQoU2NkQALX5VjTGBkYXYBCllDh40B6k8ajX0tgyhhhjBtybKuAHAUGhv9T/zExHwSJM/37a8/AwJj9n4HhAVBTGEgMrAGq+Kr6o1+NN2TY9BgZ/9v8Z2L4wfiP4bL649+nb8qx1QM1+QI1mTBCnZEA5FhBJRqQnQk0sQFskBzbpv8M/7cwAhmLGP7/Pw6UOPOfkfEUsmI4+x+DPgPjf2sGRkZLkIb7LP8YXf8w/7Nj+M84F5sGxv//s5n/M+36w/R/N1kaSHMS1NM+QE/7EfD0MaCnF8CC9QyQsZlAsGqD4oK8iEOK7Rgg2w85aQCdsUfz0e9ZMDUAG9CXv0chMrwAAAAASUVORK5CYII=";
  dragIconLight: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjUlEQVQ4T5WTO0gDQRCG598TUohgLqUIChcSEBsfjQ9MEWvtFDs7E+0tUllaa5JSECzstLdI46NQGxESc2JELBMLCxEuO86dXkhiAndX7c3O/PvPzregHl+sWBlpOioOQyXdbW7qsjGgq/VM4r07Hd0Bs2gfMfMkgT6hKcKAI0nfTBwF8NDIWJvtNR0CZsF+kcSaBFO9nEnskQiDjaw17u+3BKKF6q38TPcp7Agz0d1HNj7jBj2BWNHeF9sLspwLIiA5p9LOaz1j7cLM26Ni+wygqYDFXhoz3YOwCvPwaRkKObG1FEZAzF+S1nuI5e0dDV6XXubDCdANGCeIFp63xNAGiBdDCTBdM9Qxhg+qKWUgJyLpMAIMKrFD0oJQp1mdBx2hf4g7SgW94o3RpU+udVaWE0FcSHFJxlhzqWyB5FIobYwFEZAJ1HwaO1D+o9EWkbU+QldyesSnsEVie7JLpdacFotf4siQgqYicjTTkFK4cOlrz//3Gr07ETqJdRJQiV/qdIWgyo1t663b2Q/kAI6uzOBy0gAAAABJRU5ErkJggg==";
  material: any;
  radiusLineMaterial: any;
  outlineMaterial: any;
  fill = true;
  outline = true;
  outlineWidth: number = 3;
  extrudedHeight: number = 0;
  toolBarIndex: any;
  layerId: string = "globeEntityDrawerLayer";
  params: any = {}; // 封装需要传递的参数
  ground = true; // 图形是否贴地
  shapeColor: any;
  outlineColor: any;
  shapeName: any;
  isClickConfirm: boolean = false;

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
    }
    _this._clearMarkers(_this.layerId);
    _this.tooltip.setVisible(false);
  }

  clear2() {
    let _this = this;
    if (_this.drawHandler) {
      _this.drawHandler.destroy();
      _this.drawHandler = null;
    }
    if (_this.modifyHandler) {
      _this.modifyHandler.destroy();
      _this.modifyHandler = null;
    }
    _this._clearMarkers(_this.layerId);
    _this.tooltip.setVisible(false);

    _this.viewer.entities.remove(_this.entity);
  }

  showModifyCircle(options: any) {
    let _this = this;
    _this.positions = options.positions;
    _this._showModifyRegion2Map();
    _this._showCircleOutline2Map();
    _this._startModify();

    return new Promise((resolve, reject) => {
      if (options && options.confirmHandler) {
        // confirmHandler需返回一个promise事件
        options.confirmHandler().then(() => {
          resolve(this.positions);
          this.clear();
          this.viewer.entities.remove(this.entity);
        }).catch(() => {
          this.clear();
          reject();
        });
      } else {
        this.createToolBar().then(() => {
          resolve(this.positions);
          this.clear();
          this.viewer.entities.remove(this.entity);
        }).catch(() => {
          this.clear();
          reject();
        });
      }
    });
  }

  startDrawCircle(options: any) {
    let _this = this;
    _this.positions = [];
    let floatingPoint: any = null;

    // let definedColor = $("#paigusu").data("color2");
    // if (definedColor) {
    _this.shapeColor = "rgba(67,106,190,0.5)"; // 设置自定义的绘图颜色
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
        _this._createCenter(cartesian, 0);
        floatingPoint = _this._createPoint(cartesian, -1);
        _this._showRegion2Map();
        _this._showCircleOutline2Map();
      }
      _this.positions.push(cartesian);
      if (num > 0) {
        _this._createPoint(cartesian, 1);
      }
      if (num > 1) {
        this.isClickConfirm = true;
        _this.positions.pop();
        _this.viewer.entities.remove(floatingPoint);
        _this.tooltip.setVisible(false);
        _this._startModify();
      }
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
      _this.tooltip.showAt(position, "<p>选择终点</p>");

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
              resolve(this.positions);
              this.clear();
              this.viewer.entities.remove(this.entity);
            }).catch(() => {
              this.clear();
              reject();
            });
          } else {
            this.createToolBar().then(() => {
              resolve(this.positions);
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
    // _this._showToolBar();

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

  _createCenter(cartesian: any, oid: any) {
    let _this = this;
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: _this.dragIcon,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
    point.oid = oid;
    point.layerId = _this.layerId;
    point.flag = "anchor";
    return point;
  }

  _createPoint(cartesian: any, oid: any) {
    let _this = this;
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: _this.dragIconLight,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
    point.oid = oid;
    point.layerId = _this.layerId;
    point.flag = "anchor";
    return point;
  }

  _showRegion2Map() {
    let _this = this;
    // if (_this.material == null) {
    _this.material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)");
    // }
    if (_this.radiusLineMaterial == null) {
      _this.radiusLineMaterial = new Cesium.PolylineDashMaterialProperty({
          dashLength: 16,
          color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
      });
    }
    let dynamicHierarchy = new Cesium.CallbackProperty(() => {
      if (_this.positions.length > 1) {
        let dis: any = _this._computeCircleRadius3D(_this.positions);
        dis = (dis / 1000).toFixed(3);
        //  _this.entity.label.text = dis + "km";
        let pnts = _this._computeCirclePolygon(_this.positions) as Cesium.Cartesian3[];
        return new Cesium.PolygonHierarchy(pnts);
      } else {
        return null;
      }
    }, false);
    let lineDynamicPositions = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 1) {
        return _this.positions;
      } else {
        return null;
      }
    }, false);
    let labelDynamicPosition = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 1) {
        let p1 = _this.positions[0];
        let p2 = _this.positions[1];
        let cp = _this._computeCenterPotition(p1, p2);
        return cp;
      } else {
        return null;
      }
    }, false);
    let bData = {
      position: labelDynamicPosition,
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: _this.material
      }),
      polyline: {
        positions: lineDynamicPositions,
        clampToGround: true,
        width: 2,
        material: _this.radiusLineMaterial
      }
    };
    // if (_this.extrudedHeight > 0) {
    //   bData.polygon.extrudedHeight = _this.extrudedHeight;
    //   bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    //   bData.polygon.closeTop = true;
    //   bData.polygon.closeBottom = true;
    // }
    _this.entity = _this.viewer.entities.add(bData);
    _this.entity.layerId = _this.layerId;
  }

  _showModifyRegion2Map() {
    let _this = this;
    // if (_this.material == null) {
    _this.material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)");
    // }
    if (_this.radiusLineMaterial == null) {
      _this.radiusLineMaterial = new Cesium.PolylineDashMaterialProperty({
          dashLength: 16,
          color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
      });
    }
    let dynamicHierarchy = new Cesium.CallbackProperty(function() {
      let dis: any = _this._computeCircleRadius3D(_this.positions);
      dis = (dis / 1000).toFixed(3);
      // _this.entity.label.text = dis + "km";
      let pnts = _this._computeCirclePolygon(_this.positions) as Cesium.Cartesian3[];
      return new Cesium.PolygonHierarchy(pnts);
    }, false);
    let lineDynamicPositions = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 1) {
        return _this.positions;
      } else {
        return null;
      }
    }, false);
    let labelDynamicPosition = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 1) {
        let p1 = _this.positions[0];
        let p2 = _this.positions[1];
        let cp = _this._computeCenterPotition(p1, p2);
        return cp;
      } else {
        return null;
      }
    }, false);
    let dis: any = _this._computeCircleRadius3D(_this.positions);
    dis = (dis / 1000).toFixed(3) + "km";
    let bData = {
      position: labelDynamicPosition,
      polygon: new Cesium.PolygonGraphics({
        hierarchy: dynamicHierarchy,
        material: _this.material
      }),
      polyline: {
        positions: lineDynamicPositions,
        clampToGround: true,
        width: 2,
        material: _this.radiusLineMaterial
      }
    };
    // if (_this.extrudedHeight > 0) {
    //   bData.polygon.extrudedHeight = _this.extrudedHeight;
    //   bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    //   bData.polygon.closeTop = true;
    //   bData.polygon.closeBottom = true;
    // }
    _this.entity = _this.viewer.entities.add(bData);
    _this.entity.layerId = _this.layerId;
    _this._createCenter(_this.positions[0], 0);
    _this._createPoint(_this.positions[1], 1);
  }

  _showCircleOutline2Map() {
    let _this = this;
    // if (_this.outlineMaterial == null) {
    _this.outlineMaterial = new Cesium.PolylineGlowMaterialProperty({
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    // }
    let outelinePositions = new Cesium.CallbackProperty(function() {
      let pnts = _this._computeCirclePolygon(_this.positions);
      return pnts;
    }, false);
    let bData = {
      polyline: {
        positions: outelinePositions,
        clampToGround: true,
        width: _this.outlineWidth,
        material: _this.outlineMaterial
      }
    };
    _this.outlineEntity = _this.viewer.entities.add(bData);
    _this.outlineEntity.layerId = _this.layerId;
  }

  _computeCenterPotition(p1: any, p2: any) {
    let _this = this;
    let c1 = _this.ellipsoid.cartesianToCartographic(p1);
    let c2 = _this.ellipsoid.cartesianToCartographic(p2);
    let cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5);
    let cp = _this.ellipsoid.cartographicToCartesian(cm);
    return cp;
  }

  _computeCirclePolygon(positions: any) {
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

  _computeCirclePolygon2(center: any, radius: any) {
    let _this = this;

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
      let first = pnts[0];
      pnts[pnts.length] = first;
      return pnts;
    } catch (err) {
      return null;
    }
  }

  _computeCirclePolygon3(center: any, semiMajorAxis: any, semiMinorAxis: any, rotation: any) {
    let _this = this;

    try {
      if (!center || semiMajorAxis <= 0 || semiMinorAxis <= 0) {
        return null;
      }
      // @ts-ignore
      let cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
        center: center,
        semiMajorAxis: semiMajorAxis,
        semiMinorAxis: semiMinorAxis,
        rotation: rotation,
        granularity: 0.005
      }, false, true);
      if (!cep || !cep.outerPositions) {
        return null;
      }
      let pnts = Cesium.Cartesian3.unpackArray(cep.outerPositions);
      let first = pnts[0];
      pnts[pnts.length] = first;
      return pnts;
    } catch (err) {
      return null;
    }
  }

  _computeCirclePolygonForDegree(positions: any) {
    let _this = this;
    let cp = _this.ellipsoid.cartesianToCartographic(positions[0]);
    let rp = _this.ellipsoid.cartesianToCartographic(positions[1]);
    let x0 = cp.longitude;
    let y0 = cp.latitude;
    let xr = rp.longitude;
    let yr = rp.latitude;
    let r = Math.sqrt(Math.pow((x0 - xr), 2) + Math.pow((y0 - yr), 2));

    let pnts = [];
    for (let i = 0; i < 360; i++) {
      let x1 = x0 + r * Math.cos(i * Math.PI / 180);
      let y1 = y0 + r * Math.sin(i * Math.PI / 180);
      let p1 = Cesium.Cartesian3.fromRadians(x1, y1);
      pnts.push(p1);
    }
    return pnts;
  }

  _computeCircleRadius3D(positions: any) {
    let distance = 0;
    let c1 = positions[0];
    let c2 = positions[1];
    let x = Math.pow(c1.x - c2.x, 2);
    let y = Math.pow(c1.y - c2.y, 2);
    let z = Math.pow(c1.z - c2.z, 2);
    let dis = Math.sqrt(x + y + z);
    return dis;
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
}
export default PlotCircleDrawer;

import PlotToolTip from "./PlotToolTip";
import * as Cesium from "cesium";
import layer from "../../plugins/lib/layer/Layer";

class PlotPolygonDrawer {
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
  isEdit = true;
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
  params: any = {}; // 封装需要传递的参数
  ground = true; // 图形是否贴地
  shapeColor: any;
  outlineColor: any;
  shapeName: any;
  terrainHeight: any;
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
      // layer.close(_this.toolBarIndex, function() {
      //   $("#shapeEditContainer").remove();
      // });
      _this.toolBarIndex = null;
    }
    _this._clearMarkers(_this.layerId);
    _this.tooltip.setVisible(false);

    // $("#shapeEditContainer").hide(); // 设置确定按钮隐藏
    _this.extrudedHeight = 0;
    _this.material == null;

  }

  showModifyPolygon(options: any) {
    this.positions = options.positions;
    this.isClickConfirm = false;
    this._showModifyRegion2Map();

    return new Promise((resolve, reject) => {
      if (options && options.confirmHandler) {
        // confirmHandler需返回一个promise事件
        options.confirmHandler().then(() => {
          let positions = [];
          for (let i = 0; i < this.tempPositions.length; i += 2) {
            let p = this.tempPositions[i];
            positions.push(p);
          }
          this.positions = positions;
          resolve(this.positions);
          this.clear();
          this.viewer.entities.remove(this.entity);
        }).catch(() => {
          this.clear();
          reject();
        });
      } else {
        this.createToolBar().then(() => {
          let positions = [];
          for (let i = 0; i < this.tempPositions.length; i += 2) {
            let p = this.tempPositions[i];
            positions.push(p);
          }
          this.positions = positions;
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

  startDrawPolygon(options: any) {
    let _this = this;

    _this.positions = options.positions || [];
    let floatingPoint: any = null;
    _this.drawHandler = new Cesium.ScreenSpaceEventHandler(_this.canvas);

    // let definedColor = $("#paigusu").data("color2");
    // if (definedColor) {
    _this.shapeColor = "rgba(67,106,190,0.5)"; // 设置自定义的绘图颜色
    // }
    _this.drawHandler.setInputAction((event: any) => {
      // viewer.scene.screenSpaceCameraController.enableRotate = false; //锁定相机
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
      let num = _this.positions.length;
      let tip = "<p>点击添加下一个点</p>";
      if (num > 3) {
        tip += "<p>右键结束绘制</p>";
        // layer.msg("右键结束绘制")
      }
      _this.tooltip.showAt(position, tip);
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
      // viewer.scene.screenSpaceCameraController.enableRotate = true; //锁定相机
      if (_this.positions.length < 4) {
        return;
      }
      _this.positions.pop();
      _this.viewer.entities.remove(floatingPoint);
      _this.tooltip.setVisible(false);

      //进入编辑状态
      this.isClickConfirm = true;
      _this.clear();
      _this._showModifyRegion2Map();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

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
              let positions = [];
              for (let i = 0; i < this.tempPositions.length; i += 2) {
                let p = this.tempPositions[i];
                positions.push(p);
              }
              this.positions = positions;
              resolve(this.positions);
              this.clear();
              this.viewer.entities.remove(this.entity);
            }).catch(() => {
              this.clear();
              reject();
            });
          } else {
            this.createToolBar().then(() => {
              let positions = [];
              for (let i = 0; i < this.tempPositions.length; i += 2) {
                let p = this.tempPositions[i];
                positions.push(p);
              }
              this.positions = positions;
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
    if (_this.toolBarIndex == null) {
      // _this._showToolBar();
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
        _this.tempPositions[oid] = cartesian;
        _this.tooltip.setVisible(false);
        if (pickedAnchor.flag == "mid_anchor") {
          _this._updateModifyAnchors(oid);
        }
      } else {
        let pickedObject = _this.scene.pick(position);
        if (!Cesium.defined(pickedObject)) {
          return;
        }
        if (!Cesium.defined(pickedObject.id)) {
          return;
        }
        let entity = pickedObject.id;
        if (entity.layerId != _this.layerId) {
          return;
        }
        if (entity.flag != "anchor" && entity.flag != "mid_anchor") {
          return;
        }
        pickedAnchor = entity;
        isMoving = true;
        if (entity.flag == "anchor") {
          _this.tooltip.showAt(position, "<p>移动控制点</p>");
        }
        if (entity.flag == "mid_anchor") {
          _this.tooltip.showAt(position, "<p>移动创建新的控制点</p>");
        }
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
      let oid = pickedAnchor.oid;
      if (pickedAnchor.flag == "anchor") {
        pickedAnchor.position.setValue(cartesian);
        _this.tempPositions[oid] = cartesian;
        //左右两个中点
        _this._updateNewMidAnchors(oid);
      } else if (pickedAnchor.flag == "mid_anchor") {
        pickedAnchor.position.setValue(cartesian);
        _this.tempPositions[oid] = cartesian;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  _showRegion2Map() {
    let _this = this;
    // if (_this.material == null) {
    // 临时图
    _this.material = Cesium.Color.fromCssColorString(_this.shapeColor);
    //_this.material = getColor(viewModel.color, viewModel.alpha),
    // }
    // if (_this.outlineMaterial == null) {
    _this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    // }
    let dynamicHierarchy = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 2) {
        let pHierarchy = new Cesium.PolygonHierarchy(_this.positions);
        return pHierarchy;
      } else {
        return null;
      }
    }, false);
    let outlineDynamicPositions = new Cesium.CallbackProperty(() => {
      if (_this.positions.length > 1) {
        let arr = [].concat(_this.positions) as any;
        let first = _this.positions[0];
        arr.push(first);
        return arr;
      } else {
        return null;
      }
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
    // if (_this.extrudedHeight > 0) {
    //   bData.polygon.extrudedHeight = _this.extrudedHeight;
    //   bData.polygon.extrudedHeightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    //   bData.polygon.closeTop = true;
    //   bData.polygon.closeBottom = true;
    // }
    _this.entity = _this.viewer.entities.add(bData);
    _this.entity.layerId = _this.layerId;
  }

  _showModifyRegion2Map() {
    let _this = this;
    _this._startModify();
    _this._computeTempPositions();

    let dynamicHierarchy = new Cesium.CallbackProperty(function() {
      if (_this.positions.length > 2) {
        return new Cesium.PolygonHierarchy(_this.tempPositions);
      } else {
        return null;
      }
    }, false);
    let outlineDynamicPositions = new Cesium.CallbackProperty(function() {
      if (_this.tempPositions.length > 1) {
        let arr = [].concat(_this.tempPositions) as any;
        let first = _this.tempPositions[0];
        arr.push(first);
        return arr;
      } else {
        return null;
      }
    }, false);
    // if (_this.material == null) {
    _this.material = Cesium.Color.fromCssColorString(_this.shapeColor);
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
    // if (!_this.ground && _this.extrudedHeight > 0) { // 当贴地属性为false并且拉伸高度大于0时，拉伸
    //   bData.polygon.extrudedHeight = _this.extrudedHeight;
    //   bData.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    //   // bData.polygon.extrudedHeightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    //   bData.polygon.closeTop = true;
    //   bData.polygon.closeBottom = true;
    // }
    _this.entity = _this.viewer.entities.add(bData);
    _this.entity.layerId = _this.layerId;
    let positions = _this.tempPositions;
    for (let i = 0; i < positions.length; i++) {
      let ys = i % 2;
      if (ys == 0) {
        _this._createPoint(positions[i], i);
      } else {
        _this._createMidPoint(positions[i], i);
      }
    }
  }

  _updateModifyAnchors(oid: any) {
    let _this = this;

    //重新计算tempPositions
    let p = _this.tempPositions[oid];
    let p1 = null;
    let p2 = null;
    let num = _this.tempPositions.length;
    if (oid == 0) {
      p1 = _this.tempPositions[num - 1];
      p2 = _this.tempPositions[oid + 1];
    } else if (oid == num - 1) {
      p1 = _this.tempPositions[oid - 1];
      p2 = _this.tempPositions[0];
    } else {
      p1 = _this.tempPositions[oid - 1];
      p2 = _this.tempPositions[oid + 1];
    }
    //计算中心
    let cp1 = _this._computeCenterPotition(p1, p);
    let cp2 = _this._computeCenterPotition(p, p2);

    //插入点
    let arr = [cp1, p, cp2];
    _this.tempPositions.splice(oid, 1, cp1, p, cp2);

    //重新加载锚点
    _this._clearAnchors();
    let positions = _this.tempPositions;
    for (let i = 0; i < positions.length; i++) {
      let ys = i % 2;
      if (ys == 0) {
        _this._createPoint(positions[i], i);
      } else {
        _this._createMidPoint(positions[i], i);
      }
    }
  }

  _updateNewMidAnchors(oid: any) {
    let _this = this;
    if (oid == null) {
      return;
    }
    //左边两个中点，oid2为临时中间点
    let oid1 = null;
    let oid2 = null;

    //右边两个中点，oid3为临时中间点
    let oid3 = null;
    let oid4 = null;
    let num = _this.tempPositions.length;
    if (oid == 0) {
      oid1 = num - 2;
      oid2 = num - 1;
      oid3 = oid + 1;
      oid4 = oid + 2;
    } else if (oid == num - 2) {
      oid1 = oid - 2;
      oid2 = oid - 1;
      oid3 = num - 1;
      oid4 = 0;
    } else {
      oid1 = oid - 2;
      oid2 = oid - 1;
      oid3 = oid + 1;
      oid4 = oid + 2;
    }

    let c1 = _this.tempPositions[oid1];
    let c = _this.tempPositions[oid];
    let c4 = _this.tempPositions[oid4];

    let c2 = _this._computeCenterPotition(c1, c);
    let c3 = _this._computeCenterPotition(c4, c);

    _this.tempPositions[oid2] = c2;
    _this.tempPositions[oid3] = c3;

    _this.markers[oid2].position.setValue(c2);
    _this.markers[oid3].position.setValue(c3);
  }

  _createPoint(cartesian: any, oid: any) {
    let _this = this;
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: _this.dragIconLight,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    });
    point.oid = oid;
    point.layerId = _this.layerId;
    point.flag = "anchor";
    _this.markers[oid] = point;
    return point;
  }

  _createMidPoint(cartesian: any, oid: any) {
    let _this = this;
    let point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: _this.dragIcon,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    });
    point.oid = oid;
    point.layerId = _this.layerId;
    point.flag = "mid_anchor";
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

  _isSimpleXYZ(p1: any, p2: any) {
    return p1.x == p2.x && p1.y == p2.y && p1.z == p2.z;

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
export default PlotPolygonDrawer;

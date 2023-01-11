import PlotToolTip from "./PlotToolTip";
import * as Cesium from "cesium";
import layer from "../../plugins/lib/layer/Layer";

class PlotPolylineDrawer {
  viewer: any = null;
  scene: any = null;
  clock: any = null;
  canvas: any = null;
  camera: any = null;
  ellipsoid: any = null;
  tooltip: any = null;
  entity: any = null;
  positions: any = [];
  tempPositions: any = [];
  drawHandler: any = null;
  modifyHandler: any = null;
  okHandler: any = null;
  cancelHandler: any = null;
  dragIcon: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA+0lEQVQoU2NkQALX5VjTGBkYXYBCllDh40B6k8ajX0tgyhhhjBtybKuAHAUGhv9T/zExHwSJM/37a8/AwJj9n4HhAVBTGEgMrAGq+Kr6o1+NN2TY9BgZ/9v8Z2L4wfiP4bL649+nb8qx1QM1+QI1mTBCnZEA5FhBJRqQnQk0sQFskBzbpv8M/7cwAhmLGP7/Pw6UOPOfkfEUsmI4+x+DPgPjf2sGRkZLkIb7LP8YXf8w/7Nj+M84F5sGxv//s5n/M+36w/R/N1kaSHMS1NM+QE/7EfD0MaCnF8CC9QyQsZlAsGqD4oK8iEOK7Rgg2w85aQCdsUfz0e9ZMDUAG9CXv0chMrwAAAAASUVORK5CYII=";
  dragIconLight: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjUlEQVQ4T5WTO0gDQRCG598TUohgLqUIChcSEBsfjQ9MEWvtFDs7E+0tUllaa5JSECzstLdI46NQGxESc2JELBMLCxEuO86dXkhiAndX7c3O/PvPzregHl+sWBlpOioOQyXdbW7qsjGgq/VM4r07Hd0Bs2gfMfMkgT6hKcKAI0nfTBwF8NDIWJvtNR0CZsF+kcSaBFO9nEnskQiDjaw17u+3BKKF6q38TPcp7Agz0d1HNj7jBj2BWNHeF9sLspwLIiA5p9LOaz1j7cLM26Ni+wygqYDFXhoz3YOwCvPwaRkKObG1FEZAzF+S1nuI5e0dDV6XXubDCdANGCeIFp63xNAGiBdDCTBdM9Qxhg+qKWUgJyLpMAIMKrFD0oJQp1mdBx2hf4g7SgW94o3RpU+udVaWE0FcSHFJxlhzqWyB5FIobYwFEZAJ1HwaO1D+o9EWkbU+QldyesSnsEVie7JLpdacFotf4siQgqYicjTTkFK4cOlrz//3Gr07ETqJdRJQiV/qdIWgyo1t663b2Q/kAI6uzOBy0gAAAABJRU5ErkJggg==";
  material: any = null;
  toolBarIndex: any = null;
  markers: any = {};
  layerId: string = "globeDrawerLayer";
  width: number = 8;
  params: any = {};
  shapeName: string = "折线";
  floatingPoint: any = null;
  private isClickConfirm: boolean = false;

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
    this._clearMarkers(this.layerId);
    this.tooltip.setVisible(false);
  }

  showModifyPolyline(options: any) {
    this.positions = options.positions;

    this.isClickConfirm = false;

    this._showModifyPolyline2Map();
    // 如果自定义了确认按钮则显示自定义按钮
    return new Promise((resolve, reject) => {
      if (options && options.confirmHandler) {
        // confirmHandler需返回一个promise事件
        options.confirmHandler().then(() => {
          const positions = this._getPositionsWithSid();
          const lonLats = this._getLonLats(positions);
          this.positions = positions;
          resolve(this.positions);
          this.clear();
        }).catch(() => {
          this.clear();
          reject();
        });
      } else {
        this._showToolBar().then(() => {
          const positions = this._getPositionsWithSid();
          const lonLats = this._getLonLats(positions);
          this.positions = positions;
          resolve(this.positions);
          this.clear();
        }).catch(() => {
          this.clear();
          reject();
        });
      }
    })
    // return
  }

  startDrawPolyline(options: any) {

    this.positions = options.positions || [];
    this.drawHandler = new Cesium.ScreenSpaceEventHandler(this.canvas);
    this.drawHandler.setInputAction((event: any) => {
      let position = event.position;
      if (!Cesium.defined(position)) {
        return;
      }
      let ray = this.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = this.scene.globe.pick(ray, this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      let num = this.positions.length;
      if (num == 1) { // 原为 num == 0 因在移动事件中新增的一个点，所以等于1
        this.positions.pop(); // 新增 将移动事件中的第一个点移除
        this.positions.push(cartesian);
        this.floatingPoint = this._createPoint(cartesian, -1);
        this._showPolyline2Map();
      }
      this.positions.push(cartesian);
      let oid = this.positions.length - 2;
      this._createPoint(cartesian, oid);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.drawHandler.setInputAction((event: any) => {
      let position = event.endPosition;
      if (!Cesium.defined(position)) {
        return;
      }
      let ray = this.camera.getPickRay(position);
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = this.scene.globe.pick(ray, this.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (this.positions.length <= 1) {
        this.tooltip.showAt(position, "<p>选择起点</p>");
        this.positions.pop();
        this.positions.push(cartesian); //新增
        this.viewer.entities.remove(this.floatingPoint);
        this.floatingPoint = this._createPoint(cartesian, -1); //新增
        return;
      }
      // if (this.positions.length === 2) {
      //   this.positions.push(this.floatingPoint.position.getValue());
      // }
      let num = this.positions.length;
      let tip = "<p>点击添加下一个点</p>";
      if (num > 2) {
        tip += "<p>右键结束绘制</p>";
      }
      this.tooltip.showAt(position, tip);
      this.floatingPoint.position.setValue(cartesian);
      this.positions.pop();
      this.positions.push(cartesian);

    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.drawHandler.setInputAction((movement: any) => {
      if (this.positions.length < 3) {
        return;
      }
      this.positions.pop();
      this.viewer.entities.remove(this.floatingPoint);
      this.tooltip.setVisible(false);

      //进入编辑状态
      this.isClickConfirm = true;
      this.clear();
      this._showModifyPolyline2Map(); // 这句注释能够做到右键撤销上次绘制的线
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
              const positions = this._getPositionsWithSid();
              const lonLats = this._getLonLats(positions);
              this.positions = positions;
              resolve(this.positions);
              this.clear();
            }).catch(() => {
              this.clear();
              reject();
            });
          } else {
            this._showToolBar().then(() => {
              const positions = this._getPositionsWithSid();
              const lonLats = this._getLonLats(positions);
              this.positions = positions;
              resolve(this.positions);
              this.clear();
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

    _this.modifyHandler.setInputAction(function(event: any) {
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

    _this.modifyHandler.setInputAction(function(event: any) {
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

  _showPolyline2Map() {
    let _this = this;
    // if (_this.material == null) {
    _this.material = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.25,
      color: Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)")
    });
    // }
    let dynamicPositions = new Cesium.CallbackProperty(function() {
      return _this.positions;
    }, false);
    let bData = {
      polyline: {
        positions: dynamicPositions,
        clampToGround: true,
        width: _this.width,
        material: _this.material
      }
    };
    _this.entity = _this.viewer.entities.add(bData);
    _this.entity.layerId = _this.layerId;
  }

  _showModifyPolyline2Map() {
    let _this = this;

    _this._startModify();
    _this._computeTempPositions();

    let dynamicPositions = new Cesium.CallbackProperty(function() {
      return _this.tempPositions;
    }, false);
    // if (_this.material == null) {
    _this.material = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.25,
      color: Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)")
    });
    // }
    let bData = {
      polyline: {
        positions: dynamicPositions,
        clampToGround: true,
        width: _this.width,
        material: _this.material
      }
    };
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
    let num = _this.tempPositions.length;
    if (oid == 0 || oid == num - 1) {
      return;
    }
    //重新计算tempPositions
    let p = _this.tempPositions[oid];
    let p1 = _this.tempPositions[oid - 1];
    let p2 = _this.tempPositions[oid + 1];

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

    if (oid == 0) {
      let c3 = _this._computeCenterPotition(c4, c);
      _this.tempPositions[oid3] = c3;
      _this.markers[oid3].position.setValue(c3);
    } else if (oid == num - 1) {
      let c2 = _this._computeCenterPotition(c1, c);
      _this.tempPositions[oid2] = c2;
      _this.markers[oid2].position.setValue(c2);
    } else {
      let c2 = _this._computeCenterPotition(c1, c);
      let c3 = _this._computeCenterPotition(c4, c);
      _this.tempPositions[oid2] = c2;
      _this.tempPositions[oid3] = c3;
      _this.markers[oid2].position.setValue(c2);
      _this.markers[oid3].position.setValue(c3);
    }
  }

  _createPoint(cartesian: any, oid: any) {
    const point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: this.dragIconLight,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    });
    point.oid = oid;
    point.sid = cartesian.sid; //记录原始序号
    point.layerId = this.layerId;
    point.flag = "anchor";
    this.markers[oid] = point;
    return point;
  }

  _createMidPoint(cartesian: any, oid: any) {
    const point = this.viewer.entities.add({
      position: cartesian,
      billboard: {
        image: this.dragIcon,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    });
    point.oid = oid;
    point.layerId = this.layerId;
    point.flag = "mid_anchor";
    this.markers[oid] = point;
    return point;
  }

  _computeTempPositions() {
    let _this = this;

    let pnts = [].concat(_this.positions) as any;
    let num = pnts.length;
    _this.tempPositions = [];
    for (let i = 1; i < num; i++) {
      let p1 = pnts[i - 1];
      let p2 = pnts[i];
      p1.sid = i - 1;
      p2.sid = i;
      let cp = _this._computeCenterPotition(p1, p2);
      _this.tempPositions.push(p1);
      _this.tempPositions.push(cp);
    }
    let last = pnts[num - 1];
    _this.tempPositions.push(last);
  }

  _computeCenterPotition(p1: any, p2: any) {
    let _this = this;
    let c1 = _this.ellipsoid.cartesianToCartographic(p1);
    let c2 = _this.ellipsoid.cartesianToCartographic(p2);
    let cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5);
    let cp = _this.ellipsoid.cartographicToCartesian(cm);
    return cp;
  }

  _showToolBar() {
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

  // _showToolBar() {
  // let _this = this;
  // _this._createToolBar();
  // let width = $(window).width();
  // let wTop = 300;
  // // let wLeft = parseInt((width - 145) / 2);
  // let wLeft = 600;
  // _this.toolBarIndex = layer.open({
  //   title: false,
  //   type: 1,
  //   fixed: true,
  //   resize: false,
  //   shade: 0,
  //   content: $("#shapeEditContainer"),
  //   offset: [wTop + "px", wLeft + "px"],
  //   move: "#shapeEditRTCorner",
  //   area: ['400px','300px'],
  //   skin: 'layui-draw-alert',
  // });
  // let cssSel = "#layui-layer" + _this.toolBarIndex + " .layui-layer-close2";
  // $(cssSel).hide();
  // }

  _createToolBar() {
//   let _this = this;
//   let objs = $("#shapeEditContainer");
//   objs.remove();
//   // let html = '<div id="shapeEditContainer" style="padding: 10px 10px;">'
//   //          + '    <button name="btnOK" class="layui-btn layui-btn-xs layui-btn-normal"> 确定 </button>'
//   //          + '    <button name="btnCancel" class="layui-btn layui-btn-xs layui-btn-danger"> 取消 </button>'
//   //          + '    <div id="shapeEditRTCorner" style="width: 16px; position: absolute; right: 0px; top: 0px; bottom: 0px">'
//   //          + '    </div>'
//   //          + '</div>';
// //         let html = `<div id="shapeEditContainer" style="color:black; height:300px;width:350px">
// //         <div id="shapeEditRTCorner">折线</div>
// //         <hr>
// //         <div>
// //             <label>名称:</label><input id="polylineName" type="text" value="折线"/>
// //             </div>
// //             <div>
// //           <!--  <label>贴地</label>
// //             <input id="clamp" type="checkbox" name="clamp" checked> -->
// //             <div>
// //             <label>颜色</label>
// //             <span class="polyline-shapecolor-paigusu" style="width:25px;height:25px;background:rgba(228,235,41,1.0);display:inline-block;margin:0;"></span>
// //             </div>
// //            <div><label>宽度</label><input id="polylineWidth" type="range" min="1" max="100" step="1"/></div>
// //         <div style="position: absolute;bottom: 10px;right: 10px;" class="layerBtn">
// //         <button name="btnOK" class="layui-btn layui-btn-xs layui-btn-normal"> 确定 </button>
// //         <button name="btnCancel" class="layui-btn layui-btn-xs layui-btn-danger"> 取消 </button>
// //         </div>
// //         </div>
// // </div>
// // `
//   let html = `<div id="shapeEditContainer" >
// <div id="shapeEditRTCorner">折线</div>
//
// <div style="margin-left: 10%; margin-top: 5%;">
//     <label>名称:</label><input style="background: rgba(30,32,45,0.9);    margin-left: 3%; color: #ffffff;    font-size: 14px;
//     width: 200px;
//     height: 25px;
//     text-indent: 10px;outline:none; border:none;" id="polylineName" type="text" value="折线"/>
//     </div>
//     <div style="margin-top: 5%;">
//   <!--  <label style="font-size: 14px;
//   margin-left: 10%;">贴地</label>
//     <input id="clamp" type="checkbox" name="clamp" checked> -->
//     <div style="margin-left: 10%;">
//     <label style="    position: relative; top: 38%;">颜色：</label>
//     <span class="polyline-shapecolor-paigusu" style="width:25px;height:25px;background:rgba(228,235,41,1.0);display:inline-block;"></span>
//     </div>
//    <div style="margin-left: 10%; margin-top: 5%;"><label>宽度：</label><input style="  width: 200px; margin-left: 1%;position: absolute;" id="polylineWidth" type="range" min="1" max="100" step="1"/></div>
// <div style="position: absolute;bottom: 10px;right: 10px;" class="layerBtn">
// <button name="btnOK" class="layui-btn layui-btn-xs layui-btn-normal"> 确定 </button>
// <button name="btnCancel" class="layui-btn layui-btn-xs layui-btn-danger"> 取消 </button>
// </div>
// </div>
// </div>
// `
//   $("body").append(html);
//   _this.initPanelData();
//   _this.setAttribute();
//   let btnOK = $("#shapeEditContainer button[name='btnOK']");
//   let btnCancel = $("#shapeEditContainer button[name='btnCancel']");
//   btnOK.unbind("click").bind("click", function () {
//     if (_this.okHandler) {
//       //let positions = [];
//       //for (let i = 0; i < _this.tempPositions.length; i += 2) {
//       //    let p = _this.tempPositions[i];
//       //    positions.push(p);
//       //}
//       let positions = _this._getPositionsWithSid();
//       let lonLats = _this._getLonLats(positions);
//       _this.positions = positions;
//       _this.params.color = _this.shapeColor;
//       _this.params.width = _this.width;
//       _this.params.name = _this.shapeName;
//       _this.okHandler(positions, lonLats, _this.params);
//       _this.clear();
//       layer.close(_this.toolBarIndex);
//       _this.resetParams();
//     } else {
//       _this.clear();
//       layer.close(_this.toolBarIndex);
//       _this.resetParams();
//     }
//   });
//   btnCancel.unbind("click").bind("click", function () {
//     _this.clear();
//     layer.close(_this.toolBarIndex);
//     if (_this.cancelHandler) {
//       _this.cancelHandler();
//     }
//   });
  }

  _getPositionsWithSid() {
    let _this = this;
    let viewer = _this.viewer;
    let rlt: any = [];
    let entityList = viewer.entities.values;
    if (entityList == null || entityList.length < 1) {
      return rlt;
    }
    for (let i = 0; i < entityList.length; i++) {
      let entity = entityList[i];
      if (entity.layerId != _this.layerId) {
        continue;
      }
      if (entity.flag != "anchor") {
        continue;
      }
      let p = entity.position.getValue(new Date().getTime());
      p.sid = entity.sid;
      p.oid = entity.oid;
      rlt.push(p);
    }
    //排序
    rlt.sort(function(obj1: any, obj2: any) {
      if (obj1.oid > obj2.oid) {
        return 1;
      } else if (obj1.oid == obj2.oid) {
        return 0;
      } else {
        return -1;
      }
    });
    return rlt;
  }

  _getLonLat(cartesian: any) {
    let _this = this;
    let cartographic = _this.ellipsoid.cartesianToCartographic(cartesian);
    cartographic.height = _this.viewer.scene.globe.getHeight(cartographic);
    let pos = {
      lon: cartographic.longitude,
      lat: cartographic.latitude,
      alt: cartographic.height,
      height: cartographic.height
    };
    pos.lon = Cesium.Math.toDegrees(pos.lon);
    pos.lat = Cesium.Math.toDegrees(pos.lat);
    return pos;
  }

  _getLonLats(positions: any) {
    let _this = this;
    let arr = [];
    for (let i = 0; i < positions.length; i++) {
      let c = positions[i];
      let p = _this._getLonLat(c) as any;
      p.sid = c.sid;
      p.oid = c.oid;
      arr.push(p);
    }
    return arr;
  }

  _isSimpleXYZ(p1: any, p2: any) {
    return p1.x == p2.x && p1.y == p2.y && p1.z == p2.z;

  }

  _clearAnchors() {
    let _this = this;
    for (let key in _this.markers) {
      let m = _this.markers[key];
      _this.viewer.entities.remove(m);
    }
    _this.markers = {};
  }

  _clearMarkers(layerName: string) {
    const _this = this;
    const viewer = _this.viewer;
    const entityList = viewer.entities.values;
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
export default PlotPolylineDrawer;

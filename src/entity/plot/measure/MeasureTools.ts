import * as Cesium from "cesium";
import CesiumMethod from "../../../plugins/lib/CesiumMethod";

class MeasureTools {
  viewer: Cesium.Viewer;
  entityCollection: Cesium.Entity[] = [];
  dis: string = "0";
  distance: number = 0;
  pointEntity: Cesium.Entity | undefined;
  tempEntityCollection: Cesium.Entity[] = [];
  turf: any;
  viewModel: any = {
    measurePointEnabled: false,
    measureDistanceEnabled: false,
    measureAreaEnabled: false,
    measureHeightEnabled: false
  };

  constructor(viewer: Cesium.Viewer, turf: any) {
    this.viewer = viewer;
    // @ts-ignore
    this.turf = turf || window["turf"];
    if (!this.turf) {
      console.error("请引入turf.js");
      return;
    }
    this.bindModel();
  }

  /**
   * 属性绑定
   */
  bindModel() {
    // @ts-ignore
    Cesium.knockout.track(this.viewModel);
    // @ts-ignore
    Cesium.knockout.getObservable(this.viewModel, "measurePointEnabled").subscribe(
      (newValue: boolean) => {
        this.clear();
        if (newValue) {
          this.closeOtherFunc("measurePointEnabled");
          this.measurePoint();
        } else {
          this.clearTempEntity();
        }
      }
    );
    // @ts-ignore
    Cesium.knockout.getObservable(this.viewModel, "measureDistanceEnabled").subscribe(
      (newValue: boolean) => {
        this.clear();
        if (newValue) {
          this.closeOtherFunc("measureDistanceEnabled");
          this.measureDis();
        } else {
          this.clearTempEntity();
        }
      }
    );
    // @ts-ignore
    Cesium.knockout.getObservable(this.viewModel, "measureAreaEnabled").subscribe(
      (newValue: boolean) => {
        this.clear();
        if (newValue) {
          this.closeOtherFunc("measureAreaEnabled");
          this.measureArea();
        } else {
          this.clearTempEntity();
        }
      }
    );
    // @ts-ignore
    Cesium.knockout.getObservable(this.viewModel, "measureHeightEnabled").subscribe(
      (newValue: boolean) => {
        this.clear();
        if (newValue) {
          this.closeOtherFunc("measureHeightEnabled");
          this.measureHeight();
        } else {
          this.clearTempEntity();
        }
      }
    );
  }

  clear() {
    let _this = this;
    // 移除最后一个label
    if (_this.pointEntity) {

      _this.viewer.entities.remove(_this.pointEntity);
    }
    _this.distance = 0;
    // _this.tempEntityCollection = [];
    _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  clearTempEntity() {
    let _this = this;
    for (let i = 0; i < _this.tempEntityCollection.length; i++) {

      _this.viewer.entities.remove(_this.tempEntityCollection[i]);
    }
    _this.tempEntityCollection = [];
  }

  closeOtherFunc(nowFunc: any) {
    let _this = this;
    for (const viewModelKey in this.viewModel) {
      if (viewModelKey !== nowFunc) {
        this.viewModel[viewModelKey] = false;
      }
    }
    _this.clearTempEntity();
  }

  getCollection() {
    let _this = this;
    return _this.entityCollection;
  }

  destroy() {
    let _this = this;
    for (let i = 0; i < _this.entityCollection.length; i++) {

      _this.viewer.entities.remove(_this.entityCollection[i]);
    }
    _this.entityCollection = [];
    _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  measurePoint() {
    let _this = this;
    _this.viewer.screenSpaceEventHandler.setInputAction(function(event: any) {
      let wp = event.position;
      if (!Cesium.defined(wp)) {
        return;
      }
      let ray = _this.viewer.scene.camera.getPickRay(wp) as Cesium.Ray;
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (cartesian) {
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        let lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);
        let lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);
        let elev = _this.viewer.scene.globe.getHeight(cartographic)?.toFixed(2);
        let lengthText = "经度：" + lon + "\n" + "纬度：" + lat + "\n" + "高度：" + elev;
        // let entity = _this.addLabel(cartesian, lengthText);
        let entity = _this.addLabelWithPoint(cartesian, lengthText);
        _this.entityCollection.push(entity);
        // _this.addPoint(cartesian);
      }
      ;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //
    _this.viewer.screenSpaceEventHandler.setInputAction(function(moveEvent: any) {
      let movePosition = _this.viewer.scene.pickPosition(moveEvent.endPosition); // 鼠标移动的点
      if (_this.pointEntity) {

        _this.viewer.entities.remove(_this.pointEntity);
      }
      if (movePosition) {
        let cartographic = Cesium.Cartographic.fromCartesian(movePosition);
        if (!cartographic) {
          return;
        }
        let lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);
        let lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);
        let elev = _this.viewer.scene.globe.getHeight(cartographic)?.toFixed(2);
        let lengthText = "经度：" + lon + "\n" + "纬度：" + lat + "\n" + "高度：" + elev;
        _this.pointEntity = _this.addLabelWithPoint(movePosition, lengthText);
        _this.entityCollection.push(_this.pointEntity);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右击结束
    _this.viewer.screenSpaceEventHandler.setInputAction(function(clickEvent: any) {
      // 移除最后一个label

      _this.pointEntity && _this.viewer.entities.remove(_this.pointEntity);
      _this.distance = 0;
      _this.tempEntityCollection = [];
      _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      _this.viewModel.measurePointEnabled = false;
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  measureDis() {
    let _this = this;
    let positions: Cesium.Cartesian3[] = [];
    let clickStatus = false;
    let labelEntity: Cesium.Entity;
    let totalLabelEntity: Cesium.Entity;
    let totalLengthText = "总距离：" + "0.00米";
    let finalLengthText = "";
    let firstCartesian: Cesium.Cartesian3;
    // let dis = 0;
    _this.viewer.screenSpaceEventHandler.setInputAction(function(clickEvent: any) {
      finalLengthText = totalLengthText;
      clickStatus = true;
      let ray = _this.viewer.camera.getPickRay(clickEvent.position) as Cesium.Ray;
      if (!Cesium.defined(ray)) {
        return;
      }
      let cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene) as Cesium.Cartesian3;
      if (!Cesium.defined(cartesian)) {
        return;
      }
      if (!firstCartesian) {
        firstCartesian = JSON.parse(JSON.stringify(cartesian));
      }
      if (positions.length == 0) {
        positions.push(cartesian.clone()); //鼠标左击 添加第1个点
        _this.addPoint(cartesian);
        // 计算距离
        totalLabelEntity = _this.addLabelWithPoint(cartesian, totalLengthText);
        _this.entityCollection.push(totalLabelEntity);
        _this.tempEntityCollection.push(totalLabelEntity);
        _this.viewer.screenSpaceEventHandler.setInputAction(function(moveEvent: any) {
          let ray = _this.viewer.camera.getPickRay(moveEvent.endPosition);
          if (!ray) {
            return;
          }
          let movePosition = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
          if (!movePosition) {
            return;
          }
          if (positions.length == 1) {
            positions.push(movePosition);
            _this.addLine(positions);
          } else {
            if (labelEntity && !clickStatus) {
              _this.viewer.entities.remove(labelEntity);
              _this.entityCollection.splice(_this.entityCollection.indexOf(labelEntity), 1);
            }
            if (totalLabelEntity) {
              _this.viewer.entities.remove(totalLabelEntity);
              _this.entityCollection.splice(_this.entityCollection.indexOf(totalLabelEntity), 1);
            }
            // 计算中点
            let centerPoint = Cesium.Cartesian3.midpoint(positions[positions.length - 2], positions[positions.length - 1], new Cesium.Cartesian3());
            let dis = _this.getLengthText(positions[positions.length - 2], positions[positions.length - 1]);
            if (_this.distance > 1000) {
              _this.dis = ((dis + _this.distance) / 1000).toFixed(2) + " 公里";
            } else {
              _this.dis = (dis + _this.distance).toFixed(2) + " 米";
            }
            // 计算距离
            let lengthText = "距离：" + _this.dis;
            totalLengthText = "总距离：" + _this.dis;
            labelEntity = _this.addLabel(centerPoint, lengthText);
            _this.entityCollection.push(labelEntity);
            _this.tempEntityCollection.push(labelEntity);
            totalLabelEntity = _this.addLabel(cartesian, totalLengthText);
            _this.entityCollection.push(totalLabelEntity);
            _this.tempEntityCollection.push(totalLabelEntity);
            if (clickStatus) {
              positions.push(movePosition);
            } else {
              positions.pop();
              positions.push(movePosition);
            }
          }

          if (positions.length >= 3) {
            // 绘制label
            if (labelEntity) {
              let a = _this.viewer.entities.remove(labelEntity);
              _this.entityCollection.splice(_this.entityCollection.indexOf(labelEntity), 1);
            }
            // 计算中点
            let centerPoint = Cesium.Cartesian3.midpoint(positions[positions.length - 2], positions[positions.length - 1], new Cesium.Cartesian3());
            let dis = _this.getLengthText(positions[positions.length - 2], positions[positions.length - 1]);
            if (dis > 1000) {
              _this.dis = (dis / 1000).toFixed(2) + " 公里";
            } else {
              _this.dis = dis.toFixed(2) + " 米";
            }
            // 计算距离
            let lengthText = "距离：" + _this.dis;

            labelEntity = _this.addLabel(centerPoint, lengthText);
            _this.entityCollection.push(labelEntity);
            _this.tempEntityCollection.push(labelEntity);
          }

          clickStatus = false;
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


      } else if (positions.length == 2) {
        positions.pop();
        positions.push(cartesian.clone()); // 鼠标左击 添加第2个点

        _this.addPoint(cartesian);

        // _this.addLine(positions);

        // 右击结束
        _this.viewer.screenSpaceEventHandler.setInputAction(function(clickEvent: any) {
          // 移除最后一个label
          let ray = _this.viewer.camera.getPickRay(clickEvent.position) as Cesium.Ray;
          if (!ray) {
            return;
          }
          let clickPosition = _this.viewer.scene.globe.pick(ray, _this.viewer.scene) as Cesium.Cartesian3;
          if (!clickPosition) {
            return;
          }
          if (!clickStatus) {
            positions.pop();

            _this.viewer.entities.remove(labelEntity);
          }
          if (positions.length < 2) {
            positions.push(clickPosition);
            _this.addPoint(clickPosition);
          } else {
          }
          // positions.push(clickPosition);
          // positions.push(positions[0]); // 闭合
          // _this.addPoint(clickPosition);
          _this.distance = 0;
          _this.tempEntityCollection = [];
          _this.entityCollection.splice(_this.entityCollection.indexOf(totalLabelEntity), 1);

          let b = _this.viewer.entities.remove(totalLabelEntity);
          // _this.tempEntityCollection.push(totalLabelEntity);
          if (b) {
            totalLabelEntity = _this.addLabel(firstCartesian, finalLengthText);
            _this.entityCollection.push(totalLabelEntity);
          }
          firstCartesian = new Cesium.Cartesian3();
          _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
          _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          _this.viewModel.measureDistanceEnabled = false;
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);


      } else if (positions.length >= 3) {
        positions.pop();
        positions.push(cartesian.clone()); // 鼠标左击 添加第3个点
        _this.addPoint(cartesian);
      }
      _this.distance += _this.getLengthText(positions[positions.length - 2], positions[positions.length - 1]);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  measureHeight() {
    let _this = this;
    let positions: Cesium.Cartesian3[] = [];
    let labelEntity_1: Cesium.Entity; // 标签实体
    let labelEntity_2: Cesium.Entity; // 标签实体
    let labelEntity_3: Cesium.Entity; // 标签实体

    // 注册鼠标左击事件
    _this.viewer.screenSpaceEventHandler.setInputAction(function(clickEvent: any) {
      let cartesian = _this.viewer.scene.pickPosition(clickEvent.position); // 坐标

      // 存储第一个点
      if (positions.length == 0) {
        positions.push(cartesian.clone());
        _this.addPoint(cartesian);

        // 注册鼠标移动事件
        _this.viewer.screenSpaceEventHandler.setInputAction(function(moveEvent: any) {
          let movePosition = _this.viewer.scene.pickPosition(moveEvent.endPosition); // 鼠标移动的点
          if (typeof movePosition == "undefined") { // 如果鼠标悬停在label上, 就有可能获取不到坐标
            return;
          }
          if (positions.length >= 2) {
            positions.pop();
            positions.pop();
            positions.pop();
            try {
              let cartographic = Cesium.Cartographic.fromCartesian(movePosition);
              let height = Cesium.Cartographic.fromCartesian(positions[0]).height;

              let verticalPoint = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), height);
              positions.push(verticalPoint);
              positions.push(movePosition);
              positions.push(positions[0]);

              // 绘制label
              if (labelEntity_1) {

                _this.viewer.entities.remove(labelEntity_1);
                _this.entityCollection.splice(_this.entityCollection.indexOf(labelEntity_1), 1);
                _this.viewer.entities.remove(labelEntity_2);
                _this.entityCollection.splice(_this.entityCollection.indexOf(labelEntity_2), 1);
                _this.viewer.entities.remove(labelEntity_3);
                _this.entityCollection.splice(_this.entityCollection.indexOf(labelEntity_3), 1);
              }

              // 计算中点
              // let centerPoint_1 = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
              let centerPoint_1 = positions[0];
              // 计算距离
              let lengthText_1 = "水平距离：" + _this.getLengthText(positions[0], positions[1]).toFixed(4) + "米";

              labelEntity_1 = _this.addLabel(centerPoint_1, lengthText_1);
              _this.entityCollection.push(labelEntity_1);
              _this.tempEntityCollection.push(labelEntity_1);

              // 计算中点
              // let centerPoint_2 = Cesium.Cartesian3.midpoint(positions[1], positions[2], new Cesium.Cartesian3());
              let centerPoint_2 = positions[2];
              // 计算距离
              let lengthText_2 = "垂直距离：" + _this.getLengthText(positions[1], positions[2]).toFixed(4) + "米";

              labelEntity_2 = _this.addLabel(centerPoint_2, lengthText_2);
              _this.entityCollection.push(labelEntity_2);
              _this.tempEntityCollection.push(labelEntity_2);

              // 计算中点
              let centerPoint_3 = Cesium.Cartesian3.midpoint(positions[2], positions[3], new Cesium.Cartesian3());
              // 计算距离
              let lengthText_3 = "直线距离：" + _this.getLengthText(positions[2], positions[3]).toFixed(4) + "米";

              labelEntity_3 = _this.addLabel(centerPoint_3, lengthText_3);
              _this.entityCollection.push(labelEntity_3);
              _this.tempEntityCollection.push(labelEntity_3);
            } catch (error) {
              console.log(error);
            }
          } else {
            try {
              let verticalPoint = new Cesium.Cartesian3(movePosition.x, movePosition.y, positions[0].z);
              positions.push(verticalPoint);
              positions.push(movePosition);
              positions.push(positions[0]);
              // 绘制线
              _this.addLine(positions);
            } catch (error) {
              console.log(error);
            }
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      } else {
        // 存储第二个点
        positions.pop();
        positions.pop();
        positions.pop();
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        let height = Cesium.Cartographic.fromCartesian(positions[0]).height;

        let verticalPoint = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), height);
        positions.push(verticalPoint);
        positions.push(cartesian);
        positions.push(positions[0]);
        _this.addPoint(cartesian);
        _this.tempEntityCollection = [];
        _this.viewModel.measureHeightEnabled = false;

        _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        _this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //测量面积
  measureArea() {
    let _this = this;
    // let tooltip = document.getElementById("measureTip");
    let isDraw = false;
    let polygonPath: Cesium.Cartesian3[] = [];
    let polygon: any;
    let handler = _this.viewer.screenSpaceEventHandler;
    let AllEnities = [];
    let tempAreaLabel: Cesium.Entity;
    handler.setInputAction(function(movement: any) {
      //新增部分
      let position1;
      let cartographic;
      let ray = _this.viewer.scene.camera.getPickRay(movement.endPosition);
      if (ray)
        position1 = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
      if (position1)
        cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position1);
      if (cartographic) {
        //海拔
        let height = _this.viewer.scene.globe.getHeight(cartographic);
        let point = Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, height);
        if (isDraw) {
          if (polygonPath.length < 2) {
            return;
          }
          if (!Cesium.defined(polygon)) {
            polygonPath.push(point);
            // @ts-ignore
            polygon = new CreatePolygon(polygonPath, Cesium);
            AllEnities.push(polygon);
          } else {
            if (tempAreaLabel) {

              _this.viewer.entities.remove(tempAreaLabel);
            }
            if (polygonPath.length >= 4) {
              let coordinates = CesiumMethod.cartesian3sToLngLats(polygonPath);
              let first = CesiumMethod.cartesian3ToLngLat(polygonPath[0]);
              coordinates.push(first);
              tempAreaLabel = createAreaLabel(coordinates);
              AllEnities.push(tempAreaLabel);
              _this.entityCollection.push(tempAreaLabel);
              _this.tempEntityCollection.push(tempAreaLabel);
            }
            polygon.path.pop();
            polygon.path.push(point);
            AllEnities.push(polygon);
          }
          if (polygonPath.length >= 2) {
            // tooltip.innerHTML = '<p>双击确定终点</p>';
          }
        }
      }

    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(function(movement: any) {
      isDraw = true;
      //新增部分
      let position1;
      let cartographic;
      let ray = _this.viewer.scene.camera.getPickRay(movement.position);
      if (ray)
        position1 = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
      if (position1)
        cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position1);
      if (cartographic) {
        //海拔
        let height = _this.viewer.scene.globe.getHeight(cartographic);
        let point = Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, height);
        if (isDraw) {
          polygonPath.push(point);
          let temp = _this.addPoint(point);
          // let temp = _this.addPoint(point);
          AllEnities.push(temp);
          _this.entityCollection.push(temp);
          _this.tempEntityCollection.push(temp);
        }
      }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(function() {
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      if (polygonPath.length >= 2) {
        let coords = [];
        for (let i = 0; i < polygon.path.length; i++) {
          const element = polygon.path[i];
          let cartographic = Cesium.Cartographic.fromCartesian(element);
          let lon = Cesium.Math.toDegrees(cartographic.longitude);
          let lat = Cesium.Math.toDegrees(cartographic.latitude);
          coords.push([lon, lat]);
        }
        coords.push(coords[0]);
        let lastpoint = createAreaLabel(coords);
        AllEnities.push(lastpoint);
        _this.entityCollection.push(lastpoint);
        _this.tempEntityCollection.push(lastpoint);

      }

      _this.viewer.entities.remove(tempAreaLabel);
      _this.viewer.trackedEntity = undefined;
      isDraw = false;
      // tooltip.style.display = 'none';
      _this.tempEntityCollection = [];
      _this.viewModel.measureAreaEnabled = false;

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    let createAreaLabel = function(coords: Array<Array<number>>) {
      let area = CesiumMethod.calcPolygonArea(coords).toFixed(2);
      let label = String(countAreaInCartesian3(polygon.path));
      area = area.substring(0, area.indexOf(".", 0));
      let text;
      if (area.length < 6)
        text = area + "平方米";
      else {
        area = String(+area / 1000000);
        area = area.substring(0, area.indexOf(".", 0) + 3);
        text = area + "平方公里";
      }
      let res = CesiumMethod.countPolygonCenter(polygon.path);
      let textArea = text;
      return _this.addLabel(res.cart, textArea);
    };

    let CreatePolygon = (() => {
      function _(positions: Cesium.Cartesian3[]) {
        if (!Cesium.defined(positions)) {
          throw new Cesium.DeveloperError("positions is required!");
        }
        if (positions.length < 3) {
          throw new Cesium.DeveloperError("positions 的长度必须大于等于3");
        }

        _.prototype.options = {
          polygon: {
            show: true,
            hierarchy: undefined,
            outline: true,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3,
            // material: Cesium.Color.YELLOW.withAlpha(0.4)
            material: Cesium.Color.fromCssColorString("#2a747d").withAlpha(0.5)
          }
        };
        _.prototype.path = positions;
        _.prototype.hierarchy = positions;
        _.prototype._init();
      }

      _.prototype._init = function() {
        let _self = this;
        let _update = function() {
          // return _self.hierarchy;
          return new Cesium.PolygonHierarchy(_self.hierarchy);
        };
        //实时更新polygon.hierarchy
        this.options.polygon.hierarchy = new Cesium.CallbackProperty(_update, false);
        let oo = _this.viewer.entities.add(this.options);
        AllEnities.push(oo);
        _this.entityCollection.push(oo);
        _this.tempEntityCollection.push(oo);
      };

      return _;
    })();

    //微元法求面积
    let countAreaInCartesian3 = function(ps: Cesium.Cartesian3[]) {
      let s = 0;
      for (let i = 0; i < ps.length; i++) {
        let p1 = ps[i];
        let p2;
        if (i < ps.length - 1)
          p2 = ps[i + 1];
        else
          p2 = ps[0];
        s += p1.x * p2.y - p2.x * p1.y;
      }
      return Math.abs(s / 2);
    };
  }

  addPoint(position: Cesium.Cartesian3) {
    let _this = this;
    let entity = _this.viewer.entities.add(new Cesium.Entity({
      position: position,
      // billboard: {
      //   image: "data:image/png;base64,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",
      //   width: 20,
      //   height: 20,
      //   eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
      //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //绝对贴地
      //   disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      // }
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString("#e9fabc").withAlpha(0.6),
        outlineColor: Cesium.Color.fromCssColorString("#2a747d").withAlpha(0.8),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //绝对贴地
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    }));
    _this.entityCollection.push(entity);
    _this.tempEntityCollection.push(entity);
    return entity;
  }

  addLine(positions: Cesium.Cartesian3[]) {
    let _this = this;
    let dynamicPositions = new Cesium.CallbackProperty(function() {
      return positions;
    }, false);
    let entity = _this.viewer.entities.add(new Cesium.Entity({
      polyline: {
        positions: dynamicPositions,
        width: 4,
        clampToGround: true,
        material: Cesium.Color.fromCssColorString("#e9fabc").withAlpha(0.8)
      }
    }));
    _this.entityCollection.push(entity);
    _this.tempEntityCollection.push(entity);
  }

  addPolyGon(positions: Cesium.Cartesian3[]) {
    let _this = this;
    let dynamicPositions = new Cesium.CallbackProperty(function() {
      return new Cesium.PolygonHierarchy(positions);
    }, false);
    let entity = _this.viewer.entities.add(new Cesium.Entity({
      polygon: {
        hierarchy: dynamicPositions,
        material: Cesium.Color.fromCssColorString("#2a747d").withAlpha(0.5),
        classificationType: Cesium.ClassificationType.BOTH // 贴地表和贴模型,如果设置了，就不能使用挤出高度
      }
    }));
    _this.entityCollection.push(entity);
    _this.tempEntityCollection.push(entity);
  }

  addLabel(centerPoint: Cesium.Cartesian3, text: string) {
    let _this = this;
    return _this.viewer.entities.add(new Cesium.Entity({
      position: centerPoint,
      label: {
        text: text,
        font: "16px Microsoft YaHei",
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
        fillColor: Cesium.Color.WHITE,
        showBackground: false, //指定标签后面背景的可见性
        backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充padding
        pixelOffset: new Cesium.Cartesian2(0, -25),
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    }));
  }

  addLabelWithPoint(centerPoint: Cesium.Cartesian3, text: string) {
    let _this = this;
    return _this.viewer.entities.add(new Cesium.Entity({
      position: centerPoint,
      // billboard: {
      //   image: "data:image/png;base64,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",
      //   width: 20,
      //   height: 20,
      //   eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
      //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //绝对贴地
      //   disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      // },
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString("#e9fabc").withAlpha(0.6),
        outlineColor: Cesium.Color.fromCssColorString("#2a747d").withAlpha(0.8),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //绝对贴地
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      },
      label: {
        text: text,
        font: "16px Microsoft YaHei",
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
        fillColor: Cesium.Color.WHITE,
        showBackground: false, //指定标签后面背景的可见性
        backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充padding
        pixelOffset: new Cesium.Cartesian2(0, -35),
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      }
    }));
  }

  getLengthText(firstPoint: Cesium.Cartesian3, secondPoint: Cesium.Cartesian3) {
    // 计算距离
    let length = 0;
    if (firstPoint) {
      length = Cesium.Cartesian3.distance(firstPoint, secondPoint);
    }
    return length;
  }

  getArea(points: Cesium.Cartesian3[]) {
    let _this = this;
    let radiansPerDegree = Math.PI / 180.0; //角度转化为弧度(rad)
    let degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度

    /*角度*/
    function Angle(p1: Cesium.Cartesian3, p2: Cesium.Cartesian3, p3: Cesium.Cartesian3) {
      let bearing21 = Bearing(p2, p1);
      let bearing23 = Bearing(p2, p3);
      let angle = bearing21 - bearing23;
      if (angle < 0) {
        angle += 360;
      }
      return angle;
    }

    /*方向*/
    function Bearing(from: Cesium.Cartesian3, to: Cesium.Cartesian3) {
      let fromCarto = Cesium.Cartographic.fromCartesian(from);
      let toCarto = Cesium.Cartographic.fromCartesian(to);

      let lat1 = fromCarto.latitude;
      let lon1 = fromCarto.longitude;
      let lat2 = toCarto.latitude;
      let lon2 = toCarto.longitude;
      let angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
      if (angle < 0) {
        angle += Math.PI * 2.0;
      }
      angle = angle * degreesPerRadian; //角度
      return angle;
    }

    function distance(point1: Cesium.Cartesian3, point2: Cesium.Cartesian3) {
      let point1cartographic = Cesium.Cartographic.fromCartesian(point1);
      let point2cartographic = Cesium.Cartographic.fromCartesian(point2);
      /**根据经纬度计算出距离**/
      let geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(point1cartographic, point2cartographic);
      let s = geodesic.surfaceDistance;
      //返回两点之间的距离
      s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
      return s;
    }

    let res = 0;
    //拆分三角曲面

    for (let i = 0; i < points.length - 2; i++) {
      let j = (i + 1) % points.length;
      let k = (i + 2) % points.length;
      let totalAngle = Angle(points[i], points[j], points[k]);


      let dis_temp1 = distance(points[j], points[0]);
      let dis_temp2 = distance(points[k], points[0]);
      res += dis_temp1 * dis_temp2 * Math.sin(totalAngle) / 2;
    }

    let resStr = "";
    if (res < 1000000) {
      resStr = Math.abs(res).toFixed(4) + " 平方米";
    } else {
      resStr = Math.abs(Number((res / 1000000.0).toFixed(4))) + " 平方公里";
    }

    return resStr;

  }

  getCenterOfGravityPoint(mPoints: Cesium.Cartesian3[]) {
    let _this = this;
    let centerPoint = mPoints[0];
    for (let i = 1; i < mPoints.length; i++) {
      centerPoint = Cesium.Cartesian3.midpoint(centerPoint, mPoints[i], new Cesium.Cartesian3());
    }
    return centerPoint;
  }
}

export default MeasureTools;

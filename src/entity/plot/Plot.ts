import * as Cesium from "cesium";
import PlotTracker from "./PlotTracker";
import PlotMoveDrawer from "./PlotMoveDrawer";

interface Draw {
  flag: number,
  layerId: string,
  shape: Array<any>,
  shapeDic: any,
}

interface _editParams {
  objId: string,
  isEdit: boolean,
  shapeType: string,
}

class Plot {
  viewer: any;
  draw: Draw = {
    flag: 0,
    layerId: "globeDrawerDemoLayer",
    shape: [],
    shapeDic: {}
  };
  plotTracker: PlotTracker;
  moveDrawer: PlotMoveDrawer;
  editHandler: any;
  _editParams: _editParams = {
    objId: "",
    isEdit: false,
    shapeType: ""
  };
  _shapeTypes: Array<string> = ["Polygon", "Polyline", "Rectangle", "Circle", "Point", "BufferLine", "StraightArrow", "AttackArrow", "PincerArrow"];

  constructor(viewer: any) {
    this.viewer = viewer;
    this.plotTracker = new PlotTracker(this.viewer);
    this.moveDrawer = new PlotMoveDrawer(this.viewer, this);
    this.bindGloveEvent();
  }

  bindGloveEvent() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const pick = this.viewer.scene.pick(movement.position);
      if (!pick) {
        return;
      }
      const obj = pick.id;
      if (!obj || !obj.layerId || this.draw.flag == 0) {
        return;
      }
      const objId = obj.objId;
      //flag为编辑或删除标识,1为编辑，2为删除
      if (this.draw.flag == 1 && this._shapeTypes.indexOf(obj.shapeType) > -1) {
        this.draw.flag = 0;
        this._editParams = {
          objId: objId,
          isEdit: true,
          shapeType: obj.shapeType
        };
      } else if (this.draw.flag == 2) {
        this.clearEntityById(objId);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  moveShape() {
    this.plotTracker.clear();
    return this.moveDrawer.moveShape();
  }

  editShape() {
    // TODO 编辑图形时使用自定义弹窗
    this.draw.flag = 1;
    //清除标绘状态
    this.plotTracker.clear();
    return new Promise((resolve, reject) => {
      const timeId = setInterval(() => {
        if (this._editParams.isEdit) {
          clearInterval(timeId);
          // @ts-ignore
          this[`edit${this._editParams.shapeType}`](this._editParams.objId).then((res: any) => {
            this._editParams.isEdit = false;
            resolve(res);
          }).catch(() => {
            this._editParams.isEdit = false;
            reject();
          });
        }
      }, 100);
    });
  }

  drawPoint(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackPoint(options).then((position: any) => {
        this.draw.shapeDic[objId] = position;
        let entity = this.createPoint(position, objId);
        resolve({ position: position, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showPoint(options?: any) {
    const { position, objId } = options;
    let entity = this.createPoint(position, objId);
    return { position: position, entity: entity };
  }

  createPoint(position: any, objId: string) {
    const entity = this.viewer.entities.add({
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "Point",
      position: position,
      billboard: {
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjUlEQVQ4T5WTO0gDQRCG598TUohgLqUIChcSEBsfjQ9MEWvtFDs7E+0tUllaa5JSECzstLdI46NQGxESc2JELBMLCxEuO86dXkhiAndX7c3O/PvPzregHl+sWBlpOioOQyXdbW7qsjGgq/VM4r07Hd0Bs2gfMfMkgT6hKcKAI0nfTBwF8NDIWJvtNR0CZsF+kcSaBFO9nEnskQiDjaw17u+3BKKF6q38TPcp7Agz0d1HNj7jBj2BWNHeF9sLspwLIiA5p9LOaz1j7cLM26Ni+wygqYDFXhoz3YOwCvPwaRkKObG1FEZAzF+S1nuI5e0dDV6XXubDCdANGCeIFp63xNAGiBdDCTBdM9Qxhg+qKWUgJyLpMAIMKrFD0oJQp1mdBx2hf4g7SgW94o3RpU+udVaWE0FcSHFJxlhzqWyB5FIobYwFEZAJ1HwaO1D+o9EWkbU+QldyesSnsEVie7JLpdacFotf4siQgqYicjTTkFK4cOlrz//3Gr07ETqJdRJQiV/qdIWgyo1t663b2Q/kAI6uzOBy0gAAAABJRU5ErkJggg==",
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, 0)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //绝对贴地
        clampToGround: true,
        disableDepthTestDistance: Number.POSITIVE_INFINITY //元素在正上方
      },
      clampToGround: true
    });
    this.draw.shape.push(entity);
    return entity;
  }

  editPoint(objId: string) {
    let position = this.draw.shapeDic[objId];
    let oldPosition = JSON.parse(JSON.stringify(position));
    //先移除entity
    this.clearEntityById(objId);

    return new Promise((resolve, reject) => {
      this.plotTracker.pointDrawer.showModifyPoint({ position: position }).then((position: any) => {
        this.draw.shapeDic[objId] = position;
        let res = this.showPoint({ position: position, objId: objId });
        resolve(res);
      }).catch(() => {
        this.draw.shapeDic[objId] = oldPosition;
        let res = this.showPoint({ position: oldPosition, objId: objId });
        reject(res);
      });
    });
  }

  drawPolyline(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackPolyline(options).then((positions: any) => {
        this.draw.shapeDic[objId] = positions;
        let entity = this.createPolyline(positions, objId);
        resolve({ positions: positions, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showPolyline(options: any) {
    const { positions, objId } = options;
    let entity = this.createPolyline(positions, objId);
    return { positions: positions, entity: entity };
  }

  createPolyline(positions: any, objId: string) {
    const material = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.25,
      color: Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)")
    });
    const bData = {
      name: "折线",
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "Polyline",
      polyline: {
        positions: positions,
        clampToGround: true,
        width: 8,
        material: material
      }
    };
    const entity = this.viewer.entities.add(bData);
    this.draw.shape.push(entity);
    return entity;
  }


  editPolyline(objId: string) {
    let positions = this.draw.shapeDic[objId];
    let oldPositions = JSON.parse(JSON.stringify(positions));
    //先移除entity
    this.clearEntityById(objId);
    return new Promise((resolve, reject) => {
      this.plotTracker.polylineDrawer.showModifyPolyline({ positions: positions }).then((positions: any) => {
        this.draw.shapeDic[objId] = positions;
        let res = this.showPolyline({ positions: positions, objId: objId });
        resolve(res);
      }).catch(() => {
        this.draw.shapeDic[objId] = oldPositions;
        let res = this.showPolyline({ positions: oldPositions, objId: objId });
        reject(res);
      });
    });
  }

  drawPolygon(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackPolygon(options).then((positions: any) => {
        console.log(positions);
        this.draw.shapeDic[objId] = positions;
        let entity = this.createPolygon(positions, objId);
        resolve({ positions: positions, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showPolygon(options: any) {
    const { positions, objId } = options;
    let entity = this.createPolygon(positions, objId);
    return { positions: positions, entity: entity };
  }

  createPolygon(positions: Array<any>, objId: string) {
    let outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    // @ts-ignore
    let outlinePositions = [].concat(positions);
    // @ts-ignore
    outlinePositions.push(positions[0]);
    let bData = {
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "Polygon",
      cType: "plot",
      polyline: {
        positions: outlinePositions,
        clampToGround: true,
        width: 2,
        material: outlineMaterial
      },
      polygon: {
        hierarchy: positions,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        asynchronous: false,
        material: Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)")
      }
    };
    const entity = this.viewer.entities.add(bData);
    this.draw.shape.push(entity);
    return entity;
  }


  editPolygon(objId: string) {
    let positions = this.draw.shapeDic[objId];
    let oldPositions = JSON.parse(JSON.stringify(positions));
    //先移除entity
    this.clearEntityById(objId);
    return new Promise((resolve, reject) => {
      this.plotTracker.polygonDrawer.showModifyPolygon({ positions: positions }).then((positions: any) => {
        console.log(positions);
        this.draw.shapeDic[objId] = positions;
        let res = this.showPolygon({ positions: positions, objId: objId });
        resolve(res);
      }).catch(() => {
        this.draw.shapeDic[objId] = oldPositions;
        let res = this.showPolygon({ positions: oldPositions, objId: objId });
        reject(res);
      });
    });
  }

  drawRectangle(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackRectangle(options).then((positions: any) => {
        console.log(positions);
        this.draw.shapeDic[objId] = positions;
        let entity = this.createRectangle(positions, objId);
        resolve({ positions: positions, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showRectangle(options: any) {
    const { positions, objId } = options;
    let entity = this.createRectangle(positions, objId);
    return { positions: positions, entity: entity };
  }

  createRectangle(positions: Array<any>, objId: string) {
    let material = new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)"));
    let outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    let rect = Cesium.Rectangle.fromCartesianArray(positions);
    let arr = [rect.west, rect.north, rect.east, rect.north, rect.east, rect.south, rect.west, rect.south, rect.west,
      rect.north
    ];
    let outlinePositions = Cesium.Cartesian3.fromRadiansArray(arr);
    let bData = {
      rectanglePosition: positions,
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "Rectangle",
      polyline: {
        positions: outlinePositions,
        clampToGround: true,
        width: 2,
        material: outlineMaterial
      },
      rectangle: {
        coordinates: rect,
        material: material
      }
    };
    const entity = this.viewer.entities.add(bData);
    this.draw.shape.push(entity);
    return entity;
  }


  editRectangle(objId: string) {
    let positions = this.draw.shapeDic[objId];
    let oldPositions = JSON.parse(JSON.stringify(positions));
    //先移除entity
    this.clearEntityById(objId);
    return new Promise((resolve, reject) => {
      this.plotTracker.rectangleDrawer.showModifyRectangle({ positions: positions }).then((positions: any) => {
        console.log(positions);
        this.draw.shapeDic[objId] = positions;
        let res = this.showRectangle({ positions: positions, objId: objId });
        resolve(res);
      }).catch(() => {
        this.draw.shapeDic[objId] = oldPositions;
        let res = this.showRectangle({ positions: oldPositions, objId: objId });
        reject(res);
      });
    });
  }

  drawCircle(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackCircle(options).then((positions: any) => {
        console.log(positions);
        this.draw.shapeDic[objId] = positions;
        let entity = this.createCircle(positions, objId);
        resolve({ positions: positions, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showCircle(options: any) {
    const { positions, objId } = options;
    let entity = this.createCircle(positions, objId);
    return { positions: positions, entity: entity };
  }

  createCircle(positions: any, objId: string) {
    let distance = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      const point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
      const point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);
      /**根据经纬度计算出距离**/
      const geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(point1cartographic, point2cartographic);
      let s = geodesic.surfaceDistance;
      //返回两点之间的距离
      //			s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
      s = Math.abs(point2cartographic.height - point1cartographic.height);
      distance = distance + s;
    }
    const material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)");
    const outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    const radiusMaterial = new Cesium.PolylineGlowMaterialProperty({
      // @ts-ignore
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    const pnts = this.plotTracker.circleDrawer._computeCirclePolygon(positions);
    const dis = this.plotTracker.circleDrawer._computeCircleRadius3D(positions);
    // dis = (dis / 1000).toFixed(3);
    const value = typeof positions.getValue === "function" ? positions.getValue(0) : positions;
    const text = dis + "km";
    const r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));
    // var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));

    const bData = {
      circlePosition: positions,
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "Circle",
      position: positions[0],
      ellipse: {
        semiMajorAxis: dis ? dis : dis + 1,
        semiMinorAxis: dis ? dis : dis + 1,
        material: material
      },
      polyline: {
        positions: pnts,
        clampToGround: true,
        width: 2,
        material: outlineMaterial
      }
    };
    const entity = this.viewer.entities.add(bData);
    this.draw.shape.push(entity);
    return entity;
  }


  editCircle(objId: string) {
    let positions = this.draw.shapeDic[objId];
    let oldPositions = JSON.parse(JSON.stringify(positions));
    //先移除entity
    this.clearEntityById(objId);
    return new Promise((resolve, reject) => {
      this.plotTracker.circleDrawer.showModifyCircle({ positions: positions }).then((positions: any) => {
        console.log(positions);
        this.draw.shapeDic[objId] = positions;
        let res = this.showCircle({ positions: positions, objId: objId });
        resolve(res);
      }).catch(() => {
        this.draw.shapeDic[objId] = oldPositions;
        let res = this.showCircle({ positions: oldPositions, objId: objId });
        reject(res);
      });
    });
  }

  drawAttackArrow(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackAttackArrow(options).then((data: any) => {
        this.draw.shapeDic[objId] = {
          custom: data.custom,
          positions: data.positions
        };
        let entity = this.createAttackArrow(data.positions, objId);
        resolve({ data: data, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showAttackArrow(options: any) {
    const { positions, objId } = options;
    let entity = this.createAttackArrow(positions, objId);
    return { positions: positions, entity: entity };
  }

  createAttackArrow(positions: any, objId: string) {
    const material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)");
    const outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    const outlinePositions: any = [].concat(positions);
    outlinePositions.push(positions[0]);
    const bData = {
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "AttackArrow",
      polyline: {
        positions: outlinePositions,
        clampToGround: true,
        width: 2,
        material: outlineMaterial
      },
      polygon: new Cesium.PolygonGraphics({
        hierarchy: positions,
        // @ts-ignore
        asynchronous: false,
        material: material
      })
    };
    const entity = this.viewer.entities.add(bData);
    this.draw.shape.push(entity);
    return entity;
  }


  editAttackArrow(objId: string) {
    let data = this.draw.shapeDic[objId];
    let oldData = JSON.parse(JSON.stringify(data));
    //先移除entity
    this.clearEntityById(objId);
    return new Promise((resolve, reject) => {
      this.plotTracker.attackArrowDrawer.showModifyAttackArrow({ custom: data.custom }).then((data: any) => {
        //保存编辑结果
        this.draw.shapeDic[objId] = {
          custom: data.custom,
          positions: data.positions
        };
        let res = this.showAttackArrow({ positions: data.positions, objId: objId });
        resolve(res);
      }).catch(() => {
        //保存编辑结果
        this.draw.shapeDic[objId] = {
          custom: oldData.custom,
          positions: oldData.positions
        };
        let res = this.showAttackArrow({ positions: oldData.positions, objId: objId });
        reject(res);
      });
    });
  }

  drawPincerArrow(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackPincerArrow(options).then((data: any) => {
        this.draw.shapeDic[objId] = {
          custom: data.custom,
          positions: data.positions
        };
        let entity = this.createPincerArrow(data.positions, objId);
        resolve({ data: data, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showPincerArrow(options: any) {
    const { positions, objId } = options;
    let entity = this.createPincerArrow(positions, objId);
    return { positions: positions, entity: entity };
  }

  createPincerArrow(positions: any, objId: string) {
    const material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)");
    const outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    const outlinePositions: any = [].concat(positions);
    outlinePositions.push(positions[0]);
    const bData = {
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "PincerArrow",
      polyline: {
        positions: outlinePositions,
        clampToGround: true,
        width: 2,
        material: outlineMaterial
      },
      polygon: new Cesium.PolygonGraphics({
        hierarchy: positions,
        // @ts-ignore
        asynchronous: false,
        material: material
      })
    };
    const entity = this.viewer.entities.add(bData);
    this.draw.shape.push(entity);
    return entity;
  }


  editPincerArrow(objId: string) {
    let data = this.draw.shapeDic[objId];
    let oldData = JSON.parse(JSON.stringify(data));
    //先移除entity
    this.clearEntityById(objId);
    return new Promise((resolve, reject) => {
      this.plotTracker.pincerArrowDrawer.showModifyPincerArrow({ custom: data.custom }).then((data: any) => {
        //保存编辑结果
        this.draw.shapeDic[objId] = {
          custom: data.custom,
          positions: data.positions
        };
        let res = this.showPincerArrow({ positions: data.positions, objId: objId });
        resolve(res);
      }).catch(() => {
        //保存编辑结果
        this.draw.shapeDic[objId] = {
          custom: oldData.custom,
          positions: oldData.positions
        };
        let res = this.showPincerArrow({ positions: oldData.positions, objId: objId });
        reject(res);
      });
    });
  }


  drawStraightArrow(options?: any) {
    this.draw.flag = 0;
    const objId = (new Date()).getTime() + "";
    return new Promise((resolve, reject) => {
      this.plotTracker.trackStraightArrow(options).then((positions: any) => {
        this.draw.shapeDic[objId] = {
          positions: positions
        };
        let entity = this.createStraightArrow(positions, objId);
        resolve({ positions: positions, entity: entity });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  showStraightArrow(options: any) {
    const { positions, objId } = options;
    let entity = this.createStraightArrow(positions, objId);
    return { positions: positions, entity: entity };
  }

  createStraightArrow(positions: any, objId: string) {
    const material = Cesium.Color.fromCssColorString("rgba(67,106,190,0.5)");
    const outlineMaterial = new Cesium.PolylineDashMaterialProperty({
      dashLength: 16,
      color: Cesium.Color.fromCssColorString("rgb(210,215,68)")
    });
    const outlinePositions: any = [].concat(positions);
    outlinePositions.push(positions[0]);
    const bData = {
      layerId: this.draw.layerId,
      objId: objId,
      shapeType: "StraightArrow",
      polyline: {
        positions: outlinePositions,
        clampToGround: true,
        width: 2,
        material: outlineMaterial
      },
      polygon: new Cesium.PolygonGraphics({
        hierarchy: positions,
        // @ts-ignore
        asynchronous: false,
        material: material
      })
    };
    const entity = this.viewer.entities.add(bData);
    this.draw.shape.push(entity);
    return entity;
  }


  editStraightArrow(objId: string) {
    let positions = this.draw.shapeDic[objId].positions;
    let oldPositions = JSON.parse(JSON.stringify(positions));
    //先移除entity
    this.clearEntityById(objId);
    return new Promise((resolve, reject) => {
      this.plotTracker.straightArrowDrawer.showModifyStraightArrow({ positions: positions }).then((positions: any) => {
        //保存编辑结果
        this.draw.shapeDic[objId] = {
          positions: positions
        };
        let res = this.showStraightArrow({ positions: positions, objId: objId });
        resolve(res);
      }).catch(() => {
        //保存编辑结果
        this.draw.shapeDic[objId] = {
          positions: oldPositions
        };
        let res = this.showStraightArrow({ positions: oldPositions, objId: objId });
        reject(res);
      });
    });
  }


  clearEntityById(objId: string) {
    let _this = this;
    let entityList = _this.viewer.entities.values;
    if (entityList == null || entityList.length < 1) {
      return;
    }
    for (let i = 0; i < entityList.length; i++) {
      let entity = entityList[i];
      if (entity.layerId === _this.draw.layerId && entity.objId === objId) {
        _this.viewer.entities.remove(entity);
        i--;
      }
    }
  }

  getEntity(objId: string) {
    let _this = this;
    let entityList = _this.viewer.entities.values;
    if (entityList == null || entityList.length < 1) {
      return;
    }
    for (let i = 0; i < entityList.length; i++) {
      let entity = entityList[i];
      if (entity.layerId === _this.draw.layerId && entity.objId === objId) {
        i--;
        return entity;
      }
    }
  }
}

export default Plot;

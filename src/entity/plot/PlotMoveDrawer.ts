import * as Cesium from "cesium";
import CesiumMethod from "../../plugins/lib/CesiumMethod";

class PlotMoveDrawer {
  viewer: any;
  scene: any;
  clock: any;
  canvas: any;
  camera: any;
  ellipsoid: any;
  objId: any = (new Date()).getTime();
  leftDownFlag: boolean = false;
  pointDragged: any;
  startPoint: any;
  // 保存线，多边形，矩形坐标
  polylinePreviousCoordinates: any = {};
  polygonPreviousCoordinates: any = {};
  rectanglePreviousCoordinates: any = {};
  ellipsePreviousCoordinates: any = {};
  pointPreviousCoordinates: any = {};
  rectanglePosition: any = {};
  bufferLinePreviousCoordinates: any = {};
  straightArrowCoordinates: any = {};
  attackArrowCoordinates: any = {};
  pincerArrowCoordinates: any = {};
  // 临时存储点坐标
  rectanglePoint: any = [];
  currentsPoint: any = [];
  savePointCurrentsPoint: any = [];
  savePolylineCurrentsPoint: any = [];
  savePolygonCurrentsPoint: any = [];
  saveRectangleCurrentsPoint: any = [];
  saveCircleCurrentsPoint: any = [];
  saveBufferLineCurrentsPoint: any = [];
  saveAttackArrowCurrentsPoint: any = [];
  savePincerArrowCurrentsPoint: any = [];
  saveStraightArrowCurrentsPoint: any = [];
  saveRectangle: any = [];
  saveAttackArrow: any = [];
  savePincerArrow: any = [];
  pincerPoints: any = []; //保存钳击箭头中“点”的经纬度
  pincerPointsCart: any = []; //保存钳击箭头中“点”的墨卡托
  attackPoints: any = []; //保存攻击箭头中“点”的经纬度
  attackPointsCart: any = []; //保存攻击箭头中“点”的墨卡托
  startTime: any;
  obj: any;
  moveHandler: any;
  circleOutlineEntity: any;
  plot: any = {};

  constructor(viewer: any, plot: any) {
    this.viewer = viewer;
    this.scene = viewer.scene;
    this.clock = viewer.clock;
    this.canvas = viewer.scene.canvas;
    this.camera = viewer.scene.camera;
    this.ellipsoid = viewer.scene.globe.ellipsoid;
    this.plot = plot;
  }

  clear() {
    if (this.moveHandler) {
      if (!this.moveHandler.isDestroyed()) {
        this.moveHandler.destroy();
      }
    }
  }

  moveShape() {
    this.plot.flag = 0;
    this.plot.plotTracker.clear();
    let isMoving = false;
    let isClickConfirm = false;
    let currentEntityId: string = "";
    this.moveHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.moveHandler.setInputAction((movement: any) => {
      if (isMoving) {
        isMoving = false;
        isClickConfirm = true;
        currentEntityId = this.pointDragged?.id?.id;
        this.confirmClick();
      } else {
        this.pointDragged = null;
        this.pointDragged = this.viewer.scene.pick(movement.position);
        if (!this.pointDragged) {
          return;
        }
        this.obj = null;
        this.obj = this.pointDragged.id;
        if (!this.obj || !this.obj.layerId) {
          isMoving = false;
          return;
        }
        isMoving = true;
        this.objId = this.obj.objId;

        // this.circleOutlineEntity = this.getEntityByObjId(this.objId);
        // console.log(this.circleOutlineEntity);
        this.leftDownFlag = true;
        this.currentsPoint = [];
        //记录按下去的坐标
        this.startPoint = this.viewer.scene.pickPosition(movement.position);
        this.viewer.scene.screenSpaceCameraController.enableRotate = false; //锁定相机
        // @ts-ignore
        this.startTime = new Cesium.JulianDate.now();
        if (this.plot.flag == 0) {
          switch (this.obj.shapeType) {
            case "Polygon":
              this.plot.flag = 0;
              this.clickPolygon(this.pointDragged);
              break;
            case "Polyline":
              this.plot.flag = 0;
              this.clickPolyline(this.pointDragged);
              break;
            case "Rectangle":
              this.plot.flag = 0;
              this.clickRectangle(this.pointDragged);
              break;
            case "Circle":
              this.plot.flag = 0;
              this.clickCircle(this.pointDragged);
              break;
            case "Point":
              this.plot.flag = 0;
              this.clickPoint(this.pointDragged);
              break;
            case "BufferLine":
              this.plot.flag = 0;
              this.clickBufferLine(this.pointDragged);
              break;
            case "StraightArrow":
              this.plot.flag = 0;
              this.clickStraightArrow(this.pointDragged);
              break;
            case "AttackArrow":
              this.plot.flag = 0;
              this.clickAttackArrow(this.pointDragged);
              break;
            case "PincerArrow":
              this.plot.flag = 0;
              this.clickPincerArrow(this.pointDragged);
              break;
            default:
              break;
          }
        }
        this.moveHandler.setInputAction((movement: any) => {
          let startPosition: any;
          let endPosition: any;
          // 有地形和无地形的情况下, 获取三维坐标的值会有差异，所以需要判断
          if (this.viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) { // 没有加载地形的情况
            startPosition = this.viewer.camera.pickEllipsoid(movement.startPosition, this.ellipsoid);
            endPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.ellipsoid);
          } else { // 有地形的情况
            startPosition = this.viewer.scene.pickPosition(movement.startPosition);
            endPosition = this.viewer.scene.pickPosition(movement.endPosition);
          }
          if (startPosition && endPosition) {
            if (Cesium.defined(this.currentsPoint)) {
              //计算每次的偏差
              let changed_x = endPosition.x - startPosition.x;
              let changed_y = endPosition.y - startPosition.y;
              let changed_z = endPosition.z - startPosition.z;
              if (!this.pointDragged) {
                return;
              }
              if (this.pointDragged.id.shapeType == "StraightArrow") {
                this.currentsPoint = [];
                for (let i = 0; i < this.straightArrowCoordinates.positions.length; i++) {
                  this.straightArrowCoordinates.positions[i].x += changed_x;
                  this.straightArrowCoordinates.positions[i].y += changed_y;
                  this.straightArrowCoordinates.positions[i].z += changed_z;
                  this.currentsPoint.push(this.straightArrowCoordinates.positions[i]);
                }
                this.saveStraightArrowCurrentsPoint = this.currentsPoint;
              }
              if (this.pointDragged.id.shapeType == "AttackArrow") {
                this.currentsPoint = []; //笛卡尔
                this.saveAttackArrow = []; //经纬度
                for (let i = 0; i < this.attackArrowCoordinates.positions.length; i++) {
                  this.attackArrowCoordinates.positions[i].x += changed_x;
                  this.attackArrowCoordinates.positions[i].y += changed_y;
                  this.attackArrowCoordinates.positions[i].z += changed_z;
                  this.currentsPoint.push(this.attackArrowCoordinates.positions[i]);
                }
                for (let i = 0; i < this.attackPointsCart.length; i++) {
                  this.attackPointsCart[i].x += changed_x;
                  this.attackPointsCart[i].y += changed_y;
                  this.attackPointsCart[i].z += changed_z;
                  let cartographic = Cesium.Cartographic.fromCartesian(this.attackPointsCart[i]);
                  let lon = Cesium.Math.toDegrees(cartographic.longitude);
                  let lat = Cesium.Math.toDegrees(cartographic.latitude);
                  this.saveAttackArrow.push([lon, lat]);
                }
                this.saveAttackArrowCurrentsPoint = this.currentsPoint;
                this.plot.draw.shapeDic[this.objId] = {
                  custom: this.saveAttackArrow,
                  positions: this.currentsPoint
                };
              }
              if (this.pointDragged.id.shapeType == "PincerArrow") {
                this.currentsPoint = [];
                this.savePincerArrow = [];
                for (let i = 0; i < this.pincerArrowCoordinates.positions.length; i++) {
                  this.pincerArrowCoordinates.positions[i].x += changed_x;
                  this.pincerArrowCoordinates.positions[i].y += changed_y;
                  this.pincerArrowCoordinates.positions[i].z += changed_z;
                  this.currentsPoint.push(this.pincerArrowCoordinates.positions[i]);
                }
                for (let i = 0; i < this.pincerPointsCart.length; i++) {
                  this.pincerPointsCart[i].x += changed_x;
                  this.pincerPointsCart[i].y += changed_y;
                  this.pincerPointsCart[i].z += changed_z;
                  let cartographic = Cesium.Cartographic.fromCartesian(this.pincerPointsCart[i]);
                  let lon = Cesium.Math.toDegrees(cartographic.longitude);
                  let lat = Cesium.Math.toDegrees(cartographic.latitude);
                  this.savePincerArrow.push([lon, lat]);
                }
                this.savePincerArrowCurrentsPoint = this.currentsPoint;

                this.plot.draw.shapeDic[this.objId] = {
                  custom: this.savePincerArrow,
                  positions: this.currentsPoint
                };
              }
              if (this.pointDragged.id.shapeType == "Point") {
                this.currentsPoint = [];
                this.savePointCurrentsPoint = endPosition;
                this.plot.draw.shapeDic[this.objId] = endPosition;
              }
              if (this.pointDragged.id.polyline && this.pointDragged.id.shapeType == "Polyline") {
                this.currentsPoint = [];
                for (let i = 0; i < this.polylinePreviousCoordinates.length; i++) {
                  //与之前的算差 替换掉
                  this.polylinePreviousCoordinates[i].x += changed_x;
                  this.polylinePreviousCoordinates[i].y += changed_y;
                  this.polylinePreviousCoordinates[i].z += changed_z;
                  this.currentsPoint.push(this.polylinePreviousCoordinates[i]);
                }
                this.savePolylineCurrentsPoint = this.currentsPoint;
              }
              if (this.pointDragged.id.polyline && this.pointDragged.id.shapeType == "BufferLine") {
                this.currentsPoint = [];
                for (let i = 0; i < this.bufferLinePreviousCoordinates.length; i++) {
                  //与之前的算差 替换掉
                  this.bufferLinePreviousCoordinates[i].x += changed_x;
                  this.bufferLinePreviousCoordinates[i].y += changed_y;
                  this.bufferLinePreviousCoordinates[i].z += changed_z;
                  this.currentsPoint.push(this.bufferLinePreviousCoordinates[i]);
                }
                this.saveBufferLineCurrentsPoint = this.currentsPoint;
              }
              if (this.pointDragged.id.polygon && this.pointDragged.id.shapeType == "Polygon") {
                if (this.polygonPreviousCoordinates.positions) {
                  this.currentsPoint = [];
                  this.savePolygonCurrentsPoint = [];
                  for (let i = 0; i < this.polygonPreviousCoordinates.positions.length; i++) {
                    this.polygonPreviousCoordinates.positions[i].x += changed_x;
                    this.polygonPreviousCoordinates.positions[i].y += changed_y;
                    this.polygonPreviousCoordinates.positions[i].z += changed_z;
                    let newCart = new Cesium.Cartesian3(this.polygonPreviousCoordinates.positions[i].x, this.polygonPreviousCoordinates.positions[i].y, this.polygonPreviousCoordinates.positions[i].z);
                    this.currentsPoint.push(newCart);
                  }
                  this.savePolygonCurrentsPoint = this.currentsPoint;
                  // 给边框的坐标赋值
                  let outlinePositions: any = [].concat(this.currentsPoint);
                  outlinePositions.push(this.currentsPoint[0]); // 将第一个点添加到边框坐标中，让边框闭合
                  this.savePolylineCurrentsPoint = outlinePositions;

                  this.plot.draw.shapeDic[this.objId] = this.savePolygonCurrentsPoint;
                }
              }
              if (this.pointDragged.id.shapeType == "Rectangle") {
                let storePoint = {};
                this.rectanglePoint = [];
                let cartographic_start = Cesium.Cartographic.fromCartesian(startPosition);
                let longitude_start = Cesium.Math.toDegrees(cartographic_start.longitude);
                let latitude_start = Cesium.Math.toDegrees(cartographic_start.latitude);
                let height_start = cartographic_start.height;

                let cartographic_end = Cesium.Cartographic.fromCartesian(endPosition);
                let longitude_end = Cesium.Math.toDegrees(cartographic_end.longitude);
                let latitude_end = Cesium.Math.toDegrees(cartographic_end.latitude);
                let height_end = cartographic_end.height;
                let changer_lng = longitude_end - longitude_start;
                let changer_lat = latitude_end - latitude_start;
                this.rectanglePreviousCoordinates.west = Cesium.Math.toRadians(Cesium.Math.toDegrees(this.rectanglePreviousCoordinates.west) +
                  changer_lng);
                this.rectanglePreviousCoordinates.east = Cesium.Math.toRadians(Cesium.Math.toDegrees(this.rectanglePreviousCoordinates.east) +
                  changer_lng);
                this.rectanglePreviousCoordinates.south = Cesium.Math.toRadians(Cesium.Math.toDegrees(this.rectanglePreviousCoordinates.south) +
                  changer_lat);
                this.rectanglePreviousCoordinates.north = Cesium.Math.toRadians(Cesium.Math.toDegrees(this.rectanglePreviousCoordinates.north) +
                  changer_lat);
                storePoint = this.rectanglePreviousCoordinates;
                this.saveRectangleCurrentsPoint = storePoint;
                for (let i = 0; i < this.rectanglePosition.length; i++) {
                  //与之前的算差 替换掉
                  this.rectanglePosition[i].x += changed_x;
                  this.rectanglePosition[i].y += changed_y;
                  this.rectanglePosition[i].z += changed_z;
                  this.rectanglePoint.push(this.rectanglePosition[i]);
                }
                this.obj.rectanglePosition = this.rectanglePoint;
                this.plot.draw.shapeDic[this.objId] = this.rectanglePoint;

                // 给边框的坐标赋值
                let rect = Cesium.Rectangle.fromCartesianArray(this.rectanglePoint);
                let arr = [rect.west, rect.north, rect.east, rect.north, rect.east, rect.south, rect.west, rect.south, rect.west, rect.north];
                this.savePolylineCurrentsPoint = Cesium.Cartesian3.fromRadiansArray(arr);
              }
              if (this.pointDragged.id.shapeType == "Circle") {
                this.currentsPoint = [];
                for (let i = 0; i < this.ellipsePreviousCoordinates.length; i++) {
                  //与之前的算差 替换掉
                  this.ellipsePreviousCoordinates[i].x += changed_x;
                  this.ellipsePreviousCoordinates[i].y += changed_y;
                  this.ellipsePreviousCoordinates[i].z += changed_z;
                  this.currentsPoint.push(this.ellipsePreviousCoordinates[i]);
                }
                this.saveCircleCurrentsPoint = this.currentsPoint;

                // 给边框的坐标赋值
                // this.savePolylineCurrentsPoint = this.plot.plotTracker.circleDrawer._computeCirclePolygon(this.saveCircleCurrentsPoint);
                // 给边框的坐标赋值
                let outlinePositions: any = [].concat(this.currentsPoint);
                outlinePositions.push(this.currentsPoint[0]); // 将第一个点添加到边框坐标中，让边框闭合
                this.savePolylineCurrentsPoint = outlinePositions;

                this.plot.draw.shapeDic[this.objId] = CesiumMethod._computeCirclePolygon(this.savePolylineCurrentsPoint);
              }
            }
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // TODO 右键取消移动，图形返回原来的位置
    // this.moveHandler.setInputAction((movement: any) => {
    //   this.moveHandler.destroy();
    //   this.viewer.scene.screenSpaceCameraController.enableRotate = true; //解锁相机
    // }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    return new Promise((resolve, reject) => {
      const timeId = setInterval(() => {
        if (isClickConfirm) {
          clearInterval(timeId);
          let entity: any = null;
          if (currentEntityId && currentEntityId.length > 0) {
            entity = this.viewer.entities.getById(currentEntityId);
            resolve(entity);
          } else {
            reject();
          }
        }
      }, 100);
    });
  }

  clickPolygon(pointDragged: any) {
    this.polygonPreviousCoordinates = pointDragged.id.polygon.hierarchy.getValue();
    // 获取图形坐标
    this.savePolygonCurrentsPoint = pointDragged.id.polygon.hierarchy.getValue().positions;
    // 点击图形进入移动状态，动态改变图形坐标
    pointDragged.id.polygon.hierarchy = new Cesium.CallbackProperty((time: any, result: any) => {
      return new Cesium.PolygonHierarchy(this.savePolygonCurrentsPoint);
    }, false);

    this.polylinePreviousCoordinates = pointDragged.id.polyline.positions.getValue();
    this.savePolylineCurrentsPoint = pointDragged.id.polyline.positions.getValue();
    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.savePolylineCurrentsPoint;
    }, false);
  }

  clickPolyline(pointDragged: any) {
    this.polylinePreviousCoordinates = pointDragged.id.polyline.positions.getValue();
    this.savePolylineCurrentsPoint = pointDragged.id.polyline.positions.getValue();

    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.savePolylineCurrentsPoint;
    }, false);
  }

  clickRectangle(pointDragged: any) {
    this.rectanglePreviousCoordinates = pointDragged.id.rectangle.coordinates.getValue();
    this.rectanglePosition = pointDragged.id.rectanglePosition;
    this.saveRectangleCurrentsPoint = pointDragged.id.rectangle.coordinates.getValue();

    pointDragged.id.rectangle.coordinates = new Cesium.CallbackProperty(() => {
      return this.saveRectangleCurrentsPoint;
    }, false);

    this.polylinePreviousCoordinates = pointDragged.id.polyline.positions.getValue();
    this.savePolylineCurrentsPoint = pointDragged.id.polyline.positions.getValue();
    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.savePolylineCurrentsPoint;
    }, false);
  }

  clickCircle(pointDragged: any) {
    this.ellipsePreviousCoordinates = pointDragged.id.circlePosition;
    this.saveCircleCurrentsPoint = pointDragged.id.circlePosition;

    pointDragged.id.position = new Cesium.CallbackProperty(() => {
      return this.saveCircleCurrentsPoint[0];
    }, false);

    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return CesiumMethod._computeCirclePolygon(this.savePolylineCurrentsPoint);
    }, false);
    // this.polylinePreviousCoordinates = this.circleOutlineEntity.polyline.positions.getValue();
    // this.savePolylineCurrentsPoint = this.circleOutlineEntity.polyline.positions.getValue();
    // this.circleOutlineEntity.polyline.positions = new Cesium.CallbackProperty(() => {
    //   return this.savePolylineCurrentsPoint;
    // }, false);
  }

  clickPoint(pointDragged: any) {
    this.pointPreviousCoordinates = pointDragged.id.position.getValue(new Cesium.JulianDate());
    this.savePointCurrentsPoint = pointDragged.id.position.getValue(new Cesium.JulianDate());
    pointDragged.id.position = new Cesium.CallbackProperty(() => {
      return this.savePointCurrentsPoint;
    }, false);
  }

  clickBufferLine(pointDragged: any) {
    this.bufferLinePreviousCoordinates = pointDragged.id.polyline.positions.getValue();
    this.saveBufferLineCurrentsPoint = pointDragged.id.polyline.positions.getValue();

    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.saveBufferLineCurrentsPoint;
    }, false);

  }

  clickStraightArrow(pointDragged: any) {
    this.straightArrowCoordinates = pointDragged.id.polygon.hierarchy.getValue();
    this.saveStraightArrowCurrentsPoint = pointDragged.id.polygon.hierarchy.getValue().positions;

    pointDragged.id.polygon.hierarchy = new Cesium.CallbackProperty(() => {
      return new Cesium.PolygonHierarchy(this.saveStraightArrowCurrentsPoint);
    }, false);
    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.saveStraightArrowCurrentsPoint;
    }, false);
  }

  clickAttackArrow(pointDragged: any) {
    this.attackArrowCoordinates = pointDragged.id.polygon.hierarchy.getValue();
    this.attackPoints = this.plot.draw.shapeDic[this.objId].custom;
    for (let i = 0; i < this.attackPoints.length; i++) {
      this.attackPointsCart.push(Cesium.Cartesian3.fromDegrees(this.attackPoints[i][0], this.attackPoints[i][1]));
    }
    this.saveAttackArrowCurrentsPoint = pointDragged.id.polygon.hierarchy.getValue().positions;

    pointDragged.id.polygon.hierarchy = new Cesium.CallbackProperty(() => {
      return new Cesium.PolygonHierarchy(this.saveAttackArrowCurrentsPoint);
    }, false);
    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.saveAttackArrowCurrentsPoint;
    }, false);
  }

  clickPincerArrow(pointDragged: any) {
    this.pincerArrowCoordinates = pointDragged.id.polygon.hierarchy.getValue();
    this.pincerPoints = this.plot.draw.shapeDic[this.objId].custom;
    for (let i = 0; i < this.pincerPoints.length; i++) {
      this.pincerPointsCart.push(Cesium.Cartesian3.fromDegrees(this.pincerPoints[i][0], this.pincerPoints[i][1]));
    }
    this.savePincerArrowCurrentsPoint = pointDragged.id.polygon.hierarchy.getValue().positions;

    pointDragged.id.polygon.hierarchy = new Cesium.CallbackProperty(() => {
      return new Cesium.PolygonHierarchy(this.savePincerArrowCurrentsPoint);
    }, false);
    pointDragged.id.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.savePincerArrowCurrentsPoint;
    }, false);
  }

  confirmClick() {
    this.viewer.scene.screenSpaceCameraController.enableRotate = true; //解锁相机
    // console.log(("解锁相机"));
    if (!this.pointDragged) {
      return;
    }
    if (!this.obj) {
      return;
    }
    switch (this.obj.shapeType) {
      case "Point":
        this.obj.position = this.savePointCurrentsPoint;
        break;
      case "Polygon":
        this.obj.polygon.hierarchy = this.savePolygonCurrentsPoint;
        this.obj.polyline.positions = this.savePolylineCurrentsPoint;
        break;
      case "Polyline":
        this.obj.polyline.positions = this.savePolylineCurrentsPoint;
        break;
      case "Rectangle":
        this.obj.rectangle.coordinates = this.saveRectangleCurrentsPoint;
        this.obj.polyline.positions = this.savePolylineCurrentsPoint;
        break;
      case "Circle":
        this.obj.position = this.saveCircleCurrentsPoint[0];
        // this.circleOutlineEntity.polyline.positions = this.savePolylineCurrentsPoint;
        this.obj.polyline.positions = CesiumMethod._computeCirclePolygon(this.savePolylineCurrentsPoint);
        break;
      case "BufferLine":
        this.obj.polyline.positions = this.saveBufferLineCurrentsPoint;
        break;
      case "StraightArrow":
        this.obj.polygon.hierarchy = new Cesium.PolygonHierarchy(this.saveStraightArrowCurrentsPoint);
        this.obj.polyline.positions = this.saveStraightArrowCurrentsPoint;
        break;
      case "AttackArrow":
        this.obj.polygon.hierarchy = new Cesium.PolygonHierarchy(this.saveAttackArrowCurrentsPoint);
        this.obj.polyline.positions = this.saveAttackArrowCurrentsPoint;
        break;
      case "PincerArrow":
        this.obj.polygon.hierarchy = new Cesium.PolygonHierarchy(this.savePincerArrowCurrentsPoint);
        this.obj.polyline.positions = this.savePincerArrowCurrentsPoint;
        break;
      default:
        break;
    }
    this.currentsPoint = undefined;
    this.pointDragged = undefined;
    this.obj = undefined;

    this.savePolygonCurrentsPoint = undefined;
    this.savePolylineCurrentsPoint = [];
    this.saveRectangleCurrentsPoint = [];
    this.saveCircleCurrentsPoint = [];
    this.saveBufferLineCurrentsPoint = [];
    this.saveStraightArrowCurrentsPoint = [];
    this.saveAttackArrowCurrentsPoint = [];
    this.savePincerArrowCurrentsPoint = [];

    this.polygonPreviousCoordinates = undefined;

    this.circleOutlineEntity = null;
    this.clear();
  }

  getEntityByObjId(objId: any) {
    let entityList = this.viewer.entities.values;
    if (entityList == null || entityList.length < 1) {
      return;
    }
    for (let i = 0; i < entityList.length; i++) {
      let entity = entityList[i];
      if (entity.layerId == this.plot.draw.layerId && entity.objId == objId && entity.shapeType == "CircleOutline") {
        return entity;
      }
    }
  }
}

export default PlotMoveDrawer;

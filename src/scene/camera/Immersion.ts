import * as Cesium from "cesium";
import * as events from "events";
// @ts-ignore
const Knockout = Cesium.knockout;

class Immersion {

  /**
   * viewer
   * @type {null}
   */
  viewer: any = null;
  scene: any = null;
  canvas: HTMLCanvasElement;
  viewModel = {
    enabled: false,
    firstPersonPerspective: false
  };
  handler: any;
  clockEvent: Function | undefined;

  constructor(viewer: any) {
    if (!viewer) {
      throw Error("viewer can not be null");
    }
    this.viewer = viewer;
    this.scene = viewer.scene;
    this.canvas = viewer.canvas as HTMLCanvasElement;
    this.bindModel();
    if (this.viewModel.enabled) {
      this.enable();
    }
  }

  disEnable() {
    let scene = this.scene;
    let canvas = this.canvas;
    scene.screenSpaceCameraController.enableRotate = true;
    scene.screenSpaceCameraController.enableTranslate = true;
    scene.screenSpaceCameraController.enableZoom = true;
    scene.screenSpaceCameraController.enableTilt = true;
    scene.screenSpaceCameraController.enableLook = true;
    if (this.handler) {
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    }
    this.viewer.clock.onTick.removeEventListener(this.clockEvent);
  }

  enable() {
    let _this = this;
    let scene = this.scene;
    let canvas = this.canvas;
    canvas.setAttribute("tabindex", "0"); // needed to put focus on the canvas
    canvas.onclick = function() {
      canvas.focus();
    };
    let ellipsoid = scene.globe.ellipsoid;

    if (this.viewModel.firstPersonPerspective) {
      // 禁用默认事件
      scene.screenSpaceCameraController.enableRotate = false;
      scene.screenSpaceCameraController.enableTranslate = false;
      scene.screenSpaceCameraController.enableZoom = false;
      scene.screenSpaceCameraController.enableTilt = false;
      scene.screenSpaceCameraController.enableLook = false;
    }

    let startMousePosition: any;
    let mousePosition: any;
    let flags = {
      looking: false,
      moveForward: false,
      moveBackward: false,
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false
    };

    this.handler = new Cesium.ScreenSpaceEventHandler(canvas);

    this.handler.setInputAction(function(movement: any) {
      flags.looking = true;
      mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    this.handler.setInputAction(function(movement: any) {
      mousePosition = movement.endPosition;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler.setInputAction(function(position: any) {
      flags.looking = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    function getFlagForKeyCode(keyCode: any) {
      switch (keyCode) {
        case "W".charCodeAt(0):
          return "moveForward";
        case "S".charCodeAt(0):
          return "moveBackward";
        case "Q".charCodeAt(0):
          return "moveUp";
        case "E".charCodeAt(0):
          return "moveDown";
        case "D".charCodeAt(0):
          return "moveRight";
        case "A".charCodeAt(0):
          return "moveLeft";
        default:
          return undefined;
      }
    }

    document.addEventListener("keydown", function(e) {
      let flagName = getFlagForKeyCode(e.keyCode);
      if (typeof flagName !== "undefined") {
        // @ts-ignore
        flags[flagName] = true;
      }
    }, false);

    document.addEventListener("keyup", function(e) {
      let flagName = getFlagForKeyCode(e.keyCode);
      if (typeof flagName !== "undefined") {
        // @ts-ignore
        flags[flagName] = false;
      }
    }, false);

    this.clockEvent = function clockEvent(clock: any) {
      let camera = _this.viewer.camera;

      if (_this.viewModel.firstPersonPerspective && flags.looking) {
        let width = canvas.clientWidth;
        let height = canvas.clientHeight;

        // 坐标(0.0,0.0)将是点击鼠标的位置。
        let x = (mousePosition.x - startMousePosition.x) / width;
        let y = -(mousePosition.y - startMousePosition.y) / height;

        let lookFactor = 0.05;
        camera.lookRight(x * lookFactor);
        camera.lookUp(y * lookFactor);
      }

      // 根据相机到椭球表面的距离来改变移动速度。
      let cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
      let moveRate = cameraHeight / 100.0;

      if (flags.moveForward) {
        camera.moveForward(moveRate);
      }
      if (flags.moveBackward) {
        camera.moveBackward(moveRate);
      }
      if (flags.moveUp) {
        camera.moveUp(moveRate);
      }
      if (flags.moveDown) {
        camera.moveDown(moveRate);
      }
      if (flags.moveLeft) {
        camera.moveLeft(moveRate);
      }
      if (flags.moveRight) {
        camera.moveRight(moveRate);
      }
    };

    this.viewer.clock.onTick.addEventListener(this.clockEvent);
  }

  /**
   * 属性绑定
   */
  bindModel() {
    let _this = this;
    Knockout.track(_this.viewModel);
    Knockout.getObservable(_this.viewModel, "enabled").subscribe((enabled: boolean) => {
        if (enabled) {
          this.enable();
        } else {
          this.disEnable();
        }
      }
    );
    Knockout.getObservable(_this.viewModel, "firstPersonPerspective").subscribe((enabled: boolean) => {
        if (enabled) {
          _this.disEnable();
          if (!_this.viewModel.enabled) {
            _this.viewModel.enabled = enabled;
          } else {
            _this.enable();
          }
        } else {
          let scene = this.scene;
          scene.screenSpaceCameraController.enableRotate = true;
          scene.screenSpaceCameraController.enableTranslate = true;
          scene.screenSpaceCameraController.enableZoom = true;
          scene.screenSpaceCameraController.enableTilt = true;
          scene.screenSpaceCameraController.enableLook = true;
          if (this.handler) {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
          }
        }
      }
    );
  }
}
export default Immersion;

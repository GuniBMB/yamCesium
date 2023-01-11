/**
 * 圆扩散
 */
import * as Cesium from "cesium";

interface circleSpreadOptions {
  viewer: Cesium.Viewer;
  center: Cesium.Cartesian3;
  color: Cesium.Color;
  radius: number;
  duration: number;
}

class CircleSpread {

  viewer: Cesium.Viewer;

  /**
   * 生成动态圆
   * @param options 参数
   * @param options.viewer viewer
   * @param options.center 中心点
   * @param options.color 颜色
   * @param options.radius 半径
   * @param options.duration 持续时间
   */
  constructor(options: circleSpreadOptions) {
    this.viewer = options.viewer;
    this.addCircleScan(options);
  }

  /**
   * 生成动态圆
   * @param options
   */
  addCircleScan(options: circleSpreadOptions) {
    let _this = this;
    let viewer = options.viewer;
    let _Cartesian3Center = options.center;
    let _Cartesian4Center = new Cesium.Cartesian4(
      _Cartesian3Center.x,
      _Cartesian3Center.y,
      _Cartesian3Center.z,
      1
    );
    let _CartograhpicCenter1 = Cesium.Cartographic.fromCartesian(options.center);
    _CartograhpicCenter1.height += 1;

    let _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartograhpicCenter1);
    let _Cartesian4Center1 = new Cesium.Cartesian4(
      _Cartesian3Center1.x,
      _Cartesian3Center1.y,
      _Cartesian3Center1.z,
      1
    );

    let _time = new Date().getTime();

    let _scratchCartesian4Center = new Cesium.Cartesian4();
    let _scratchCartesian4Center1 = new Cesium.Cartesian4();
    let _scratchCartesian3Normal = new Cesium.Cartesian3();

    let ScanPostStage = new Cesium.PostProcessStage({
      fragmentShader: _this.shader(),
      uniforms: {
        u_scanCenterEC() {
          return Cesium.Matrix4.multiplyByVector(
            viewer.camera.viewMatrix,
            _Cartesian4Center,
            _scratchCartesian4Center
          );
        },
        u_scanPlaneNormalEC() {
          let temp = Cesium.Matrix4.multiplyByVector(
            viewer.camera.viewMatrix,
            _Cartesian4Center,
            _scratchCartesian4Center
          );
          let temp1 = Cesium.Matrix4.multiplyByVector(
            viewer.camera.viewMatrix,
            _Cartesian4Center1,
            _scratchCartesian4Center1
          );

          _scratchCartesian3Normal.x = temp1.x - temp.x;
          _scratchCartesian3Normal.y = temp1.y - temp.y;
          _scratchCartesian3Normal.z = temp1.z - temp.z;

          Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);

          return _scratchCartesian3Normal;
        },
        u_radius() {
          return options.radius * ((new Date().getTime() - _time) % options.duration) / options.duration;
        },
        u_scanColor: options.color
      }
    });

    viewer.scene.postProcessStages.add(ScanPostStage);
    return ScanPostStage;
  }

  shader() {
    return "\n\
                uniform sampler2D colorTexture;\n\
                uniform sampler2D depthTexture;\n\
                varying vec2 v_textureCoordinates;\n\
                uniform vec4 u_scanCenterEC;\n\
                uniform vec3 u_scanPlaneNormalEC;\n\
                uniform float u_radius;\n\
                uniform vec4 u_scanColor;\n\
                \n\
                vec4 toEye(in vec2 uv,in float depth)\n\
                {\n\
                            vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n\
                            vec4 posIncamera = czm_inverseProjection * vec4(xy,depth,1.0);\n\
                            posIncamera = posIncamera/posIncamera.w;\n\
                            return posIncamera;\n\
                }\n\
                \n\
                vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point)\n\
                {\n\
                            vec3 v01 = point - planeOrigin;\n\
                            float d = dot(planeNormal,v01);\n\
                            return (point-planeNormal * d);\n\
                }\n\
                float getDepth(in vec4 depth)\n\
                {\n\
                            float z_window = czm_unpackDepth(depth);\n\
                            z_window = czm_reverseLogDepth(z_window);\n\
                            float n_range = czm_depthRange.near;\n\
                            float f_range = czm_depthRange.far;\n\
                            return (2.0 * z_window - n_range - f_range)/(f_range-n_range);\n\
                } \n\
                void main()\n\
                {\n\
                            gl_FragColor = texture2D(colorTexture,v_textureCoordinates);\n\
                            float depth = getDepth(texture2D(depthTexture,v_textureCoordinates));\n\
                            vec4 viewPos = toEye(v_textureCoordinates,depth);\n\
                            vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz,u_scanCenterEC.xyz,viewPos.xyz);\n\
                            float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n\
                            if(dis<u_radius)\n\
                            {\n\
                                float f = 1.0-abs(u_radius - dis )/ u_radius;\n\
                                f = pow(f,4.0);\n\
                                gl_FragColor = mix(gl_FragColor,u_scanColor,f);\n\
                            }\n\
                } \n ";
  }
}

export default CircleSpread;

# 简介
封装各种Cesium组件

# 功能点
1. Cesium 地图插件，用于添加国内各大地图厂商的地图。该功能基于[cesium-map](https://github.com/dvgis/cesium-map)插件进行封装。
2. Cesium navigation插件，用于添加地图导航控件。该功能基于[cesium-navigation-umd](https://github.com/worlddai/cesium-navigation-umd)插件进行封装。
3. 截屏，保存场景图片。注：必须设置preserveDrawingBuffer: true
4. 测量 TODO
5. 点聚合 TODO
6. 图形绘制 TODO
7. 图层管理 TODO
8. 3dtiles模型 TODO
9. popup TODO
10. 第一人称视角
11. 鹰眼图
12. 雷达扫描 TODO
13. 热力图 TODO
14. geojson TODO
15. 水面 TODO
16. 坐标转换
17. dat.gui TODO
18. turf TODO
19. proj4js TODO
20. 汉化 TODO
21. Geocoder TODO
22. 引入CesiumMethod和PublicMethod TODO
# 如何使用

```shell
npm run build
```
会在dist目录下生成一个gy.cesium.min.js文件，引入即可

必须在Cesium.js之后引入

# 更新日志

**2020-10-14**

初始化项目
添加图层加载

**2020-10-15**

添加指北针组件

**2020-10-17**

添加截屏

添加第一人称视角

**2022-10-18**

添加鹰眼图

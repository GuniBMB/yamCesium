/**
 * @_v 引入外部创建的Viewer实例(new Cesium.Viewer(...))
 * @myPrimitives 原语集合，可以包含页面显示的pointPrimitiveCollection、billboardCollection、labelCollection、primitiveCollection、primitiveCluster
 * @myPrimitiveCluster 自定义原语集群
 * @myBillboardCollection 广告牌集合(站点显示的内容数据)
 *
 * @desc 使用primitiveCollection原语集合与primitiveCluster原语集群，处理地图界面显示广告牌billboard数量 > 10w 级时，界面卡顿，浏览器崩溃等问题
 */
import * as Cesium from "cesium";

export default class Cluster {
    _v: any = null;
    myPrimitives: any = null;
    _myPrimitiveCluster: any = null;
    myBillboardCollection: any = null;

    set myPrimitiveCluster(myPrimitiveCluster: any) {
        this._myPrimitiveCluster = myPrimitiveCluster;
    }

    constructor(viewer: any) {
      this._v = viewer;
    }

    /**
     * @param {Object} options 具有以下属性的对象
     * @param {Number} options.delay=800 防抖处理定时器的time
     * @param {Boolean} options.enabled=true 是否启用集群
     * @param {Number} options.pixelRange=15 用于扩展屏幕空间包围框的像素范围
     * @param {Number} options.minimumClusterSize=2 可集群的屏幕空间对象的最小数量
     * @param {Function} options.customStyle 自定义样式
     * @desc 处理原语集合，并实现聚合集群功能方法
     * @return {billboardCollection} 集合，可直接往集合里添加广告牌billboard，呈现在页面上
     */
    load(options: any = {}) {
        let billboardCollection = new Cesium.BillboardCollection({
            scene: this._v.scene,
        });

        if (Cesium.defined(this.myPrimitives)) {
            // this._v.scene.primitives.remove(this.myPrimitives);
        }
        this.myPrimitives = this._v.scene.primitives.add(
            new Cesium.PrimitiveCollection()
        );

        // @ts-ignore
      const primitiveCluster = new Cesium.PrimitiveCluster();
        this.myPrimitives.add(primitiveCluster);
        primitiveCluster.delay = Cesium.defaultValue(options.delay, 800);
        primitiveCluster.enabled = Cesium.defaultValue(options.enabled, true);
        primitiveCluster.pixelRange = Cesium.defaultValue(options.pixelRange, 15);
        primitiveCluster.minimumClusterSize = Cesium.defaultValue(
            options.minimumClusterSize,
            2
        );
        primitiveCluster._billboardCollection = billboardCollection;
        primitiveCluster._initialize(this._v.scene);

        let removeListener: (() => void) | undefined;
        let pinBuilder = new Cesium.PinBuilder();
        /* 定义广告牌 fromText（显示文字，颜色，大小） */
        let pin50 = pinBuilder.fromText("50+", Cesium.Color.RED, 40).toDataURL();
        let pin40 = pinBuilder.fromText("40+", Cesium.Color.ORANGE, 40).toDataURL();
        let pin30 = pinBuilder.fromText("30+", Cesium.Color.YELLOW, 40).toDataURL();
        let pin20 = pinBuilder.fromText("20+", Cesium.Color.GREEN, 40).toDataURL();
        let pin10 = pinBuilder.fromText("10+", Cesium.Color.BLUE, 40).toDataURL();
        /* 数量小于十个的聚合广告牌 */
        let singleDigitPins = new Array(8);
        for (let i = 0; i < singleDigitPins.length; ++i) {
            singleDigitPins[i] = pinBuilder
                .fromText("" + (i + 2), Cesium.Color.VIOLET, 40)
                .toDataURL();
        }

        const _ = this;

        function customStyle() {
            if (Cesium.defined(removeListener)) {
              if (removeListener) {
                removeListener();
              }
                removeListener = undefined;
            } else {
                removeListener = primitiveCluster.clusterEvent.addEventListener(
                    function (clusteredEntities: string | any[], cluster: any) {
                        cluster.label.show = false;
                        cluster.billboard.show = true;
                        cluster.billboard.id = cluster.label.id;
                        cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                        /* 根据站点(参数)的数量给予对应的广告牌  */
                        if (clusteredEntities.length >= 50) {
                            cluster.billboard.image = pin50;
                        } else if (clusteredEntities.length >= 40) {
                            cluster.billboard.image = pin40;
                        } else if (clusteredEntities.length >= 30) {
                            cluster.billboard.image = pin30;
                        } else if (clusteredEntities.length >= 20) {
                            cluster.billboard.image = pin20;
                        } else if (clusteredEntities.length >= 10) {
                            cluster.billboard.image = pin10;
                        } else {
                            cluster.billboard.image =
                                singleDigitPins[clusteredEntities.length - 2];
                        }
                    }
                );
            }
            // force a re-cluster with the new styling
            let pixelRange = primitiveCluster.pixelRange;
            primitiveCluster.pixelRange = 0;
            primitiveCluster.pixelRange = pixelRange;
            _.myPrimitiveCluster = primitiveCluster;
        }
        this.myBillboardCollection = billboardCollection;
        // start with custom style
        options.customStyle ? options.customStyle(_, removeListener, primitiveCluster) : customStyle();
        // customStyle();
        return {
          billboard: billboardCollection,
          primitive: this.myPrimitives
        };
    }

    /**
     * @params enable bool值控制开启或关闭集群
     * @desc 控制集群生效与否
     */
    enableCluster(enable: boolean) {
        if (Cesium.defined(this.myPrimitiveCluster)) {
            this.myPrimitiveCluster.enabled = enable;
        }
    }

    /**
     * @params id 站点ID
     * @return 返回可操作的广告牌[siteBillboard.image = 'xxxx']
     * @desc 根据id在集合中获取指定站点广告牌
     */
    getSiteBillboardById(id: any) {
        if (!Cesium.defined(this.myBillboardCollection)) return undefined;
        const _b = this.myBillboardCollection;
        const l = _b.length;
        let siteBillboard = undefined;
        for (let i = 0; i < l; i++) {
            if (id == _b.get(i).id) {
                siteBillboard = _b.get(i);
                break;
            }
        }
        return siteBillboard;
    }

    /**
     * @desc 删除所有站点广告牌
     */
    removeAll() {
        if (Cesium.defined(this.myPrimitives)) {
            this._v.scene.primitives.remove(this.myPrimitives);
        }
    }

    /**
     * @params show bool值 控制显示或隐藏
     * @desc 隐藏或显示所有站点广告牌
     */
    showStatus(show = true) {
        this.myPrimitives.show = show;
    }

    /**
     * @desc 根据id删除指定站点广告牌
     */
    remove(id: any) {
        const billboard = this.getSiteBillboardById(id);
        billboard && this.myBillboardCollection.remove(billboard);
    }

    /**
     * @desc 销毁(目前退出页面时直接viewer销毁)
     */
    destroy() {
        this.myPrimitives = null;
        this.myPrimitiveCluster = null;
        this.myBillboardCollection = null;
        // this._v.scene.primitives.destroy()
    }
}

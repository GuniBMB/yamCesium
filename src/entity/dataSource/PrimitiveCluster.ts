import * as Cesium from "cesium";
import KDBush from 'kdbush'
/**
 * Defines how screen space objects (billboards, points, labels) are clustered.
 *
 * @param {Object} [options] An object with the following properties:
 * @param {Boolean} [options.enabled=false] Whether or not to enable clustering.
 * @param {Number} [options.pixelRange=80] The pixel range to extend the screen space bounding box.
 * @param {Number} [options.minimumClusterSize=2] The minimum number of screen space objects that can be clustered.
 * @param {Boolean} [options.clusterBillboards=true] Whether or not to cluster the billboards of an entity.
 * @param {Boolean} [options.clusterLabels=true] Whether or not to cluster the labels of an entity.
 * @param {Boolean} [options.clusterPoints=true] Whether or not to cluster the points of an entity.
 * @param {Boolean} [options.show=true] Determines if the entities in the cluster will be shown.
 *
 * @alias PrimitiveCluster
 * @constructor
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Clustering.html|Cesium Sandcastle Clustering Demo}
 */
interface primitiveCluster {
  enabled?: boolean;
  pixelRange?: number;
  minimumClusterSize?: number;
  clusterBillboards?: boolean;
  clusterLabels?: boolean;
  clusterPoints?: boolean;
  show?: boolean;
  delay?: number;
}

/**
 * @class PrimitiveCluster
 */
class PrimitiveCluster {

  _enabled = false;
  _pixelRange = 80;
  _minimumClusterSize = 2;
  _clusterBillboards = true;
  _clusterLabels: true;
  _clusterPoints: true;
  _labelCollection: any;
  _billboardCollection: any;
  _pointCollection: any;
  _clusterBillboardCollection: any;
  _clusterLabelCollection: any;
  _clusterPointCollection: any;
  _collectionIndicesByEntity: any;
  _unusedLabelIndices: any;
  _unusedBillboardIndices: any;
  _unusedPointIndices: any;
  _previousClusters: any;
  _previousHeight: any;
  _enabledDirty: any;
  _clusterDirty: any;
  _cluster: any;
  _removeEventListener: any;
  _clusterEvent: any;
  show: boolean;
  _delay: number;
  _scene: any;
  _pixelRangeDirty: boolean | undefined;
  _minimumClusterSizeDirty: boolean | undefined;

  constructor(options?: primitiveCluster) {
    // @ts-ignore
    options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);

    this._enabled = Cesium.defaultValue(options?.enabled, false);
    this._pixelRange = Cesium.defaultValue(options?.pixelRange, 80);
    this._minimumClusterSize = Cesium.defaultValue(options?.minimumClusterSize, 2);
    this._clusterBillboards = Cesium.defaultValue(options?.clusterBillboards, true);
    this._clusterLabels = Cesium.defaultValue(options?.clusterLabels, true);
    this._clusterPoints = Cesium.defaultValue(options?.clusterPoints, true);

    this._labelCollection = undefined;
    this._billboardCollection = undefined;
    this._pointCollection = undefined;

    this._clusterBillboardCollection = undefined;
    this._clusterLabelCollection = undefined;
    this._clusterPointCollection = undefined;

    this._collectionIndicesByEntity = {};

    this._unusedLabelIndices = [];
    this._unusedBillboardIndices = [];
    this._unusedPointIndices = [];

    this._previousClusters = [];
    this._previousHeight = undefined;

    this._enabledDirty = false;
    this._clusterDirty = false;

    this._cluster = undefined;
    this._removeEventListener = undefined;

    this._clusterEvent = new Cesium.Event();

    /**
     * Determines if entities in this collection will be shown.
     *
     * @type {Boolean}
     * @default true
     */
    this.show = Cesium.defaultValue(options?.show, true);

    //1.PrimitiveCluster构造函数中添加_delay参数
    this._delay = Cesium.defaultValue(options?.delay, 800);
  }

  /**
   * Gets or sets whether clustering is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value) {
    this._enabledDirty = value !== this._enabled;
    this._enabled = value;
  }

  /**
   * Gets or sets the pixel range to extend the screen space bounding box.
   * @memberof PrimitiveCluster.prototype
   * @type {Number}
   */
  get pixelRange(): number {
    return this._pixelRange;
  }

  set pixelRange(value) {
    this._clusterDirty = this._clusterDirty || value !== this._pixelRange;
    this._pixelRange = value;
  }

  /**
   * Gets or sets the minimum number of screen space objects that can be clustered.
   * @memberof PrimitiveCluster.prototype
   * @type {Number}
   */
  get minimumClusterSize(): number {
    return this._minimumClusterSize;
  }

  set minimumClusterSize(value) {
    this._clusterDirty =
      this._clusterDirty || value !== this._minimumClusterSize;
    this._minimumClusterSize = value;
  }

  /**
   * Gets the event that will be raised when a new cluster will be displayed. The signature of the event listener is {@link PrimitiveCluster.newClusterCallback}.
   * @memberof PrimitiveCluster.prototype
   * @type {Cesium.Event<PrimitiveCluster.newClusterCallback>}
   */
  get clusterEvent(): any {
    return this._clusterEvent;
  }

  /**
   * Gets or sets whether clustering billboard entities is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  get clusterBillboards(): any {
    return this._clusterBillboards;
  }

  set clusterBillboards(value) {
    this._clusterDirty =
      this._clusterDirty || value !== this._clusterBillboards;
    this._clusterBillboards = value;
  }

  /**
   * Gets or sets whether clustering labels entities is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  get clusterLabels(): any {
    return this._clusterLabels;
  }

  set clusterLabels(value) {
    this._clusterDirty = this._clusterDirty || value !== this._clusterLabels;
    this._clusterLabels = value;
  }

  /**
   * Gets or sets whether clustering point entities is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  get clusterPoints(): any {
    return this._clusterPoints;
  }

  set clusterPoints(value) {
    this._clusterDirty = this._clusterDirty || value !== this._clusterPoints;
    this._clusterPoints = value;
  }

  //2.在PrimitiveCluster.prototype拦截器Object.defineProperties方法中添加_delay的访问以及设置方法
  get delay(): number {
    return this._delay;
  }

  set delay(value) {
    this._delay = value;

  }

  _initialize(scene: any) {
    this._scene = scene;

    const cluster = createDeclutterCallback(this);
    this._cluster = cluster;
    // 3._initialize方法改造
    var _t: any = null;
    const _self = this;
    this._removeEventListener = scene.camera.changed.addEventListener(function(amount: any) {
      if (_t) {
        clearTimeout(_t);
        _t = null;
      }
      _t = setTimeout(() => {
        cluster(amount);
      }, _self._delay);
    });
    // this._removeEventListener = scene.camera.changed.addEventListener(cluster);
  }

  /**
   * Removes the {@link Cesium.Label} associated with an entity so it can be reused by another entity.
   * @param {Entity} entity The entity that will uses the returned {@link Cesium.Label} for visualization.
   *
   * @private
   */
  removeLabel(entity: any) {
    const entityIndices = this._collectionIndicesByEntity &&
      this._collectionIndicesByEntity[entity.id];
    if (!Cesium.defined(this._labelCollection) ||
      !Cesium.defined(entityIndices) ||
      !Cesium.defined(entityIndices.labelIndex)) {
      return;
    }

    const index = entityIndices.labelIndex;
    entityIndices.labelIndex = undefined;
    removeEntityIndicesIfUnused(this, entity.id);

    const label = this._labelCollection.get(index);
    label.show = false;
    label.text = "";
    label.id = undefined;

    this._unusedLabelIndices.push(index);

    this._clusterDirty = true;
  }

  /**
   * Removes the {@link Cesium.Billboard} associated with an entity so it can be reused by another entity.
   * @param {Entity} entity The entity that will uses the returned {@link Cesium.Billboard} for visualization.
   *
   * @private
   */
  removeBillboard(entity: any) {
    const entityIndices = this._collectionIndicesByEntity &&
      this._collectionIndicesByEntity[entity.id];
    if (!Cesium.defined(this._billboardCollection) ||
      !Cesium.defined(entityIndices) ||
      !Cesium.defined(entityIndices.billboardIndex)) {
      return;
    }

    const index = entityIndices.billboardIndex;
    entityIndices.billboardIndex = undefined;
    removeEntityIndicesIfUnused(this, entity.id);

    const billboard = this._billboardCollection.get(index);
    billboard.id = undefined;
    billboard.show = false;
    billboard.image = undefined;

    this._unusedBillboardIndices.push(index);

    this._clusterDirty = true;
  }

  /**
   * Removes the {@link Point} associated with an entity so it can be reused by another entity.
   * @param {Entity} entity The entity that will uses the returned {@link Point} for visualization.
   *
   * @private
   */
  removePoint(entity: any) {
    const entityIndices = this._collectionIndicesByEntity &&
      this._collectionIndicesByEntity[entity.id];
    if (!Cesium.defined(this._pointCollection) ||
      !Cesium.defined(entityIndices) ||
      !Cesium.defined(entityIndices.pointIndex)) {
      return;
    }

    const index = entityIndices.pointIndex;
    entityIndices.pointIndex = undefined;
    removeEntityIndicesIfUnused(this, entity.id);

    const point = this._pointCollection.get(index);
    point.show = false;
    point.id = undefined;

    this._unusedPointIndices.push(index);

    this._clusterDirty = true;
  }

  /**
   * Gets the draw commands for the clustered billboards/points/labels if enabled, otherwise,
   * queues the draw commands for billboards/points/labels created for entities.
   * @private
   */
  update(frameState: any) {
    if (!this.show) {
      return;
    }

    // If clustering is enabled before the label collection is updated,
    // the glyphs haven't been created so the screen space bounding boxes
    // are incorrect.
    let commandList;
    if (Cesium.defined(this._labelCollection) &&
      this._labelCollection.length > 0 &&
      this._labelCollection.get(0)._glyphs.length === 0) {
      commandList = frameState.commandList;
      frameState.commandList = [];
      this._labelCollection.update(frameState);
      frameState.commandList = commandList;
    }

    // If clustering is enabled before the billboard collection is updated,
    // the images haven't been added to the image atlas so the screen space bounding boxes
    // are incorrect.
    if (Cesium.defined(this._billboardCollection) &&
      this._billboardCollection.length > 0 &&
      !Cesium.defined(this._billboardCollection.get(0).width)) {
      commandList = frameState.commandList;
      frameState.commandList = [];
      this._billboardCollection.update(frameState);
      frameState.commandList = commandList;
    }

    if (this._enabledDirty) {
      this._enabledDirty = false;
      updateEnable(this);
      this._clusterDirty = true;
    }

    if (this._clusterDirty) {
      this._clusterDirty = false;
      this._cluster();
    }

    if (Cesium.defined(this._clusterLabelCollection)) {
      this._clusterLabelCollection.update(frameState);
    }
    if (Cesium.defined(this._clusterBillboardCollection)) {
      this._clusterBillboardCollection.update(frameState);
    }
    if (Cesium.defined(this._clusterPointCollection)) {
      this._clusterPointCollection.update(frameState);
    }

    if (Cesium.defined(this._labelCollection)) {
      this._labelCollection.update(frameState);
    }
    if (Cesium.defined(this._billboardCollection)) {
      this._billboardCollection.update(frameState);
    }
    if (Cesium.defined(this._pointCollection)) {
      this._pointCollection.update(frameState);
    }
  }


  /**
   * Returns a new {@link Cesium.Label}.
   * @returns {Cesium.Label} The label that will be used to visualize an entity.
   *
   * @private
   * @param collectionProperty
   * @param CollectionConstructor
   * @param unusedIndicesProperty
   * @param entityIndexProperty
   */
  getLabel(
    collectionProperty: any = "_labelCollection",
    CollectionConstructor: any = Cesium.LabelCollection,
    unusedIndicesProperty: any = "_unusedLabelIndices",
    entityIndexProperty: any = "labelIndex"
  ) {
    return (entity: any) => {
      let collection = collectionProperty;

      if (!Cesium.defined(this._collectionIndicesByEntity)) {
        this._collectionIndicesByEntity = {};
      }

      let entityIndices = this._collectionIndicesByEntity[entity.id];

      if (!Cesium.defined(entityIndices)) {
        entityIndices = this._collectionIndicesByEntity[entity.id] = {
          billboardIndex: undefined,
          labelIndex: undefined,
          pointIndex: undefined
        };
      }

      if (Cesium.defined(collection) && Cesium.defined(entityIndices[entityIndexProperty])) {
        return collection.get(entityIndices[entityIndexProperty]);
      }

      if (!Cesium.defined(collection)) {
        collection = collectionProperty = new CollectionConstructor({
          scene: this._scene
        });
      }

      let index;
      let entityItem;

      const unusedIndices = unusedIndicesProperty;
      if (unusedIndices.length > 0) {
        index = unusedIndices.pop();
        entityItem = collection.get(index);
      } else {
        entityItem = collection.add();
        index = collection.length - 1;
      }

      entityIndices[entityIndexProperty] = index;

      const that = this;
      Promise.resolve().then(function() {
        that._clusterDirty = true;
      });

      return entityItem;
    };
  }


  /**
   * Returns a new {@link Cesium.Billboard}.
   * @returns {Cesium.Billboard} The label that will be used to visualize an entity.
   *
   * @private
   * @param collectionProperty
   * @param CollectionConstructor
   * @param unusedIndicesProperty
   * @param entityIndexProperty
   */
  getBillboard(
    collectionProperty: any = "_billboardCollection",
    CollectionConstructor: any = Cesium.BillboardCollection,
    unusedIndicesProperty: any = "_unusedBillboardIndices",
    entityIndexProperty: any = "billboardIndex"
  ) {
    return (entity: any) => {
      let collection = collectionProperty;

      if (!Cesium.defined(this._collectionIndicesByEntity)) {
        this._collectionIndicesByEntity = {};
      }

      let entityIndices = this._collectionIndicesByEntity[entity.id];

      if (!Cesium.defined(entityIndices)) {
        entityIndices = this._collectionIndicesByEntity[entity.id] = {
          billboardIndex: undefined,
          labelIndex: undefined,
          pointIndex: undefined
        };
      }

      if (Cesium.defined(collection) && Cesium.defined(entityIndices[entityIndexProperty])) {
        return collection.get(entityIndices[entityIndexProperty]);
      }

      if (!Cesium.defined(collection)) {
        collection = collectionProperty = new CollectionConstructor({
          scene: this._scene
        });
      }

      let index;
      let entityItem;

      const unusedIndices = unusedIndicesProperty;
      if (unusedIndices.length > 0) {
        index = unusedIndices.pop();
        entityItem = collection.get(index);
      } else {
        entityItem = collection.add();
        index = collection.length - 1;
      }

      entityIndices[entityIndexProperty] = index;

      const that = this;
      Promise.resolve().then(function() {
        that._clusterDirty = true;
      });

      return entityItem;
    };
  }

  /**
   * Returns a new {@link Point}.
   * @returns {Point} The label that will be used to visualize an entity.
   *
   * @private
   * @param collectionProperty
   * @param CollectionConstructor
   * @param unusedIndicesProperty
   * @param entityIndexProperty
   */
  getPoint(
    collectionProperty: any = "_pointCollection",
    CollectionConstructor: any = Cesium.PointPrimitiveCollection,
    unusedIndicesProperty: any = "_unusedPointIndices",
    entityIndexProperty: any = "pointIndex"
  ) {
    return (entity: any) => {
      let collection = collectionProperty;

      if (!Cesium.defined(this._collectionIndicesByEntity)) {
        this._collectionIndicesByEntity = {};
      }

      let entityIndices = this._collectionIndicesByEntity[entity.id];

      if (!Cesium.defined(entityIndices)) {
        entityIndices = this._collectionIndicesByEntity[entity.id] = {
          billboardIndex: undefined,
          labelIndex: undefined,
          pointIndex: undefined
        };
      }

      if (Cesium.defined(collection) && Cesium.defined(entityIndices[entityIndexProperty])) {
        return collection.get(entityIndices[entityIndexProperty]);
      }

      if (!Cesium.defined(collection)) {
        collection = collectionProperty = new CollectionConstructor({
          scene: this._scene
        });
      }

      let index;
      let entityItem;

      const unusedIndices = unusedIndicesProperty;
      if (unusedIndices.length > 0) {
        index = unusedIndices.pop();
        entityItem = collection.get(index);
      } else {
        entityItem = collection.add();
        index = collection.length - 1;
      }

      entityIndices[entityIndexProperty] = index;

      const that = this;
      Promise.resolve().then(function() {
        that._clusterDirty = true;
      });

      return entityItem;
    };
  }

  /**
   * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
   * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
   * <p>
   * Unlike other objects that use WebGL resources, this object can be reused. For example, if a data source is removed
   * from a data source collection and added to another.
   * </p>
   */
  destroy() {
    this._labelCollection =
      this._labelCollection && this._labelCollection.destroy();
    this._billboardCollection =
      this._billboardCollection && this._billboardCollection.destroy();
    this._pointCollection =
      this._pointCollection && this._pointCollection.destroy();

    this._clusterLabelCollection =
      this._clusterLabelCollection && this._clusterLabelCollection.destroy();
    this._clusterBillboardCollection =
      this._clusterBillboardCollection &&
      this._clusterBillboardCollection.destroy();
    this._clusterPointCollection =
      this._clusterPointCollection && this._clusterPointCollection.destroy();

    if (Cesium.defined(this._removeEventListener)) {
      this._removeEventListener();
      this._removeEventListener = undefined;
    }

    this._labelCollection = undefined;
    this._billboardCollection = undefined;
    this._pointCollection = undefined;

    this._clusterBillboardCollection = undefined;
    this._clusterLabelCollection = undefined;
    this._clusterPointCollection = undefined;

    this._collectionIndicesByEntity = undefined;

    this._unusedLabelIndices = [];
    this._unusedBillboardIndices = [];
    this._unusedPointIndices = [];

    this._previousClusters = [];
    this._previousHeight = undefined;

    this._enabledDirty = false;
    this._pixelRangeDirty = false;
    this._minimumClusterSizeDirty = false;

    return undefined;
  }
}

function getX(point: any) {
  return point.coord.x;
}

function getY(point: any) {
  return point.coord.y;
}

function expandBoundingBox(bbox: any, pixelRange: any) {
  bbox.x -= pixelRange;
  bbox.y -= pixelRange;
  bbox.width += pixelRange * 2.0;
  bbox.height += pixelRange * 2.0;
}

const labelBoundingBoxScratch = new Cesium.BoundingRectangle();

function getBoundingBox(item: any, coord: any, pixelRange: any, primitiveCluster: any, result: any) {
  if (Cesium.defined(item._labelCollection) && primitiveCluster._clusterLabels) {
    // @ts-ignore
    result = Cesium.Label.getScreenSpaceBoundingBox(item, coord, result);
  } else if (
    Cesium.defined(item._billboardCollection) &&
    primitiveCluster._clusterBillboards
  ) {
    // @ts-ignore
    result = Cesium.Billboard.getScreenSpaceBoundingBox(item, coord, result);
  } else if (
    Cesium.defined(item._pointPrimitiveCollection) &&
    primitiveCluster._clusterPoints
  ) {
    // @ts-ignore
    result = Cesium.PointPrimitive.getScreenSpaceBoundingBox(item, coord, result);
  }

  expandBoundingBox(result, pixelRange);

  if (
    primitiveCluster._clusterLabels &&
    !Cesium.defined(item._labelCollection) &&
    Cesium.defined(item.id) &&
    hasLabelIndex(primitiveCluster, item.id.id) &&
    Cesium.defined(item.id._label)
  ) {
    const labelIndex =
      primitiveCluster._collectionIndicesByEntity[item.id.id].labelIndex;
    const label = primitiveCluster._labelCollection.get(labelIndex);
    // @ts-ignore
    const labelBBox = Cesium.Label.getScreenSpaceBoundingBox(
      label,
      coord,
      labelBoundingBoxScratch
    );
    expandBoundingBox(labelBBox, pixelRange);
    result = Cesium.BoundingRectangle.union(result, labelBBox, result);
  }

  return result;
}

function addNonClusteredItem(item: any, primitiveCluster: any) {
  item.clusterShow = true;

  if (
    !Cesium.defined(item._labelCollection) &&
    Cesium.defined(item.id) &&
    hasLabelIndex(primitiveCluster, item.id.id) &&
    Cesium.defined(item.id._label)
  ) {
    const labelIndex =
      primitiveCluster._collectionIndicesByEntity[item.id.id].labelIndex;
    const label = primitiveCluster._labelCollection.get(labelIndex);
    label.clusterShow = true;
  }
}

function addCluster(position: any, numPoints: any, ids: any, primitiveCluster: any) {
  const cluster = {
    billboard: primitiveCluster._clusterBillboardCollection.add(),
    label: primitiveCluster._clusterLabelCollection.add(),
    point: primitiveCluster._clusterPointCollection.add()
  };

  cluster.billboard.show = false;
  cluster.point.show = false;
  cluster.label.show = true;
  cluster.label.text = numPoints.toLocaleString();
  cluster.label.id = ids;
  cluster.billboard.position = cluster.label.position = cluster.point.position = position;

  primitiveCluster._clusterEvent.raiseEvent(ids, cluster);
}

function hasLabelIndex(primitiveCluster: any, entityId: any) {
  return (
    Cesium.defined(primitiveCluster) &&
    Cesium.defined(primitiveCluster._collectionIndicesByEntity[entityId]) &&
    Cesium.defined(primitiveCluster._collectionIndicesByEntity[entityId].labelIndex)
  );
}

function getScreenSpacePositions(
  collection: any,
  points: any,
  scene: any,
  occluder: any,
  primitiveCluster: any
) {
  if (!Cesium.defined(collection)) {
    return;
  }

  const length = collection.length;
  for (let i = 0; i < length; ++i) {
    const item = collection.get(i);
    item.clusterShow = false;

    if (
      !item.show ||
      (primitiveCluster._scene.mode === Cesium.SceneMode.SCENE3D &&
        !occluder.isPointVisible(item.position))
    ) {
      continue;
    }

    // const canClusterLabels =
    //   primitiveCluster._clusterLabels && Cesium.defined(item._labelCollection);
    // const canClusterBillboards =
    //   primitiveCluster._clusterBillboards && Cesium.defined(item.id._billboard);
    // const canClusterPoints =
    //   primitiveCluster._clusterPoints && Cesium.defined(item.id._point);
    // if (canClusterLabels && (canClusterPoints || canClusterBillboards)) {
    //   continue;
    // }

    const coord = item.computeScreenSpacePosition(scene);
    if (!Cesium.defined(coord)) {
      continue;
    }

    points.push({
      index: i,
      collection: collection,
      clustered: false,
      coord: coord
    });
  }
}

const pointBoundinRectangleScratch = new Cesium.BoundingRectangle();
const totalBoundingRectangleScratch = new Cesium.BoundingRectangle();
const neighborBoundingRectangleScratch = new Cesium.BoundingRectangle();

function createDeclutterCallback(primitiveCluster: any) {
  return function(amount: any) {
    if ((Cesium.defined(amount) && amount < 0.05) || !primitiveCluster.enabled) {
      return;
    }

    const scene = primitiveCluster._scene;

    const labelCollection = primitiveCluster._labelCollection;
    const billboardCollection = primitiveCluster._billboardCollection;
    const pointCollection = primitiveCluster._pointCollection;

    if (
      (!Cesium.defined(labelCollection) &&
        !Cesium.defined(billboardCollection) &&
        !Cesium.defined(pointCollection)) ||
      (!primitiveCluster._clusterBillboards &&
        !primitiveCluster._clusterLabels &&
        !primitiveCluster._clusterPoints)
    ) {
      return;
    }

    let clusteredLabelCollection = primitiveCluster._clusterLabelCollection;
    let clusteredBillboardCollection =
      primitiveCluster._clusterBillboardCollection;
    let clusteredPointCollection = primitiveCluster._clusterPointCollection;

    if (Cesium.defined(clusteredLabelCollection)) {
      clusteredLabelCollection.removeAll();
    } else {
      clusteredLabelCollection = primitiveCluster._clusterLabelCollection = new Cesium.LabelCollection({
        scene: scene
      });
    }

    if (Cesium.defined(clusteredBillboardCollection)) {
      clusteredBillboardCollection.removeAll();
    } else {
      clusteredBillboardCollection = primitiveCluster._clusterBillboardCollection = new Cesium.BillboardCollection({
        scene: scene
      });
    }

    if (Cesium.defined(clusteredPointCollection)) {
      clusteredPointCollection.removeAll();
    } else {
      clusteredPointCollection = primitiveCluster._clusterPointCollection = new Cesium.PointPrimitiveCollection();
    }

    const pixelRange = primitiveCluster._pixelRange;
    const minimumClusterSize = primitiveCluster._minimumClusterSize;

    const clusters = primitiveCluster._previousClusters;
    const newClusters = [];

    const previousHeight = primitiveCluster._previousHeight;
    const currentHeight = scene.camera.positionCartographic.height;

    const ellipsoid = scene.mapProjection.ellipsoid;
    const cameraPosition = scene.camera.positionWC;
    // @ts-ignore
    const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, cameraPosition);

    const points: any = [];
    if (primitiveCluster._clusterLabels) {
      getScreenSpacePositions(
        labelCollection,
        points,
        scene,
        occluder,
        primitiveCluster
      );
    }
    if (primitiveCluster._clusterBillboards) {
      getScreenSpacePositions(
        billboardCollection,
        points,
        scene,
        occluder,
        primitiveCluster
      );
    }
    if (primitiveCluster._clusterPoints) {
      getScreenSpacePositions(
        pointCollection,
        points,
        scene,
        occluder,
        primitiveCluster
      );
    }

    let i;
    let j;
    let length;
    let bbox;
    let neighbors;
    let neighborLength;
    let neighborIndex;
    let neighborPoint;
    let ids;
    let numPoints;

    let collection;
    let collectionIndex;

    // @ts-ignore
    const index = new Cesium.kdbush(points, getX, getY, 64, Int32Array);

    if (currentHeight < previousHeight) {
      length = clusters.length;
      for (i = 0; i < length; ++i) {
        const cluster = clusters[i];

        if (!occluder.isPointVisible(cluster.position)) {
          continue;
        }

        // @ts-ignore
        const coord = Cesium.Billboard._computeScreenSpacePosition(
          Cesium.Matrix4.IDENTITY,
          cluster.position,
          Cesium.Cartesian3.ZERO,
          Cesium.Cartesian2.ZERO,
          scene
        );
        if (!Cesium.defined(coord)) {
          continue;
        }

        const factor = 1.0 - currentHeight / previousHeight;
        let width = (cluster.width = cluster.width * factor);
        let height = (cluster.height = cluster.height * factor);

        width = Math.max(width, cluster.minimumWidth);
        height = Math.max(height, cluster.minimumHeight);

        const minX = coord.x - width * 0.5;
        const minY = coord.y - height * 0.5;
        const maxX = coord.x + width;
        const maxY = coord.y + height;

        neighbors = index.range(minX, minY, maxX, maxY);
        neighborLength = neighbors.length;
        numPoints = 0;
        ids = [];

        for (j = 0; j < neighborLength; ++j) {
          neighborIndex = neighbors[j];
          neighborPoint = points[neighborIndex];
          if (!neighborPoint.clustered) {
            ++numPoints;

            collection = neighborPoint.collection;
            collectionIndex = neighborPoint.index;
            ids.push(collection.get(collectionIndex).id);
          }
        }

        if (numPoints >= minimumClusterSize) {
          addCluster(cluster.position, numPoints, ids, primitiveCluster);
          newClusters.push(cluster);

          for (j = 0; j < neighborLength; ++j) {
            points[neighbors[j]].clustered = true;
          }
        }
      }
    }

    length = points.length;
    for (i = 0; i < length; ++i) {
      const point = points[i];
      if (point.clustered) {
        continue;
      }

      point.clustered = true;

      collection = point.collection;
      collectionIndex = point.index;

      const item = collection.get(collectionIndex);
      bbox = getBoundingBox(
        item,
        point.coord,
        pixelRange,
        primitiveCluster,
        pointBoundinRectangleScratch
      );
      const totalBBox = Cesium.BoundingRectangle.clone(
        bbox,
        totalBoundingRectangleScratch
      );

      neighbors = index.range(
        bbox.x,
        bbox.y,
        bbox.x + bbox.width,
        bbox.y + bbox.height
      );
      neighborLength = neighbors.length;

      const clusterPosition = Cesium.Cartesian3.clone(item.position);
      numPoints = 1;
      // ids = [item.id];
      ids = [item];

      for (j = 0; j < neighborLength; ++j) {
        neighborIndex = neighbors[j];
        neighborPoint = points[neighborIndex];
        if (!neighborPoint.clustered) {
          const neighborItem = neighborPoint.collection.get(
            neighborPoint.index
          );
          const neighborBBox = getBoundingBox(
            neighborItem,
            neighborPoint.coord,
            pixelRange,
            primitiveCluster,
            neighborBoundingRectangleScratch
          );

          Cesium.Cartesian3.add(
            neighborItem.position,
            clusterPosition,
            clusterPosition
          );

          Cesium.BoundingRectangle.union(totalBBox, neighborBBox, totalBBox);
          ++numPoints;

          // ids.push(neighborItem.id);
          ids.push(neighborItem);
        }
      }

      if (numPoints >= minimumClusterSize) {
        const position = Cesium.Cartesian3.multiplyByScalar(
          clusterPosition,
          1.0 / numPoints,
          clusterPosition
        );
        addCluster(position, numPoints, ids, primitiveCluster);
        newClusters.push({
          position: position,
          width: totalBBox.width,
          height: totalBBox.height,
          minimumWidth: bbox.width,
          minimumHeight: bbox.height
        });

        for (j = 0; j < neighborLength; ++j) {
          points[neighbors[j]].clustered = true;
        }
      } else {
        addNonClusteredItem(item, primitiveCluster);
      }
    }

    if (clusteredLabelCollection.length === 0) {
      clusteredLabelCollection.destroy();
      primitiveCluster._clusterLabelCollection = undefined;
    }

    if (clusteredBillboardCollection.length === 0) {
      clusteredBillboardCollection.destroy();
      primitiveCluster._clusterBillboardCollection = undefined;
    }

    if (clusteredPointCollection.length === 0) {
      clusteredPointCollection.destroy();
      primitiveCluster._clusterPointCollection = undefined;
    }

    primitiveCluster._previousClusters = newClusters;
    primitiveCluster._previousHeight = currentHeight;
  };
}


Object.defineProperties(PrimitiveCluster.prototype, {
  /**
   * Gets or sets whether clustering is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  enabled: {
    get: function() {
      return this._enabled;
    },
    set: function(value) {
      this._enabledDirty = value !== this._enabled;
      this._enabled = value;
    }
  },
  /**
   * Gets or sets the pixel range to extend the screen space bounding box.
   * @memberof PrimitiveCluster.prototype
   * @type {Number}
   */
  pixelRange: {
    get: function() {
      return this._pixelRange;
    },
    set: function(value) {
      this._clusterDirty = this._clusterDirty || value !== this._pixelRange;
      this._pixelRange = value;
    }
  },
  /**
   * Gets or sets the minimum number of screen space objects that can be clustered.
   * @memberof PrimitiveCluster.prototype
   * @type {Number}
   */
  minimumClusterSize: {
    get: function() {
      return this._minimumClusterSize;
    },
    set: function(value) {
      this._clusterDirty =
        this._clusterDirty || value !== this._minimumClusterSize;
      this._minimumClusterSize = value;
    }
  },
  /**
   * Gets the event that will be raised when a new cluster will be displayed. The signature of the event listener is {@link PrimitiveCluster.newClusterCallback}.
   * @memberof PrimitiveCluster.prototype
   * @type {Cesium.Event<PrimitiveCluster.newClusterCallback>}
   */
  clusterEvent: {
    get: function() {
      return this._clusterEvent;
    }
  },
  /**
   * Gets or sets whether clustering billboard entities is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  clusterBillboards: {
    get: function() {
      return this._clusterBillboards;
    },
    set: function(value) {
      this._clusterDirty =
        this._clusterDirty || value !== this._clusterBillboards;
      this._clusterBillboards = value;
    }
  },
  /**
   * Gets or sets whether clustering labels entities is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  clusterLabels: {
    get: function() {
      return this._clusterLabels;
    },
    set: function(value) {
      this._clusterDirty = this._clusterDirty || value !== this._clusterLabels;
      this._clusterLabels = value;
    }
  },
  /**
   * Gets or sets whether clustering point entities is enabled.
   * @memberof PrimitiveCluster.prototype
   * @type {Boolean}
   */
  clusterPoints: {
    get: function() {
      return this._clusterPoints;
    },
    set: function(value) {
      this._clusterDirty = this._clusterDirty || value !== this._clusterPoints;
      this._clusterPoints = value;
    }
  },
  //2.在PrimitiveCluster.prototype拦截器Object.defineProperties方法中添加_delay的访问以及设置方法
  delay: {
    get: function() {
      return this._delay;
    },
    set: function(value) {
      this._delay = value;
    }
  }
});


function removeEntityIndicesIfUnused(primitiveCluster: PrimitiveCluster, entityId: string) {
  const indices = primitiveCluster._collectionIndicesByEntity[entityId];

  if (
    !Cesium.defined(indices.billboardIndex) &&
    !Cesium.defined(indices.labelIndex) &&
    !Cesium.defined(indices.pointIndex)
  ) {
    delete primitiveCluster._collectionIndicesByEntity[entityId];
  }
}

function disableCollectionClustering(collection: any) {
  if (!Cesium.defined(collection)) {
    return;
  }

  const length = collection.length;
  for (let i = 0; i < length; ++i) {
    collection.get(i).clusterShow = true;
  }
}

function updateEnable(primitiveCluster: PrimitiveCluster) {
  if (primitiveCluster.enabled) {
    return;
  }

  if (Cesium.defined(primitiveCluster._clusterLabelCollection)) {
    primitiveCluster._clusterLabelCollection.destroy();
  }
  if (Cesium.defined(primitiveCluster._clusterBillboardCollection)) {
    primitiveCluster._clusterBillboardCollection.destroy();
  }
  if (Cesium.defined(primitiveCluster._clusterPointCollection)) {
    primitiveCluster._clusterPointCollection.destroy();
  }

  primitiveCluster._clusterLabelCollection = undefined;
  primitiveCluster._clusterBillboardCollection = undefined;
  primitiveCluster._clusterPointCollection = undefined;

  disableCollectionClustering(primitiveCluster._labelCollection);
  disableCollectionClustering(primitiveCluster._billboardCollection);
  disableCollectionClustering(primitiveCluster._pointCollection);
}


/**
 * A event listener function used to style clusters.
 * @callback PrimitiveCluster.newClusterCallback
 *
 * @param {Entity[]} clusteredEntities An array of the entities contained in the cluster.
 * @param {Object} cluster An object containing the Cesium.Billboard, Cesium.Label, and Point
 * primitives that represent this cluster of entities.
 * @param {Cesium.Billboard} cluster.billboard
 * @param {Cesium.Label} cluster.label
 * @param {Cesium.PointPrimitive} cluster.point
 *
 * @example
 * // The default cluster values.
 * dataSource.clustering.clusterEvent.addEventListener(function(entities, cluster) {
 *     cluster.label.show = true;
 *     cluster.label.text = entities.length.toLocaleString();
 * });
 */
export default PrimitiveCluster

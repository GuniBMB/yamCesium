(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "cesium", "./viewModels/DistanceLegendViewModel", "./viewModels/NavigationViewModel"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /* eslint-disable no-unused-vars */
    var Cesium = require("cesium");
    // import registerKnockoutBindings from './core/registerKnockoutBindings'
    var DistanceLegendViewModel_1 = require("./viewModels/DistanceLegendViewModel");
    var NavigationViewModel_1 = require("./viewModels/NavigationViewModel");
    var defined = Cesium.defined;
    var definedProperties = Object.defineProperties;
    var CesiumEvent = Cesium.Event;
    // @ts-ignore
    var Knockout = Cesium.knockout;
    var DeveloperError = Cesium.DeveloperError;
    /**
     * @alias CesiumNavigation
     * @constructor
     *
     * @param {Viewer|CesiumWidget} viewerCesiumWidget The Viewer or CesiumWidget instance
     */
    var CesiumNavigation = /** @class */ (function () {
        function CesiumNavigation(viewerCesiumWidget, options) {
            this._navigationLocked = false;
            this._onDestroyListeners = [];
            this.initialize(viewerCesiumWidget, options);
        }
        /**
         * @param {Viewer|CesiumWidget} viewerCesiumWidget The Viewer or CesiumWidget instance
         * @param options
         */
        CesiumNavigation.prototype.initialize = function (viewerCesiumWidget, options) {
            if (!defined(viewerCesiumWidget)) {
                throw new DeveloperError("CesiumWidget or Viewer is required.");
            }
            //        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
            var cesiumWidget = defined(viewerCesiumWidget.cesiumWidget) ? viewerCesiumWidget.cesiumWidget : viewerCesiumWidget;
            var container = document.createElement("div");
            container.className = "cesium-widget-cesiumNavigationContainer";
            cesiumWidget.container.appendChild(container);
            this.terria = viewerCesiumWidget;
            this.terria.options = (defined(options)) ? options : {};
            this.terria.afterWidgetChanged = new CesiumEvent();
            this.terria.beforeWidgetChanged = new CesiumEvent();
            this.container = container;
            // this.navigationDiv.setAttribute("id", "navigationDiv");
            // Register custom Knockout.js bindings.  If you're not using the TerriaJS user interface, you can remove this.
            // registerKnockoutBindings()
            if (!defined(this.terria.options.enableDistanceLegend) || this.terria.options.enableDistanceLegend) {
                this.distanceLegendDiv = document.createElement("div");
                container.appendChild(this.distanceLegendDiv);
                this.distanceLegendDiv.setAttribute("id", "distanceLegendDiv");
                this.distanceLegendViewModel = DistanceLegendViewModel_1.default.create({
                    container: this.distanceLegendDiv,
                    terria: this.terria,
                    mapElement: container,
                    enableDistanceLegend: true
                });
            }
            if ((!defined(this.terria.options.enableZoomControls) || this.terria.options.enableZoomControls) && (!defined(this.terria.options.enableCompass) || this.terria.options.enableCompass)) {
                this.navigationDiv = document.createElement("div");
                this.navigationDiv.setAttribute("id", "navigationDiv");
                container.appendChild(this.navigationDiv);
                // Create the navigation controls.
                this.navigationViewModel = NavigationViewModel_1.default.create({
                    container: this.navigationDiv,
                    terria: this.terria,
                    enableZoomControls: true,
                    enableCompass: true
                });
            }
            else if ((defined(this.terria.options.enableZoomControls) && !this.terria.options.enableZoomControls) && (!defined(this.terria.options.enableCompass) || this.terria.options.enableCompass)) {
                this.navigationDiv = document.createElement("div");
                this.navigationDiv.setAttribute("id", "navigationDiv");
                container.appendChild(this.navigationDiv);
                // Create the navigation controls.
                this.navigationViewModel = NavigationViewModel_1.default.create({
                    container: this.navigationDiv,
                    terria: this.terria,
                    enableZoomControls: false,
                    enableCompass: true
                });
            }
            else if ((!defined(this.terria.options.enableZoomControls) || this.terria.options.enableZoomControls) && (defined(this.terria.options.enableCompass) && !this.terria.options.enableCompass)) {
                this.navigationDiv = document.createElement("div");
                this.navigationDiv.setAttribute("id", "navigationDiv");
                container.appendChild(this.navigationDiv);
                // Create the navigation controls.
                this.navigationViewModel = NavigationViewModel_1.default.create({
                    container: this.navigationDiv,
                    terria: this.terria,
                    enableZoomControls: true,
                    enableCompass: false
                });
            }
            else if ((defined(this.terria.options.enableZoomControls) && !this.terria.options.enableZoomControls) && (defined(this.terria.options.enableCompass) && !this.terria.options.enableCompass)) {
                // this.navigationDiv.setAttribute("id", "navigationDiv");
                // container.appendChild(this.navigationDiv);
                // Create the navigation controls.
                //            this.navigationViewModel = NavigationViewModel.create({
                //                container: this.navigationDiv,
                //                terria: this.terria,
                //                enableZoomControls: false,
                //                enableCompass: false
                //            });
            }
        };
        CesiumNavigation.prototype.setNavigationLocked = function (locked) {
            this._navigationLocked = locked;
            this.navigationViewModel.setNavigationLocked(this._navigationLocked);
        };
        CesiumNavigation.prototype.getNavigationLocked = function () {
            return this._navigationLocked;
        };
        CesiumNavigation.prototype.destroy = function () {
            if (defined(this.navigationViewModel)) {
                this.navigationViewModel.destroy();
            }
            if (defined(this.distanceLegendViewModel)) {
                this.distanceLegendViewModel.destroy();
            }
            if (defined(this.navigationDiv)) {
                this.navigationDiv.parentNode.removeChild(this.navigationDiv);
            }
            delete this.navigationDiv;
            if (defined(this.distanceLegendDiv)) {
                this.distanceLegendDiv.parentNode.removeChild(this.distanceLegendDiv);
            }
            delete this.distanceLegendDiv;
            if (defined(this.container)) {
                this.container.parentNode.removeChild(this.container);
            }
            delete this.container;
            for (var i = 0; i < this._onDestroyListeners.length; i++) {
                this._onDestroyListeners[i]();
            }
        };
        CesiumNavigation.prototype.addOnDestroyListener = function (callback) {
            if (typeof callback === "function") {
                this._onDestroyListeners.push(callback);
            }
        };
        return CesiumNavigation;
    }());
    exports.default = CesiumNavigation;
});

import PlotPointDrawer from "./PlotPointDrawer";
import "./css/plot.css";
import PlotPolylineDrawer from "./PlotPolylineDrawer";
import PlotPolygonDrawer from "./PlotPolygonDrawer";
import PlotCircleDrawer from "./PlotCircleDrawer";
import PlotRectangleDrawer from "./PlotRectangleDrawer";
import PlotAttackArrowDrawer from "./PlotAttackArrowDrawer";
import PlotPincerArrowDrawer from "./PlotPincerArrowDrawer";
import PlotStraightArrowDrawer from "./PlotStraightArrowDrawer";
export default class PlotTracker {
    viewer: any;
    ctrArr: any;
    pointDrawer: PlotPointDrawer;
    polylineDrawer: PlotPolylineDrawer;
    polygonDrawer: PlotPolygonDrawer;
    rectangleDrawer: PlotRectangleDrawer;
    circleDrawer: PlotCircleDrawer;
    attackArrowDrawer: PlotAttackArrowDrawer;
    pincerArrowDrawer: PlotPincerArrowDrawer;
    straightArrowDrawer: PlotStraightArrowDrawer;
    constructor(viewer: any);
    clear(): void;
    trackPoint(options: any): Promise<unknown>;
    trackPolyline(options: any): Promise<unknown>;
    trackPolygon(options: any): Promise<unknown>;
    trackRectangle(options: any): Promise<unknown>;
    trackCircle(options: any): Promise<unknown>;
    trackAttackArrow(options: any): Promise<unknown>;
    trackPincerArrow(options: any): Promise<unknown>;
    trackStraightArrow(options: any): Promise<unknown>;
}
//# sourceMappingURL=PlotTracker.d.ts.map
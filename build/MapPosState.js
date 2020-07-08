import { Point } from "./Point.js";
import { ObjectAssignProperty } from "./Utils.js";
/** Contains the transforms made to the canvas, e.g. zoom and translation. */
export class MapPosState {
    constructor() {
        /** Used to save/load from JObject */
        this.dataProperties = ["translate", "scale"];
        this.translate = new Point(0, 0);
        this.scale = 1;
    }
    /** Creates a generic object that can be saved and loaded from JSON using .assign(o). */
    toJObject() {
        let o = {};
        this.dataProperties.forEach((e) => ObjectAssignProperty(o, this, e));
        return o;
    }
    /** Assigns the values of this element from a given object. */
    assign(o) {
        this.dataProperties.forEach((e) => ObjectAssignProperty(this, o, e));
        this.translate = Point.fromObject(o.translate);
        return true;
    }
    /** Creates a new MapPosState from a given object. */
    static fromJObject(o) {
        let x = new MapPosState();
        x.assign(o);
        return x;
    }
    /**
     * Applies a new scale centered at newTranslate (assigned from generic object)
     */
    zoomAtPosition(newTraslate, newScale) {
        let factor = newScale / this.scale;
        this.translate.assign(Point.BinaryOperation(newTraslate, this.translate, (newPoint, oldPoint) => newPoint - factor * (newPoint - oldPoint)));
        this.scale = newScale;
    }
}
//# sourceMappingURL=MapPosState.js.map
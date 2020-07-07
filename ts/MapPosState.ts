import { Point } from "./Point.js";

/**
 * Contains the transforms made to the canvas, e.g. zoom and translation.
 */
export class MapPosState {
    translate: Point;
    scale: number;

    constructor() {
        this.translate =  new Point(0, 0);
        this.scale = 1;
    }

    /**
     * Applies a new scale centered at newTranslate (assigned from generic object)
     */
    zoomAtPosition(newTraslate, newScale) {
        let factor = newScale / this.scale;
        this.translate.assign(Point.BinaryOperation(
            newTraslate, 
            this.translate, 
            (newPoint,oldPoint) => newPoint - factor * (newPoint - oldPoint)
        ));
        
        this.scale = newScale; 
    }
}
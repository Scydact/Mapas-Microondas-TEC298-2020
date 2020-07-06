import { Point } from "./Point.js";
export class MapPosState {
    constructor() {
        this.translate = new Point(0, 0);
        this.scale = 1;
    }
    /**
     * Applies a new scale centered at newTranslate (assigned from generic object)
     */
    zoomAtPosition(newTraslate, newScale) {
        this.translate.assign(newTraslate);
        this.scale = newScale;
    }
}
//# sourceMappingURL=MapPosState.js.map
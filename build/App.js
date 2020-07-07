import { Point } from './Point.js';
import { MapPosState } from './MapPosState.js';
import { MapMeta } from './MapMeta.js';
import { MapLoader } from './MapLoader.js';
import { InteractivityManager } from './UIControl.js';
import { Settings } from './Settings.js';
/**
 * Main class of this map application. Should be loaded once.
 * (Though nothing stops you from creating more than one.)
 *
 * - To add new settings, refer to Settings.ts
 * - To add new interactivity, refer to UiControl.ts
 * - Any loose pure functions should go on Utils.ts
 */
export class App {
    /**
     * Initializes the canvas to #renderCanvas
     */
    constructor() {
        /**
         * Contains all points related to the mouse
         * - screen: Position on the user screen.
         * - canvas: Position inside the zoomed and translated canvas.
         * - screenSnap: Used by tools when snap is enabled.
         */
        this.mouse = {
            screen: new Point(-1, -1),
            canvas: new Point(-1, -1),
            screenSnap: new Point(-1, -1),
        };
        /**
         * Contains the transforms applied to the map
         * - translate
         * - scale
         */
        this.posState = new MapPosState();
        /**
         * Contains information about a map's fixed points (coordinates)
         */
        this.mapMeta = new MapMeta();
        this.mapLoader = new MapLoader();
        this.settings = new Settings();
        this.canvas = document.getElementById('renderCanvas');
        this.settings.updateSettingsNode(document.querySelector('#settings'), this.mapLoader);
        this.settings.eventHandlerList_PropertyChanged.push((property, val) => {
            if (property == 'map') {
                this.load(val);
            }
            ;
        });
    }
    /**
     * Loads a map.
     * @param map Map ID to load.
     */
    load(map) {
        this.mapLoader.load(this.mapMeta, map, this.posState, () => (this.draw()));
    }
    saveToCookies(identifier) {
    }
    /**
     * Draws on the associated canvas
     */
    draw() {
        let canvas = this.canvas;
        let context = canvas.getContext('2d');
        // Update width/height of canvas
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        // Draw map
        this.mapLoader.draw(context, this.posState);
        // Map lines
        // mapLineList.draw(context);
        // if (clickMode.mode == "setLinePoint2") {
        //     temp.mapline.templine.p2 = coordPos;
        //     temp.mapline.templine.draw(context);
        // }
        // if (clickMode.mode == "setTopographicPoint") {
        //     temp.mapline.templine.p1 = coordPos;
        //     temp.mapline.templine.p2 = temp.topo.mapLine.getPointProjection(coordPos);
        //     temp.mapline.templine.draw(context);
        // }
        // Map points
        // mapPointList.draw(context);
    }
}
$(document).ready(function () {
    let mapApp = new App();
    window.mapApp = mapApp;
    mapApp.load(mapApp.settings.map);
    let interman = new InteractivityManager(mapApp);
    window.interman = interman;
    $(window).ready(() => interman.onWindowReady());
});
//# sourceMappingURL=App.js.map
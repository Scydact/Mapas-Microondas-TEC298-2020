import { Point } from './Point.js';
import { MapPosState } from './MapPosState.js';
import { MapMeta } from './MapMeta.js';
import { MapLoader } from './MapLoader.js';

class App {
    
    mouse = {
        screen: new Point(-1, -1),
        canvas: new Point(-1, -1),
        screenSnap: new Point(-1, -1),
    }

    posState = new MapPosState();
    mapMeta = new MapMeta();
    mapLoader = new MapLoader();

    canvas: HTMLCanvasElement;

    constructor() {
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    }

    /**
     * Loads a map.
     * @param map Map ID to load.
     */
    load(map: string) {
        this.mapLoader.load(this.mapMeta, map, this.posState, () => (this.draw()));
    }

    /**
     * Draws on the associated canvas
     */
    draw() {
        console.log('DRAW');
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

$(document).ready(function() {
    let mapApp = new App();
    (<any>window).mapApp = mapApp;
    mapApp.load('jarabacoa');
})
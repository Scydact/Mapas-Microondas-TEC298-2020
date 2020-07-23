import { MapMeta } from "./MapMeta.js";
/**
 * Contains methods to load and draw the actual map on a canvas.
 */
export class MapLoader {
    constructor() {
        this.loadedMapCache = [];
        this.currentMap = '';
        this.loadingMap = false;
        this.currentLoadedImages = -1;
        this.totalImages = -1;
        // Used for the event
        this.eventHandlerList_MapChanged = [];
    }
    mapChangedEventRun(map) {
        this.eventHandlerList_MapChanged.forEach((e) => e(map));
    }
    /**
     * Returns the (assembled, not grid) size of the selected map.
     */
    get imageSize() {
        let cs = MapLoader.mapStruct[this.currentMap];
        return {
            w: cs.elementSize.w * cs.gridSize.w,
            h: cs.elementSize.h * cs.gridSize.h,
        };
    }
    /**
     * Updates the #loadingBarMsg and #loadingBarPercent according to the amount of images that have been loaded to the DOM.
     */
    updateLoadingBar() {
        let loadBarMsg = document.getElementById("loadingBarMsg");
        loadBarMsg.innerHTML =
            "Cargando " + this.currentLoadedImages + " / " + this.totalImages;
        let loadBar = document.getElementById("loadingBarPercent");
        let w = 100 * this.currentLoadedImages / this.totalImages;
        loadBar.style.width = w.toString() + "%";
    }
    ;
    /**
     * Centers the map on the screen.
     * @param mapPosStateObject Translate and Scale to modify
     */
    setDefaultZoom(mapPosStateObject) {
        // Focus entire map on screen
        mapPosStateObject.translate.x = -(this.imageSize.w - innerWidth) / 2;
        mapPosStateObject.translate.y = -(this.imageSize.h - innerHeight) / 2;
        mapPosStateObject.scale = 1;
        mapPosStateObject.zoomAtPosition({
            x: innerWidth / 2,
            y: innerHeight / 2
        }, innerHeight / this.imageSize.h);
    }
    /**
     * Loads the corresponding img tags to the DOM and sets the map to draw.
     * @param mapMeta MapMeta to set the values to.
     * @param map Map id to load.
     * @param mapPosStateObject If this is present, will be set to default zoom.
     * @param globalDraw Draw function to call when loading the map
     */
    load(mapMeta, map, mapPosStateObject, globalDraw) {
        if (this.currentMap === map) {
            return false;
        }
        this.currentMap = map;
        this.mapChangedEventRun(map);
        mapMeta.set(MapLoader.mapStruct[map].mapMeta);
        //document.title = `Mapa TEC298 — ${titleCase(map.replace('_',' '))}`;
        document.title = `Mapa TEC298 — ${mapMeta.name}`;
        if (mapPosStateObject) {
            this.setDefaultZoom(mapPosStateObject);
        }
        if (this.loadedMapCache[map] === undefined) {
            $("#loadingBarWrapper").removeClass("disabled");
            this.loadingMap = true;
            let gSize = MapLoader.mapStruct[map].gridSize;
            this.totalImages = gSize.w * gSize.h;
            this.currentLoadedImages = 0;
            let imageLoaderDiv = document.getElementById("imageLoader");
            this.loadedMapCache[map] = [];
            for (let i = 0; i < this.totalImages; i++) {
                let img = document.createElement("img");
                img.id = `im_${map}_${i}`;
                img.src = `maps/${map}/image--${i.toString().padStart(3, "0")}.jpg`;
                imageLoaderDiv.appendChild(img);
                this.loadedMapCache[map][i] = img;
                this.updateLoadingBar();
                let mapLoaderObj = this;
                $(img).one("load", function () {
                    mapLoaderObj.currentLoadedImages++;
                    globalDraw();
                    mapLoaderObj.updateLoadingBar();
                    if (mapLoaderObj.currentLoadedImages ==
                        mapLoaderObj.totalImages) {
                        $("#loadingBarWrapper").addClass("disabled");
                        mapLoaderObj.loadingMap = false;
                    }
                });
            }
        }
        globalDraw();
        return true;
    }
    /**
     * Draws the selected map on the given canvas context, at a given position and scale.
     * @param context Canvas 2D context to draw to.
     * @param posState Zoom translation and scale to draw to.
     */
    draw(context, posState) {
        if (true) {
            let imageList = this.loadedMapCache[this.currentMap];
            let elementSize = MapLoader.mapStruct[this.currentMap].elementSize;
            let gridSize = MapLoader.mapStruct[this.currentMap].gridSize;
            context.save();
            context.translate(posState.translate.x, posState.translate.y);
            context.scale(posState.scale, posState.scale);
            context.imageSmoothingEnabled = false;
            for (let i = 0; i < gridSize.h; i++) {
                var y = i * elementSize.h;
                for (let j = 0; j < gridSize.w; j++) {
                    var x = j * elementSize.w;
                    var image = imageList[i * gridSize.w + j];
                    context.drawImage(image, x, y);
                }
            }
            context.restore();
        }
    }
}
MapLoader.mapStruct = {
    azua: {
        elementSize: { w: 528, h: 520 },
        gridSize: { w: 17, h: 13 },
        mapMeta: MapMeta.fromJson("{\"name\":\"Azua\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":18.5},\"p2\":{\"x\":70.5,\"y\":18.33333}},\"px\":{\"p1\":{\"x\":1221,\"y\":255},\"p2\":{\"x\":7463,\"y\":4613}},\"oneMetreInPx\":0.23706773905510017}"),
    },
    constanza: {
        elementSize: { w: 520, h: 528 },
        gridSize: { w: 17, h: 13 },
        mapMeta: MapMeta.fromJson("{\"name\":\"Constanza\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19},\"p2\":{\"x\":70.5,\"y\":18.83333}},\"px\":{\"p1\":{\"x\":1289,\"y\":283},\"p2\":{\"x\":7507,\"y\":4642}},\"oneMetreInPx\":0.23663853123929837}"),
    },
    hato_mayor: {
        elementSize: { w: 512, h: 528 },
        gridSize: { w: 17, h: 13 },
        mapMeta: MapMeta.fromJson("{\"name\":\"Hato Mayor\",\"deg\":{\"p1\":{\"x\":69.5,\"y\":18.833333},\"p2\":{\"x\":69.25,\"y\":18.666666}},\"px\":{\"p1\":{\"x\":1223,\"y\":189},\"p2\":{\"x\":7432,\"y\":4552}},\"oneMetreInPx\":0.23598654280720946}"),
    },
    jarabacoa: {
        elementSize: { w: 528, h: 520 },
        gridSize: { w: 17, h: 13 },
        mapMeta: MapMeta.fromJson("{\"name\":\"Jarabacoa\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.16666},\"p2\":{\"x\":70.5,\"y\":19}},\"px\":{\"p1\":{\"x\":1252,\"y\":271},\"p2\":{\"x\":7460,\"y\":4628}},\"oneMetreInPx\":0.23666838456942246}"),
    },
    puerto_plata: {
        elementSize: { w: 512, h: 536 },
        gridSize: { w: 18, h: 13 },
        mapMeta: MapMeta.fromJson("{\"name\":\"Puerto Plata\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.833333},\"p2\":{\"x\":70.5,\"y\":19.666666}},\"px\":{\"p1\":{\"x\":1343,\"y\":254},\"p2\":{\"x\":7542,\"y\":4588}},\"oneMetreInPx\":0.2358035678014027}"),
    },
    comendador: {
        elementSize: { w: 528, h: 520 },
        gridSize: { w: 17, h: 13 },
        mapMeta: MapMeta.fromJson("{\"name\":\"Comendador\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.0},\"p2\":{\"x\":71.5,\"y\":18.833333}},\"px\":{\"p1\":{\"x\":718,\"y\":483},\"p2\":{\"x\":6952,\"y\":4843}},\"oneMetreInPx\":0.23675550687947847}"),
    },
};
//# sourceMappingURL=MapLoader.js.map
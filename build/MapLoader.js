import { MapMeta } from "./MapMeta.js";
export class MapLoader {
    constructor() {
        this.mapStruct = {
            azua: {
                elementSize: { w: 528, h: 520 },
                gridSize: { w: 17, h: 13 },
                mapMeta: MapMeta.fromLegacyString('Azua', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1221,"x2Px":7463,"y1Deg":18.5,"y2Deg":18.33333,"y1Px":255,"y2Px":4613,"oneMetreInPx":1.9511393698710089}'),
            },
            constanza: {
                elementSize: { w: 520, h: 528 },
                gridSize: { w: 17, h: 13 },
                mapMeta: MapMeta.fromLegacyString('Constanza', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1289,"x2Px":7507,"y1Deg":19,"y2Deg":18.83333,"y1Px":283,"y2Px":4642,"oneMetreInPx":1.96375716712138}'),
            },
            hato_mayor: {
                elementSize: { w: 512, h: 528 },
                gridSize: { w: 17, h: 13 },
                mapMeta: MapMeta.fromLegacyString('Hato Mayor', '{"x1Deg":69.5,"x2Deg":69.25,"x1Px":1223,"x2Px":7432,"y1Deg":18.833333,"y2Deg":18.666666,"y1Px":189,"y2Px":4552,"oneMetreInPx":1.9551870650091925}'),
            },
            jarabacoa: {
                elementSize: { w: 528, h: 520 },
                gridSize: { w: 17, h: 13 },
                mapMeta: MapMeta.fromLegacyString('Jarabacoa', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1252,"x2Px":7460,"y1Deg":19.16666,"y2Deg":19,"y1Px":271,"y2Px":4628,"oneMetreInPx":1.9614630420557655}'),
            },
            puerto_plata: {
                elementSize: { w: 512, h: 536 },
                gridSize: { w: 18, h: 13 },
                mapMeta: MapMeta.fromLegacyString('Puerto Plata', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1342,"x2Px":7543,"y1Deg":19.833333,"y2Deg":19.666666,"y1Px":92,"y2Px":4588,"oneMetreInPx":1.9511866481881994}'),
            },
        };
        this.loadedMapCache = [];
        this.currentMap = '';
        this.loadingMap = false;
        this.currentLoadedImages = -1;
        this.totalImages = -1;
    }
    get imageSize() {
        let cs = this.mapStruct[this.currentMap];
        return {
            w: cs.elementSize.w * cs.gridSize.w,
            h: cs.elementSize.h * cs.gridSize.h,
        };
    }
    updateLoadingBar() {
        let loadBarMsg = document.getElementById("loadingBarMsg");
        loadBarMsg.innerHTML =
            "Cargando " + this.currentLoadedImages + " / " + this.totalImages;
        let loadBar = document.getElementById("loadingBarPercent");
        let w = 100 * this.currentLoadedImages / this.totalImages;
        loadBar.style.width = w.toString() + "%";
    }
    ;
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
        this.currentMap = map;
        mapMeta.set(this.mapStruct[map].mapMeta);
        //document.title = `Mapa TEC298 — ${titleCase(map.replace('_',' '))}`;
        document.title = `Mapa TEC298 — ${mapMeta.name}`;
        if (mapPosStateObject) {
            this.setDefaultZoom(mapPosStateObject);
        }
        if (this.loadedMapCache[map] === undefined) {
            $("#loadingBarWrapper").removeClass("disabled");
            this.loadingMap = true;
            let gSize = this.mapStruct[map].gridSize;
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
    }
    /**
     * Draws the selected map on the given canvas context, at a given position and scale.
     * @param context Canvas 2D context to draw to.
     * @param posState Zoom translation and scale to draw to.
     */
    draw(context, posState) {
        if (true) {
            let imageList = this.loadedMapCache[this.currentMap];
            let elementSize = this.mapStruct[this.currentMap].elementSize;
            let gridSize = this.mapStruct[this.currentMap].gridSize;
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
//# sourceMappingURL=MapLoader.js.map
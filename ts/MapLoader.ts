import { MapMeta } from "./MapMeta.js";
import type { MapPosState } from "./MapPosState.js";
import { TopographicProfilePoint } from "./MapObject.js";

/**
 * Interface for basic map data structure, including section size, grid size, and its Metadata (default points and coords)
 */
export interface mapData {
    elementSize: { w: number, h: number },
    gridSize: { w: number, h: number },
    mapMeta: MapMeta;
}

type MapChangeHandler = (changedMap?: string) => any;


/**
 * Contains methods to load and draw the actual map on a canvas.
 */
export class MapLoader {
    static mapStruct: { [name: string]: mapData } = {
        azua: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Azua\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":18.5},\"p2\":{\"x\":70.5,\"y\":18.33333}},\"px\":{\"p1\":{\"x\":1221,\"y\":255},\"p2\":{\"x\":7463,\"y\":4613}},\"oneMetreInPx\":0.23706773905510017}"),
            //mapMeta: MapMeta.fromLegacyString('Azua', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1221,"x2Px":7463,"y1Deg":18.5,"y2Deg":18.33333,"y1Px":255,"y2Px":4613,"oneMetreInPx":1.9511393698710089}'),
        },
        constanza: {
            elementSize: { w: 520, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Constanza\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19},\"p2\":{\"x\":70.5,\"y\":18.83333}},\"px\":{\"p1\":{\"x\":1289,\"y\":283},\"p2\":{\"x\":7507,\"y\":4642}},\"oneMetreInPx\":0.23663853123929837}"),
            //mapMeta: MapMeta.fromLegacyString('Constanza', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1289,"x2Px":7507,"y1Deg":19,"y2Deg":18.83333,"y1Px":283,"y2Px":4642,"oneMetreInPx":1.96375716712138}'),
        },

        hato_mayor: {
            elementSize: { w: 512, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Hato Mayor\",\"deg\":{\"p1\":{\"x\":69.5,\"y\":18.833333},\"p2\":{\"x\":69.25,\"y\":18.666666}},\"px\":{\"p1\":{\"x\":1223,\"y\":189},\"p2\":{\"x\":7432,\"y\":4552}},\"oneMetreInPx\":0.23598654280720946}"),
            //mapMeta: MapMeta.fromLegacyString('Hato Mayor', '{"x1Deg":69.5,"x2Deg":69.25,"x1Px":1223,"x2Px":7432,"y1Deg":18.833333,"y2Deg":18.666666,"y1Px":189,"y2Px":4552,"oneMetreInPx":1.9551870650091925}'),
        },

        jarabacoa: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Jarabacoa\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.16666},\"p2\":{\"x\":70.5,\"y\":19}},\"px\":{\"p1\":{\"x\":1252,\"y\":271},\"p2\":{\"x\":7460,\"y\":4628}},\"oneMetreInPx\":0.23666838456942246}"),
            //mapMeta: MapMeta.fromLegacyString('Jarabacoa', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1252,"x2Px":7460,"y1Deg":19.16666,"y2Deg":19,"y1Px":271,"y2Px":4628,"oneMetreInPx":1.9614630420557655}'),
        },

        puerto_plata: {
            elementSize: { w: 512, h: 536 },
            gridSize: { w: 18, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Puerto Plata\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.833333},\"p2\":{\"x\":70.5,\"y\":19.666666}},\"px\":{\"p1\":{\"x\":1343,\"y\":254},\"p2\":{\"x\":7542,\"y\":4588}},\"oneMetreInPx\":0.2358035678014027}"),
            //mapMeta: MapMeta.fromLegacyString('Puerto Plata', '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1342,"x2Px":7543,"y1Deg":19.833333,"y2Deg":19.666666,"y1Px":92,"y2Px":4588,"oneMetreInPx":1.9511866481881994}'), 
        },
        comendador: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Comendador\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.0},\"p2\":{\"x\":71.5,\"y\":18.833333}},\"px\":{\"p1\":{\"x\":718,\"y\":483},\"p2\":{\"x\":6952,\"y\":4843}},\"oneMetreInPx\":0.23675550687947847}"),
        },
        el_cercado: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"El Cercado\",\"deg\":{\"p1\":{\"x\":71.74961111,\"y\":18.83397222},\"p2\":{\"x\":71.49961111,\"y\":18.66733333}},\"px\":{\"p1\":{\"x\":1225,\"y\":260},\"p2\":{\"x\":7450,\"y\":4619}},\"oneMetreInPx\":0.23604730577261943}"),
        },
        esperanza: {
            elementSize: { w: 520, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Esperanza\",\"deg\":{\"p1\":{\"x\":71.0,\"y\":19.666666},\"p2\":{\"x\":70.75,\"y\":19.5}},\"px\":{\"p1\":{\"x\":1267,\"y\":238},\"p2\":{\"x\":7468,\"y\":4580}},\"oneMetreInPx\":0.2355274163840207}"),
        },
        santiago: {
            elementSize: { w: 512, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Santiago\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.5},\"p2\":{\"x\":70.5,\"y\":19.333333}},\"px\":{\"p1\":{\"x\":1223,\"y\":232},\"p2\":{\"x\":7424,\"y\":4586}},\"oneMetreInPx\":0.23647140258163157}"),
        },
        san_francisco_arriba: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"San Francisco (Arriba)\",\"deg\":{\"p1\":{\"x\":70.75,\"y\":19.666667},\"p2\":{\"x\":70.5,\"y\":19.5}},\"px\":{\"p1\":{\"x\":1256,\"y\":249},\"p2\":{\"x\":7449,\"y\":4606}},\"oneMetreInPx\":0.23587486042433833}"),
        },
        fantino: {
            elementSize: { w: 520, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Fantino\",\"deg\":{\"p1\":{\"x\":70.5,\"y\":19.166667},\"p2\":{\"x\":70.5,\"y\":19.5}},\"px\":{\"p1\":{\"x\":1169,\"y\":266},\"p2\":{\"x\":7371,\"y\":4637}},\"oneMetreInPx\":0.23587486042433833}"),
        },
        janico: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Janico\",\"deg\":{\"p1\":{\"x\":71.0,\"y\":19.333333},\"p2\":{\"x\":70.75,\"y\":19.166667}},\"px\":{\"p1\":{\"x\":1192,\"y\":285},\"p2\":{\"x\":7397,\"y\":4643}},\"oneMetreInPx\":0.23587486042433833}"),
        },
        miches: {
            elementSize: { w: 512, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Miches\",\"deg\":{\"p1\":{\"x\":69.25,\"y\":19.05},\"p2\":{\"x\":69.0,\"y\":18.833333}},\"px\":{\"p1\":{\"x\":450,\"y\":221},\"p2\":{\"x\":6659,\"y\":5883}},\"oneMetreInPx\":0.23587486042433833}"),
        },
        san_cristobal: {
            elementSize: { w: 512, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"San Cristobal\",\"deg\":{\"p1\":{\"x\":70.249583,\"y\":18.500666},\"p2\":{\"x\":69.999555,\"y\": 18.334}},\"px\":{\"p1\":{\"x\":1249,\"y\":246},\"p2\":{\"x\":7484,\"y\":4602}},\"oneMetreInPx\":0.23587486042433833}"),
        },
        santiago_rodriguez: {
            elementSize: { w: 512, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMeta: MapMeta.fromJson("{\"name\":\"Santiago Rodríguez\",\"deg\":{\"p1\":{\"x\":71.5,\"y\":19.5},\"p2\":{\"x\":71.25,\"y\": 19.333333}},\"px\":{\"p1\":{\"x\":1285,\"y\":235},\"p2\":{\"x\":7476,\"y\":4590}},\"oneMetreInPx\":0.23587486042433833}"),
        },
    }

    loadedMapCache = [];
    currentMap = '';

    loadingMap = false;
    currentLoadedImages = -1;
    totalImages = -1;

    // Used for the event
    eventHandlerList_MapChanged: MapChangeHandler[] = [];

    mapChangedEventRun(map: string) {
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
        let n1 = this.currentLoadedImages;
        let n2 = this.totalImages;
        let pc = (100 * n1 / n2).toFixed(2) + '%';

        loadBarMsg.innerHTML = `Cargando: ${pc} (${n1}/${n2})`;
        let loadBar = document.getElementById("loadingBarPercent");
        loadBar.style.width = pc;
    };

    /**
     * Centers the map on the screen.
     * @param mapPosStateObject Translate and Scale to modify
     */
    setDefaultZoom(mapPosStateObject: MapPosState) {
        // Focus entire map on screen

        mapPosStateObject.translate.x = -(this.imageSize.w - innerWidth) / 2;
        mapPosStateObject.translate.y = -(this.imageSize.h - innerHeight) / 2;
        mapPosStateObject.scale = 1;

        mapPosStateObject.zoomAtPosition(
            {
                x: devicePixelRatio * innerWidth / 2,
                y: devicePixelRatio * innerHeight / 2
            },
            innerHeight / this.imageSize.h
        );
    }

    /**
     * Loads the corresponding img tags to the DOM and sets the map to draw.
     * @param mapMeta MapMeta to set the values to.
     * @param map Map id to load.
     * @param mapPosStateObject If this is present, will be set to default zoom.
     * @param globalDraw Draw function to call when loading the map
     */
    load(mapMeta: MapMeta, map: string, mapPosStateObject: MapPosState, globalDraw: Function) {
        if (this.currentMap === map) { return false }

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

                    if (
                        mapLoaderObj.currentLoadedImages ==
                        mapLoaderObj.totalImages
                    ) {
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
    draw(context: CanvasRenderingContext2D, posState: MapPosState) {
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
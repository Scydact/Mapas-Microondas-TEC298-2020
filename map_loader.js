let MapLoader = class {
    mapStruct = {
        azua: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMetaStr: '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1221,"x2Px":7463,"y1Deg":18.5,"y2Deg":18.33333,"y1Px":255,"y2Px":4613,"oneMetreInPx":1.9511393698710089}'
        },

        constanza: {
            elementSize: { w: 520, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMetaStr: '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1289,"x2Px":7507,"y1Deg":19,"y2Deg":18.83333,"y1Px":283,"y2Px":4642,"oneMetreInPx":1.96375716712138}'
        },

        hato_mayor: {
            elementSize: { w: 512, h: 528 },
            gridSize: { w: 17, h: 13 },
            mapMetaStr: '{"x1Deg":69.5,"x2Deg":69.25,"x1Px":1223,"x2Px":7432,"y1Deg":18.833333,"y2Deg":18.666666,"y1Px":189,"y2Px":4552,"oneMetreInPx":1.9551870650091925}'
        },

        jarabacoa: {
            elementSize: { w: 528, h: 520 },
            gridSize: { w: 17, h: 13 },
            mapMetaStr: '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1252,"x2Px":7460,"y1Deg":19.16666,"y2Deg":19,"y1Px":271,"y2Px":4628,"oneMetreInPx":1.9614630420557655}'
        },

        puerto_plata: {
            elementSize: { w: 512, h: 536 },
            gridSize: { w: 18, h: 13 },
            mapMetaStr: '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1342,"x2Px":7543,"y1Deg":19.833333,"y2Deg":19.666666,"y1Px":92,"y2Px":4588,"oneMetreInPx":1.9511866481881994}'
        },
    };

    loadedMaps = [];
    loadedMapsData = {
        azua: [],
        constanza: [],
        hato_mayor: [],
        jarabacoa: [],
        puerto_plata: [],
    };
    currentMap = "";

    loadingMap = false;
    currentLoadedImages = -1;
    totalImages = -1;

    get imageSize() {
        let cs = this.mapStruct[this.currentMap];
        return {
            w: cs.elementSize.w * cs.gridSize.w,
            h: cs.elementSize.h * cs.gridSize.h,
        };
    }

    updateLoadingBar = function () {
        let loadBarMsg = document.getElementById("loadingBarMsg");
        loadBarMsg.innerHTML =
            "Cargando " + this.currentLoadedImages + " / " + this.totalImages;

            let loadBar = document.getElementById("loadingBarPercent");
            let w = 100 * this.currentLoadedImages / this.totalImages;

            loadBar.style.width = w.toString() + "%";
    };

    setDefaultZoom() {
        // Focus entire map on screen
        translatePos.x = -(this.imageSize.w - innerWidth) / 2;
        translatePos.y = -(this.imageSize.h - innerHeight) / 2;
        scale = 1;

        zoomAtPosition(
            innerWidth / 2,
            innerHeight / 2,
            innerHeight / this.imageSize.h
        );
    }



    load(map, doNotDoDefaultZoom) {
        this.currentMap = map;
        mapMeta.loadFromJson(this.mapStruct[map].mapMetaStr);
        mapMeta.loadToGlobal();
        
        if (!doNotDoDefaultZoom) {
            this.setDefaultZoom();
        }

        if (!this.loadedMaps.includes(map)) {

            $("#loadingBarWrapper").removeClass("disabled");
            this.loadingMap = true;
            let gSize = this.mapStruct[map].gridSize;
            this.totalImages = gSize.w * gSize.h;
            this.currentLoadedImages = 0;

            let imageLoaderDiv = document.getElementById("imageLoader");

            for (let i = 0; i < this.totalImages; i++) {
                let img = document.createElement("img");
                img.id = "im_" + map + "_" + i;
                img.src =
                    "maps/" +
                    map +
                    "/image--" +
                    i.toString().padStart(3, "0") +
                    ".jpg";
                imageLoaderDiv.appendChild(img);

                this.loadedMapsData[map][i] = img;
                this.updateLoadingBar();

                let mapLoaderObj = this;
                $(img).one("load", function () {
                    mapLoaderObj.currentLoadedImages++;
                    draw();
                    mapLoaderObj.updateLoadingBar();

                    if (
                        mapLoaderObj.currentLoadedImages ==
                        mapLoaderObj.totalImages
                    ) {
                        console.log("Loading " + map + " complete.");
                        $("#loadingBarWrapper").addClass("disabled");
                        mapLoaderObj.loadingMap = false;
                        mapLoaderObj.loadedMaps.push(map);
                    }
                });
            }
        }
    }

    draw(context) {
        if (true) {
            let imageList = this.loadedMapsData[this.currentMap];
            let elementSize = this.mapStruct[this.currentMap].elementSize;
            let gridSize = this.mapStruct[this.currentMap].gridSize;

            context.save();
            context.translate(translatePos.x, translatePos.y);
            context.scale(scale, scale);
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

    constructor() {
        this.load("jarabacoa");
    }
};

// MapMeta is the map's fixed data points, like
// location and size of the edges.
class MapMeta {
    x1Deg = 0;
    x2Deg = 0;
    x1Px = 0;
    x2Px = 0;
    get xPxLength() {return this.x2Px - this.x1Px;}

    y1Deg = 1;
    y2Deg = 1;
    y1Px = 1;
    y2Px = 1;
    get yPxLength() {return this.y2Px - this.y1Px;}

    oneMetreInPx = 1;

    get slopeXDeg() {return this.x2Deg - this.x1Deg;}
    get slopeYDeg() {return this.y2Deg - this.y1Deg;}

    loadFromSetup() {
        this.x1Deg = parseFloat($("#up-left-long").val());
        this.x2Deg = parseFloat($("#down-right-long").val());
        this.x1Px = parseInt($("#up-left-pos-x").val());
        this.x2Px = parseInt($("#down-right-pos-x").val());

        this.y1Deg = parseFloat($("#up-left-lat").val());
        this.y2Deg = parseFloat($("#down-right-lat").val());
        this.y1Px = parseInt($("#up-left-pos-y").val());
        this.y2Px = parseInt($("#down-right-pos-y").val());

        this.oneMetreInPx = parseFloat($("#one-metre-px").val());
        mapLoader.load($("#map-select").val());
    }

    loadToSetup() {
        $("#map-select").val(this.mapName);
        $("#up-left-long").val(this.x1Deg);
        $("#down-right-long").val(this.x2Deg);
        $("#up-left-pos-x").val(this.x1Px);
        $("#down-right-pos-x").val(this.x2Px);

        $("#up-left-lat").val(this.y1Deg);
        $("#down-right-lat").val(this.y2Deg);
        $("#up-left-pos-y").val(this.y1Px);
        $("#down-right-pos-y").val(this.y2Px);

        $("#one-metre-px").val(this.oneMetreInPx);
        $("#map-select").val(mapLoader.currentMap);
    }
    
    loadFromGlobal() {
        this.x1Deg = x1Deg;
        this.x2Deg = x2Deg;
        this.x1Px = x1Px;
        this.x2Px = x2Px;

        this.y1Deg = y1Deg;
        this.y2Deg = y2Deg;
        this.y1Px = y1Px;
        this.y2Px = y2Px;

        this.oneMetreInPx = oneMetreInPx;
    }

    loadToGlobal() {
        x1Deg = this.x1Deg;
        x2Deg = this.x2Deg;
        x1Px = this.x1Px;
        x2Px = this.x2Px;

        y1Deg = this.y1Deg;
        y2Deg = this.y2Deg;
        y1Px = this.y1Px;
        y2Px = this.y2Px;

        oneMetreInPx = this.oneMetreInPx;

        xPxLength = this.xPxLength;
        yPxLength = this.yPxLength;

        slopeXDeg = this.slopeXDeg;
        slopeYDeg = this.slopeYDeg;
    }

    loadFromJson(str) {
        let json = JSON.parse(str);
        Object.assign(this, json);
    }

    alertJson() {
        let t = JSON.stringify(this);
        alert(t);
    }
}

// This is a helper to save/restore the status of a map
class MapState {
    name = "unnamed";

    // Current zoom/scale
    translatePos = new p(0,0);
    scale = 1;

    // Current map
    map = "jarabacoa";
    version = "1";

    DEBUG_EXIT_WITHOUT_SAVE = false;

    // Current Linelist
    mapLineList = new MapLineList();

    getJsonString() {
        let o = {
            translatePos : this.translatePos,
            scale : this.scale,
            map : this.map,
            version : this.version,
            
            mapLineList : this.mapLineList.toJson()
        };

        return JSON.stringify(o);
    }

    setFromObject(o) {

        this.translatePos = new p(o.translatePos.x, o.translatePos.y);
        this.scale = o.scale;
        this.map = o.map;
        this.version = o.version;
        
        let m = new MapLineList();
        m.parseJson(o.mapLineList);
        this.mapLineList = m;
        return true;
    }

    getFromGlobal() {
        this.translatePos = translatePos;
        this.scale = scale;
        this.map = mapLoader.currentMap;
        this.mapLineList = mapLineList;

        // easy deep clone
        let t = this.getJsonString();
        this.setFromObject(JSON.parse(t));
    }

    setToGlobal() {
        translatePos = this.translatePos;
        scale = this.scale;
        mapLoader.load(this.map, true);
        mapLineList = this.mapLineList;
        mapLineList.node = $("#lineListWrapper")[0];
        mapLineList.updateNode();
        return true;
    }

    setToCookies() {
        if (this.DEBUG_EXIT_WITHOUT_SAVE) {
            return false;
        }
        let value = this.getJsonString();
        window.localStorage.setItem(this.name,value);
        return true;
    }

    getFromCookies() {
        let c = window.localStorage.getItem(this.name);
        if (c == null) {
            return false;
        }
        
        let o = JSON.parse(c);
        if (o.version == null) {
            window.localStorage.clear();
            return false;
        } 
        
        return this.setFromObject(o);
    }
}
// Default values
let x1Deg = 70.75;
let x2Deg = 70.5;
let x1Px = 1250;
let x2Px = 7460;
let xPxLength = x2Px - x1Px;

let y1Deg = 19.16666;
let y2Deg = 19.0;
let y1Px = 270;
let y2Px = 4630;
let yPxLength = y2Px - y1Px;

let oneMetreInPx = 0;

let slopeXDeg = x2Deg - x1Deg;
let slopeYDeg = y2Deg - y1Deg;

let mousePos;
let coordPos;
let snapPos;

let canvas;

let mapMeta;
let mapLoader;
let savedMapState;
let filterColorPicker;

/**
 * Generic point class
 */
class p {
    /**
     * 
     * @param {*} x Point x position
     * @param {*} y Point y position
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return {
            x: this.x,
            y: this.y,
        };
    }

    /**
     * Gives the dot product (x1*x2+y1*y2) of a point.
     * @param {p} p1 
     * @param {p} p2 
     */
    static Dot(p1, p2) {
        return p1.x * p2.x + p1.y * p2.y;
    }

    /**
     * Returns the vector subtraction.
     * @param {p} p1 
     * @param {p} p2 
     */
    static Minus(p1, p2) {
        return new p(
            p1.x - p2.x, 
            p1.y - p2.y
        );
    }

    /**
     * Returns the vector sum.
     * @param {*} p1 
     * @param {*} p2 
     */
    static Plus(p1, p2) {
        return new p(
            p1.x + p2.x,
            p1.y + p2.y
        );
    }

    /**
     * Multiplies x & y by an scalar
     * @param {p} p1 
     * @param {*} mult 
     */
    static ScalarMult(p1, mult) {
        return new p(
            p1.x * mult,
            p1.y * mult
        );
    }

    /**
     * Returns the distance between two points.
     * @param {p} p1 
     * @param {p} p2 
     */
    static Distance(p1, p2) {
        return Math.sqrt(
            (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
        );
    }

    /**
     * Returns the midpoint between two points.
     * @param {p} p1 
     * @param {p} p2 
     */
    static MidPoint(p1, p2) {
        return new p(
            (p1.x + p2.x) / 2,
            (p1.y + p2.y) / 2
        )
    }
}

// Navigation variables
var translatePos = new p(500, 500);

// Canvas nav stuff
var scale = 1.0;
var scaleMultiplier = 0.8;

// Canvas functions
// Get mouse pos in canvas

/**
 * Gets the mouse position on the screen [px]
 * @param {*} canvas
 * @param {p} newPoint
 */
function getMousePos(canvas, newPoint) {
    var rect = canvas.getBoundingClientRect();

    mousePos.x = newPoint.x - rect.left;
    mousePos.y = newPoint.y - rect.top;

    return mousePos;
}

/**
 * Gets the mouse position inside the zoomed canvas [px]
 * To convert to coords, use this and pixelPointToMapPoint() or formattedPixelPointToMapPoint()
 * @param {*} canvas
 * @param {p} newPoint
 */
function getMousePosInMap(canvas, newPoint) {
    var mousePos = getMousePos(canvas, newPoint);

    coordPos = screenToMapPos(mousePos);

    return coordPos;
}

/**
 * Transforms a point on the screen to a point inside the canvas
 * @param {p} pos
 */
function screenToMapPos(pos) {
    return new p(
        (pos.x - translatePos.x) / scale,
        (pos.y - translatePos.y) / scale
    );
}

/**
 * Transforms a point inside the canvas to a point on the screen
 * @param {p} pos
 */
function mapToScreenPos(pos) {
    return new p(
        scale * pos.x + translatePos.x,
        scale * pos.y + translatePos.y
    );
}

// Zoom at x/y
/**
 * Changes translatePos and scale to a new value zoomed at screen position  (x, y)
 * @param {p} x
 * @param {p} y
 * @param {*} newScale
 */
function zoomAtPosition(x, y, newScale) {
    translatePos.x = x - (newScale / scale) * (x - translatePos.x);
    translatePos.y = y - (newScale / scale) * (y - translatePos.y);
    scale = newScale;
}

/**
 * Converts a canvas point [px] to its coordenate value [decimal]
 * @param {p} point
 */
function pixelPointToMapPoint(point) {
    var xDeg = (slopeXDeg * (point.x - x1Px)) / xPxLength + x1Deg;
    var yDeg = (slopeYDeg * (point.y - y1Px)) / yPxLength + y1Deg;
    return { x: xDeg, y: yDeg };
}

/**
 * Converts a canvas point [px] to its coordenate value [sexagecimal]
 * @param {p} point
 */
function formattedPixelPointToMapPoint(point) {
    var p = pixelPointToMapPoint(point);
    return { x: decimalToTime(p.x), y: decimalToTime(p.y) };
}

// Forms load/save
/**
 * Convert decimal value to a sexagecimal string
 * @param {*} time
 */
function decimalToTime(time) {
    let x = Math.abs(time);
    let sign = Math.sign(time);

    let minutes = (x - Math.floor(x)) * 60;
    let seconds = (minutes - Math.floor(minutes)) * 60;

    let signChar = sign == -1 ? "-" : "";

    return (
        signChar +
        Math.floor(x).toString() +
        "°" +
        Math.floor(minutes).toString() +
        "'" +
        seconds.toFixed(2).toString() +
        "''"
    );
}



// Filter stuff
function updateFilterColor() {
    document.querySelector('#colorFilter').style.background = filterColorPicker.toRGBAString();
}
function updateFilterMode() {
    document.querySelector('#colorFilter').style.mixBlendMode = $('#filterMode').val();
}



// Init
$(document).ready(function () {
    mousePos = new p(-1, -1);
    coordPos = new p(-1, -1);
    snapPos = new p(-1, -1);

    mapMeta = new MapMeta();
    mapLoader = new MapLoader();
    savedMapState = new MapState();

    // Color 
    filterColorPicker = new JSColor('#filterColor', {
        preset: 'large',
        position: 'right',
        // previewPosition: 'right',
        onInput: "updateFilterColor()",
        value: 'rgba(255,0,0,0)'
    });
    // triggers 'onInput' and 'onChange' on all color pickers when they are ready
    jscolor.trigger('input change');

    $('#filterMode').on('change', updateFilterMode);
    updateFilterMode();

    // Canvas setup
    canvas = document.getElementById("renderCanvas");

    // Setup
    savedMapState.name = "save_map_state";
    let doLoad = savedMapState.getFromCookies();
    savedMapState.setToGlobal();

    if (!doLoad) {
        mapLoader.setDefaultZoom();
    }

    $(window).resize(function () {
        draw();
    });
});

// On window close
window.onbeforeunload = function (event) {
    //form saving request
    //event.returnValue = "The form is being saved. Please wait";
    savedMapState.getFromGlobal();
    savedMapState.setToCookies();
};


// Aux functions unrelated
function titleCase(string) {
    var sentence = string.toLowerCase().split(" ");
    for(var i = 0; i< sentence.length; i++){
       sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
 
 return sentence.join(" ");
 }

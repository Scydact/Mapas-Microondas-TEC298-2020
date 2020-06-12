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

let mousePos = {x: -1, y: -1};
let coordPos = {x: -1, y: -1};

let canvas;

let mapMeta;
let mapLoader;
let savedMapState;


// Navigation variables
var translatePos = {
    x: 500,
    y: 500,
};

// Canvas nav stuff
var scale = 1.0;
var scaleMultiplier = 0.8;

// Default zoom
var defaultZoom = {
    translatePos : {x: 0, y: 0},
    scale : 1.0
};


// Canvas functions
// Get mouse pos in canvas
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();

    mousePos.x = evt.clientX - rect.left;
    mousePos.y = evt.clientY - rect.top;

    return mousePos;
}

function getMousePosInMap(canvas, evt) {
    var mousePos = getMousePos(canvas, evt);
    
    coordPos = screenToMapPos(mousePos);

    return coordPos;
}

function screenToMapPos(pos) {
    return {
        x: (pos.x - translatePos.x) / scale,
        y: (pos.y - translatePos.y) / scale
    };
}

function mapToScreenPos(pos) {
    return {
        x : (scale * pos.x) + translatePos.x,
        y : (scale * pos.y) + translatePos.y
    };
}

// Zoom at x/y
function zoomAtPosition(x, y, newScale) {
    translatePos.x = x - (newScale / scale) * (x - translatePos.x);
    translatePos.y = y - (newScale / scale) * (y - translatePos.y);
    scale = newScale;
}

function pixelPointToMapPoint(point) {
    var xDeg = (slopeXDeg * (point.x - x1Px)) / xPxLength + x1Deg;
    var yDeg = (slopeYDeg * (point.y - y1Px)) / yPxLength + y1Deg;
    return {x: xDeg, y: yDeg};
}

function formattedPixelPointToMapPoint(point) {
    var p = pixelPointToMapPoint(point);
    return {x: decimalToTime(p.x), y:decimalToTime(p.y)};
}


// Forms load/save

// Convert decimal value to "time" value
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


// Cookie save/load functions
function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}

// Init
$(document).ready(function () {
    mapMeta = new MapMeta();
    mapLoader = new MapLoader();
    savedMapState = new MapState();

    canvas = document.getElementById("renderCanvas");

    // Setup
    savedMapState.name = "save_map_state";
    savedMapState.getFromCookies();
    savedMapState.setToGlobal();

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

let settingsOpen = false;
let linesPaneOpen = false;
let pointsPaneOpen = false;

let msgBar;
let statusBar;
let clickMode;
let mouseBar;

let temp;

// only for IntelliSense, as this is be overriden later
let mapLineList = new MapLineList();
let mapPointList = new MapPointList();

// Canvas nav stuff
var startDragOffset = {};
var mouseDown = false;
var dragging = false;
var modifier = {
    shift: false,
    ctrl: false,
    alt: false,
};

// Touch
var touchZooming = 0;
var touchZoomingDistance = 0;
var touchScaleMultiplier = 1/100;

// Other stuff
var hoverDistance = 7;

let MessagePane = class {
    constructor() {
        this.node = document.getElementById('msgWrapper');
    }

    clear() {
        this.node.innerHTML = '';
        this.node.classList.add('disabled');
    }

    setText(txt) {
        let splitList = txt.split("\n");
        let T = this;

        this.clear();
        splitList.forEach((t) => {
            let p = document.createElement('p');
            let tnode = document.createTextNode(t);
            p.appendChild(tnode);
            this.node.appendChild(p);
        });
        this.node.classList.remove('disabled');
    }
};

let StatusPane = class {
    constructor() {
        this.node = document.getElementById('statusBarWrapper');
        this.p = document.getElementById('statusBar');
    }

    clear() {
        this.p.innerHTML = '';
        this.node.classList.add('disabled');
    }

    setText(txt) {
        this.p.innerHTML = txt;
        this.node.classList.remove('disabled');
    }
};

let MousePane = class {
    constructor() {
        this.node = document.getElementById('mouseMsg');
    }

    clear() {this.node.innerHTML = ''}

    setText(txt) {
        let splitList = txt.split("\n");
        let T = this;

        this.clear();
        splitList.forEach((t) => {
            let p = document.createElement('p');
            let tnode = document.createTextNode(t);
            p.appendChild(tnode);
            this.node.appendChild(p);
        });
    }

    setNode(n) {
        this.clear();
        this.node.appendChild(n);
    }

    setPosition(p) {
        this.node.style.top = p.y;
        this.node.style.left = p.x;
    }
};

let ClickMode = class {
    constructor() {
        this.mode = '';
        this.oldMode = '';
        this.updateUITools();
    }

    clear() {
        this.oldMode = this.mode;
        this.mode = '';
        msgBar.clear();
        this.updateUITools(null);
    }

    set(mode) {
        this.oldMode = this.mode;
        this.mode = mode;
        this.updateUITools(mode);
    }

    deselectUITools() {
        $('.toolBtn').removeClass('active');
        $(canvas).removeClass('crosshair');
    }

    updateUITools(mode) {
        this.deselectUITools();
        switch (mode) {
            case 'setLinePoint1':
            case 'setLinePoint2':
                $('#toolLine').addClass('active');
                $(canvas).addClass('crosshair');
                break;

            case 'setPointMarker':
                $('#toolPoint').addClass('active');
                $(canvas).addClass('crosshair');
                break;

            default:
                $('#toolPointer').addClass('active');
        }
    }
};

// UI Handlers
/**
 * On mouse move
 * @param {p} newPos
 */
function UIHandler_mousemove(newPos) {
    // move by drag
    if (mouseDown) {
        dragging = true;
        translatePos.x = newPos.x - startDragOffset.x;
        translatePos.y = newPos.y - startDragOffset.y;
        draw(scale, translatePos);
    }
    // Set mouse pointer to 'move' if dragging
    if (dragging) {
        $(canvas).addClass('move');
    } else {
        $(canvas).removeClass('move');
    }

    // Update mousePos / coordPos global vars
    getMousePos(canvas, newPos);
    getMousePosInMap(canvas, newPos);

    // Determine lists hover
    let mapLists = [mapLineList, mapPointList];
    let outLists = [];
    for (let i = mapLists.length; i--; ) {
        let list = mapLists[i];
        outLists[i] = list.getCloseToScreenPoint(mousePos, hoverDistance);
        list.list.forEach((e) => e.hover = false);
        if (outLists[i].length > 0) {outLists[i][0].hover = true}
        list.updateNode();
    }


    // Display tooltip
    var formattedPosition = formattedPixelPointToMapPoint(coordPos);
    var msg = `Pos: (${formattedPosition.x}, ${formattedPosition.y})`;
    if (clickMode.mode == '') {
        if (outLists[0].length > 0) {
            msg += `\nLinea #${outLists[0][0].index + 1}: ${outLists[0][0].getDistanceMetre().toFixed(2)}m`
        }
        if (outLists[1].length > 0) {
            let puntoSel = outLists[1][0];
            let name = (puntoSel.name) ? puntoSel.name : '#' + (puntoSel.index+1).toString();
            let pos = formattedPixelPointToMapPoint(puntoSel.p);
            msg += `\nPunto ${name} @(${pos.x}, ${pos.y})`;
        }
    }
    else if (clickMode.mode == 'setLinePoint2') {
        msg += `\nDistancia: ${temp.mapline.templine.getDistanceMetre().toFixed(2)}m`
    }
    mouseBar.setText(msg);
    mouseBar.setPosition(mousePos);

    draw();
}

/**
 * On mouse up (equivalent to clicking)
 * @param {event} newPos
 */
function UIHandler_mouseup(newPos) {
    var canvas = document.getElementById('renderCanvas');
    var context = canvas.getContext('2d');
    console.log('Click!');

    // Update mousePos / coordPos global vars, for touch compat
    getMousePos(canvas, newPos);
    getMousePosInMap(canvas, newPos);

    if (!dragging) {
        switch (clickMode.mode) {
            // debug stuff
            case 'setLeftUpPos':
                $('#up-left-pos-x').val(Math.round(coordPos.x));
                $('#up-left-pos-y').val(Math.round(coordPos.y));
                clickMode.clear();
                break;
            case 'setRightDownPos':
                $('#down-right-pos-x').val(Math.round(coordPos.x));
                $('#down-right-pos-y').val(Math.round(coordPos.y));
                clickMode.clear();
                break;
            case 'setMetreDefPoint1':
                clickMode.set('setMetreDefPoint2');
                msgBar.setText('Haga click en el 2do punto de la regla.');

                temp.mapline.point1 = screenToMapPos(mousePos);
                break;
            case 'setMetreDefPoint2':
                var pos = screenToMapPos(mousePos);
                var dist = Math.sqrt(
                    (pos.x - temp.mapline.point1.x) ** 2 +
                        (pos.y - temp.mapline.point1.y) ** 2
                );

                clickMode.clear();
                msgBar.clear();
                var i = parseInt(
                    prompt('Cuanto media ese punto (en metros)?', '900')
                );
                $('#one-metre-px').val(dist / i);
                break;

            // Tools
            case 'setLinePoint1':
                temp.mapline.point1 = coordPos;//screenToMapPos(mousePos);
                temp.mapline.templine.p1 = temp.mapline.point1;
                clickMode.set('setLinePoint2');
                msgBar.setText('Click en el 2do punto de la linea');
                break;
            case 'setLinePoint2':
                //var pos = screenToMapPos(mousePos);
                mapLineList.add(
                    new MapLine(temp.mapline.point1, coordPos, {
                        color: '#f00',
                        width: 2,
                    })
                );
                clickMode.clear();
                msgBar.clear();
                break;
            case 'setPointMarker':
                mapPointList.add(new MapPoint(coordPos));
                clickMode.clear();
                msgBar.clear();
                break;

            // With Pointer mode 
            default:
                // mapLines selection
                let mapLists = [mapLineList, mapPointList];

                for (i = mapLists.length; i--; ) { // sweet inverse loop i've found on the internet
                    let list = mapLists[i];
                    let elements = list.getCloseToScreenPoint(mousePos, hoverDistance);
                    if (!modifier.shift) {list.deselectAll()}
                    if (elements.length > 0) {elements[0].active = !elements[0].active}
                    list.updateNode();
                }
        }
    }

    mouseDown = false;
    dragging = false;
    draw();
}

// On doc ready
$(window).ready(function () {
    // Init stuff
    msgBar = new MessagePane();
    statusBar = new StatusPane();
    clickMode = new ClickMode();
    mouseBar = new MousePane();

    // This part is now managed by the savedMapState
    // mapLineList = new MapLineList();
    // mapLineList.node = $('#lineListWrapper')[0];
    temp = {
        mapline: {
            point1: new p(0, 0),
            templine: new MapLine(new p(0, 0), new p(1, 1), {
                color: 'red',
                width: 1,
            }),
        },
    };

    // Keypress
    $(document).keyup(function (e) {
        switch (e.key) {
            case 'Shift':
                modifier.shift = false;
                break;
            case 'Control':
                modifier.ctrl = false;
                break;
            case 'Alt':
                modifier.alt = false;
                break;

            // Other shortcuts
            case 'Escape':
                clickMode.clear();
                break;
            case 'Delete':
                mapLineList.deleteActive();
                mapLineList.updateNode();

                mapPointList.deleteActive();
                mapPointList.updateNode();

                break;


            case 'L':
            case 'l':
                createLineFun();
                break;

            case 'P':
            case 'p':
                createPointFun();
                break;

        }
        draw();
    });

    $(document).keydown(function (e) {
        switch (e.key) {
            case 'Shift':
                modifier.shift = true;
                break;
            case 'Control':
                modifier.ctrl = true;
                break;
            case 'Alt':
                modifier.alt = true;
                break;
        }
    });

    // Zoom buttons
    $('#plus').on('click', function () {
        //scale /= scaleMultiplier;
        zoomAtPosition(
            canvas.width / 2,
            canvas.height / 2,
            scale / scaleMultiplier
        );
        draw();
    });

    $('#minus').on('click', function () {
        //scale *= scaleMultiplier;
        zoomAtPosition(
            canvas.width / 2,
            canvas.height / 2,
            scale * scaleMultiplier
        );
        draw();
    });

    $('#reset').on('click', function () {
        //scale *= scaleMultiplier;
        mapLoader.setDefaultZoom();
        draw();
    });

    // UI Buttons
    // Config
    $('#openSettings').on('click', function () {
        settingsOpen = !settingsOpen;
        if (settingsOpen) {
            mapMeta.loadToSetup();
            $('#settingsWrapper').removeClass('disabled');
        } else {
            $('#settingsWrapper').addClass('disabled');
        }
    });

    $('#map-select').on('change', function () {
        let m = $('#map-select').val();
        mapLoader.load(m);
        draw();
    });

    $('#up-left-set-btn').on('click', function () {
        clickMode.set('setLeftUpPos');
        msgBar.setText('Haga click en el limite superior izquierdo del mapa.');
    });

    $('#down-right-set-btn').on('click', function () {
        clickMode.set('setRightDownPos');
        msgBar.setText('Haga click en el limite inferior derecho del mapa.');
    });

    $('#set-ok-btn').on('click', function () {
        mapMeta.loadFromSetup();
        mapMeta.loadToGlobal();
        settingsOpen = false;
        $('#settingsWrapper').addClass('disabled');
    });

    $('#set-cancel-btn').on('click', function () {
        settingsOpen = false;
        $('#settingsWrapper').addClass('disabled');
    });

    $('#dev-json-vals').on('click', function () {
        mapMeta.alertJson();
    });

    $('#one-metre-px-def').on('click', function () {
        clickMode.set('setMetreDefPoint1');
        msgBar.setText('Haga click en el 1er punto de la regla.');
    });



    // Toolbox buttons
    $('#toolPointer').on('click', (e) => clickMode.clear());
    $('#toolLine').on('click', createLineFun);
    $('#toolPoint').on('click', createPointFun);

    // Lines
    //$('#openLinePane').on('dblclick', createLineFun);
    function createLineFun() {
        clickMode.set('setLinePoint1');
        msgBar.setText('Click en el 1er punto de la linea');
    }
    function deleteLineFun() {
        mapLineList.deleteActive();
        mapLineList.updateNode();
        draw();
    }
    $('#openLinePane').on('click', function () {
        linesPaneOpen = !linesPaneOpen;
        if (linesPaneOpen) {
            $('#linesWrapper').removeClass('disabled');
        } else {
            $('#linesWrapper').addClass('disabled');
        }
    });
    $('#createLine').on('click', createLineFun);
    $('#deleteLine').on('click', deleteLineFun);


    // Point
    function createPointFun() {
        clickMode.set('setPointMarker');
        msgBar.setText('Click en un punto');
    }
    function deletePointFun() {
        mapPointList.deleteActive();
        mapPointList.updateNode();
        draw();
    }
    $('#toolPoint').on('click', createPointFun);
    $('#openPointPane').on('click', function () {
        pointsPaneOpen = !pointsPaneOpen;
        if (pointsPaneOpen) {
            $('#pointsWrapper').removeClass('disabled');
        } else {
            $('#pointsWrapper').addClass('disabled');
        }
    });
    $('#createPoint').on('click', createPointFun);
    $('#deletePoint').on('click', deletePointFun);






    // Redraw on resize
    $(window).resize(function () {
        draw();
    });

    // Canvas functionality
    // Mouse down (click downstroke)
    function mouseEvtToPos(evt) {
        return new p(evt.clientX, evt.clientY);
    }

    $(canvas).on('mousedown', function (evt) {
        mouseDown = true;

        startDragOffset.x = evt.clientX - translatePos.x;
        startDragOffset.y = evt.clientY - translatePos.y;
    });

    $(canvas).on('mousemove', (e) => UIHandler_mousemove(mouseEvtToPos(e)));
    $(canvas).on('mouseup', (e) => UIHandler_mouseup(mouseEvtToPos(e)));

    // Cancel mouse movements
    $(canvas).on('mouseover', function (evt) {
        mouseDown = false;
        dragging = false;
    });
    $(canvas).on('mouseout', function (evt) {
        mouseDown = false;
        dragging = false;
    });


    // Touch support
    function touchEvtToPos(evt) {
        let x = evt.originalEvent.changedTouches[0];
        return new p(x.clientX, x.clientY);
    }
    $(canvas).on('touchstart', function (e) {
        e.preventDefault(); //sets preventDefault tag;
        $(canvas).focus(); // Avoids very weird glitches related to random clicking 
        let oe = e.originalEvent;

        if (oe.touches.length == 1) {
            mouseDown = true;
            let newPos = touchEvtToPos(e);
            getMousePosInMap(canvas, newPos); // Update mousepos
    
            startDragOffset.x = newPos.x - translatePos.x;
            startDragOffset.y = newPos.y - translatePos.y;
        }
        else if (oe.touches.length == 2) {
            touchZooming = 2;
            mouseDown = false;
            dragging = false;

            let t1 = oe.touches[0];
            let t2 = oe.touches[1];
            let p1 = new p(t1.clientX, t1.clientY);
            let p2 = new p(t2.clientX, t2.clientY);
            touchZoomingDistance = p.Distance(p1, p2); 
        }

        draw();
    });

    $(canvas).on('touchmove', (e) => {
        e.preventDefault(); //sets preventDefault tag;
        let oe = e.originalEvent;

        if (oe.touches.length == 1) {
            UIHandler_mousemove(touchEvtToPos(e));
        }
        else if (oe.touches.length >= 2) {
            let t1 = oe.touches[0];
            let t2 = oe.touches[1];
            let p1 = new p(t1.clientX, t1.clientY);
            let p2 = new p(t2.clientX, t2.clientY);
            let d = p.Distance(p1, p2);

            let centerPoint = p.MidPoint(p1, p2);

            let dx = d - touchZoomingDistance;
            let scaleMult = 1;
            let threshold = 2;
            let scaledDx = Math.abs(dx*touchScaleMultiplier);
            if (dx > 0) {
                scaleMult = 1 + scaledDx;
            }
            else if (dx < 0) {
                scaleMult = 1 / (1 + scaledDx);
            }
            // if (dx < -threshold) {
            //     scaleMult = scaleMultiplier;
            //     console.log(`Zooming out: ${d} : ${dx}`);
            // }
            // else if (dx > threshold) {
            //     scaleMult = 1 / scaleMultiplier;
            //     console.log(`Zooming in: ${d} : ${dx}`);
            // }
            // else {
            //     console.log(`Not zooming`);
            // }
            zoomAtPosition(centerPoint.x, centerPoint.y, scale * scaleMult);
            draw();

            touchZoomingDistance = d; // save to previous state;
        }
    });
    $(canvas).on('touchend', (e) => {//touchend is registered as a mouse up somewhere else????
        e.preventDefault();
        if (touchZooming) {
            touchZooming--; 
            return;
        }
        
        UIHandler_mouseup(mousePos);
    }); 

    // Cancel mousedown


    // Wheel zooming
    canvas.addEventListener('wheel', function (e) {
        // jquery is broken with wheel?
        e.preventDefault();

        // calculate scale direction 6 new scale value
        let scaleMult = e.deltaY > 0 ? scaleMultiplier : 1 / scaleMultiplier;
        zoomAtPosition(e.offsetX, e.offsetY, scale * scaleMult);
        draw();
    });
});

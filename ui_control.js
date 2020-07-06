let msgBar;
let statusBar;
let clickMode;
let mouseBar;
let editPane;

let temp;

// only for IntelliSense, as this is be overriden later
// TODO: Do something with all these important global variables scrambled around. Put them all inside 1 unified object or something.
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
var snapEnabled = true;

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

let EditPane = class {
    // Order is the same as mapLists
    // TODO: Unify mapList so it doesn't need to be rebuilt every single time it needs to be called.
    active = []

    constructor() {
        this.wrapperNode = document.getElementById('editionWrapper');
        this.contentNode = document.getElementById('editionContentWrapper');
    }

    clear() {this.contentNode.innerHTML = ''}

    updateActive() {
        let mapLists = [mapLineList, mapPointList];
        for (let i = mapLists.length; i--; ) {
            let list = mapLists[i];
            editPane.active[i] = list.getActive();
        }
        editPane.updateNode();
    }

    updateNode() {
        /**
         * Active order:
         * 0. Lines
         * 1. Points
         */

        this.clear()

         // only lines
        if (this.active[0].length && !this.active[1].length) {
            this.active[0][0].updateEditNode(this.contentNode);
        }
        else if (this.active[1].length && !this.active[0].length) {
            this.active[1][0].updateEditNode(this.contentNode);
        }
    }

}

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
            case 'setTopographicPoint':
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

    /**
     * outList contents: 
     * 0: mapLineList
     * 1: mapPointList
     */
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
            let currPoint = outLists[1][0];
            let name = (currPoint.name) ? currPoint.name : '#' + (currPoint.index+1).toString();
            let pos = formattedPixelPointToMapPoint(currPoint.p);
            msg += `\nPunto ${name} @(${pos.x}, ${pos.y})`;
        }
    }
    else if (clickMode.mode == 'setLinePoint2') {
        msg += `\nDistancia: ${temp.mapline.templine.getDistanceMetre().toFixed(2)}m`
    }
    else if (clickMode.mode == 'setTopographicPoint') {
        let p1 = temp.topo.mapLine.p1;
        let p2 = temp.topo.mapLine.getPointProjection(coordPos);
        let d = p.Distance(p1, p2) / oneMetreInPx;

        msg += `\n[Punto topografico] d = ${d.toFixed(2)} m`;
    }

    if (clickMode.mode != '') {
        // Set snapPos (priority => point, line)
        if (snapEnabled) {
            if (outLists[1].length > 0) {
                let currPoint = outLists[1][0];
                snapPos = mapToScreenPos(currPoint.p);
                msg += `\n[Snap] punto`;
            }
            else if (outLists[0].length > 0) {
                let currLine = outLists[0][0];
                let mapPoint = currLine.getPointProjection(coordPos);
                snapPos = mapToScreenPos(mapPoint);
                msg += `\n[Snap] linea`;
            } else {
                snapPos = mousePos;
            }
        } else {
            snapPos = mousePos;
        }
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

                temp.mapline.point1 = screenToMapPos(snapPos);
                break;
            case 'setMetreDefPoint2':
                var pos = screenToMapPos(snapPos);
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
                temp.mapline.point1 = screenToMapPos(snapPos);
                temp.mapline.templine.p1 = temp.mapline.point1;
                clickMode.set('setLinePoint2');
                msgBar.setText('Click en el 2do punto de la linea');
                break;
            case 'setLinePoint2':
                mapLineList.add(
                    new MapLine(temp.mapline.point1, screenToMapPos(snapPos), {
                        color: '#f00',
                        width: 2,
                    })
                );
                clickMode.clear();
                msgBar.clear();
                break;
            case 'setPointMarker':
                mapPointList.add(new MapPoint(screenToMapPos(snapPos)));
                clickMode.clear();
                msgBar.clear();
                break;

            case 'setTopographicPoint':
                var hTxt = prompt('Altura de punto: ', '');
                if (hTxt) {
                    var h = parseFloat(hTxt);
                    temp.topo.add(screenToMapPos(snapPos), h);
                }
                break;

            // With Pointer mode 
            default:
                // mapList selection
                let mapLists = [mapLineList, mapPointList];

                for (i = mapLists.length; i--; ) { // sweet inverse loop i've found on the internet
                    let list = mapLists[i];
                    let elements = list.getCloseToScreenPoint(mousePos, hoverDistance);
                    if (!modifier.shift) {list.deselectAll()}
                    if (elements.length > 0) {elements[0].active = !elements[0].active}
                    list.updateNode();

                    // Update editpane inner list
                    editPane.active[i] = list.getActive();
                }

                // Update editpane
                editPane.updateNode();
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
    editPane = new EditPane();

    editPane.updateActive();

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
        switch (e.key.toUpperCase()) {
            case 'SHIFT':
                modifier.shift = false;
                break;
            case 'CONTROL':
                modifier.ctrl = false;
                break;
            case 'ALT':
                modifier.alt = false;
                break;

            // Other shortcuts
            case 'ESCAPE':
                clickMode.clear();
                break;
            case 'DELETE':
                mapLineList.deleteActive();
                mapLineList.updateNode();

                mapPointList.deleteActive();
                mapPointList.updateNode();

                break;


            case 'L':
                mapLineList.toolBox.createElement();
                break;

            case 'P':
                mapPointList.toolBox.createElement();
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
    // Generic Pane functions
    function closeAllPanes() {
        $('#settingsWrapper').addClass('disabled');
        $('#linesWrapper').addClass('disabled');
        $('#pointsWrapper').addClass('disabled');
        $('#editionWrapper').addClass('disabled');
    }
    function togglePane(selector) {
        let j = $(selector);
        if (j.hasClass('disabled')) {
            closeAllPanes();
            j.removeClass('disabled');
        }
        else {
            closeAllPanes();
        }
    }

    // Config
    $('#openSettings').on('click', function () {
        mapMeta.loadToSetup();
        $('#snapCheckbox').prop('checked', snapEnabled);
        togglePane('#settingsWrapper');
    });

    $('#map-select').on('change', function () {
        let m = this.value;
        mapLoader.load(m);
        draw();
    });

    $('#snapCheckbox').on('change', function() {
        snapEnabled = this.checked;
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
        $('#settingsWrapper').addClass('disabled');
    });

    $('#set-cancel-btn').on('click', function () {
        $('#settingsWrapper').addClass('disabled');
    });

    $('#dev-json-vals').on('click', function () {
        mapMeta.alertJson();
    });

    $('#one-metre-px-def').on('click', function () {
        clickMode.set('setMetreDefPoint1');
        msgBar.setText('Haga click en el 1er punto de la regla.');
    });


    // Edit object pane
    $('#openEditionPane').on('click', function () {
        togglePane('#editionWrapper');
    });




    // Toolbox buttons
    $('#toolPointer').on('click', (e) => clickMode.clear());
    $('#toolLine').on('click', () => mapLineList.toolBox.createElement());
    $('#toolPoint').on('click', () => mapPointList.toolBox.createElement());


    // Lines
    //$('#openLinePane').on('dblclick', createLineFun);
    $('#openLinePane').on('click', function () {
        togglePane('#linesWrapper');
    });
    mapLineList.updateToolNode(document.querySelector('#lineListButtonWrapper'));

    // Point
    $('#openPointPane').on('click', function () {
        togglePane('#pointsWrapper');
    });
    mapPointList.updateToolNode(document.querySelector('#pointListButtonWrapper'));




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

    $('.toolBtn').on('touchend', (e) => $(canvas).focus());

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

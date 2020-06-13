let settingsOpen = false;
let linesPaneOpen = false;
let msgBar;
let statusBar;
let clickMode;

let temp;
let mapLineList;

// Canvas nav stuff
var startDragOffset = {};
var mouseDown = false;
var dragging = false;
var modifier = {
    shift: false,
    ctrl: false,
    alt: false,
};

let ClickMode = class {
    constructor() {
        this.clickMode = "";
        this.oldClickMode = "";
    }
    get mode() {
        return this.clickMode;
    }

    getCanvas() {
        return document.getElementById("renderCanvas");
    }

    clear() {
        this.clickMode = "";
        msgBar.clear();
    }

    set(mode) {
        this.clickMode = mode;
    }
};

let MessagePane = class {
    constructor() {
        this.text = "";
        this.node = document.getElementById("msgWrapper");
    }

    clear() {
        this.node.innerHTML = "";
        this.node.classList.add("disabled");
    }

    setText(txt) {
        this.clear();
        this.text = txt;
        let p = document.createElement("p");
        let t = document.createTextNode(txt);
        p.appendChild(t);
        this.node.appendChild(p);
        this.node.classList.remove("disabled");
    }
};

let StatusPane = class {
    constructor() {
        this.text = "";
        this.node = document.getElementById("statusBarWrapper");
        this.p = document.getElementById("statusBar");
    }

    clear() {
        this.p.innerHTML = "";
        this.node.classList.add("disabled");
    }

    setText(txt) {
        this.p.innerHTML = txt;
        this.node.classList.remove("disabled");
    }
};

// On doc ready
$(window).ready(function () {
    // Init stuff
    msgBar = new MessagePane();
    statusBar = new StatusPane();
    clickMode = new ClickMode();

    // This part is now managed by the savedMapState
    // mapLineList = new MapLineList();
    // mapLineList.node = $("#lineListWrapper")[0];
    temp = {
        mapline: {
            point1: new p(0,0),
            templine: new MapLine(new p(0,0), new p(1,1), {color: 'red', width: 1}),
        },
    };

    // Keypress
    $(document).keyup(function (e) {
        switch (e.key) {
            case "Escape":
                clickMode.clear();
                break;
            case "Shift":
                modifier.shift = false;
                break;
            case "Control":
                modifier.ctrl = false;
                break;
            case "Alt":
                modifier.alt = false;
                break;
        }
    });

    $(document).keydown(function (e) {
        switch (e.key) {
            case "Shift":
                modifier.shift = true;
                break;
            case "Control":
                modifier.ctrl = true;
                break;
            case "Alt":
                modifier.alt = true;
                break;
        }
    });

    // Zoom buttons
    $("#plus").on("click", function () {
        //scale /= scaleMultiplier;
        zoomAtPosition(
            canvas.width / 2,
            canvas.height / 2,
            scale / scaleMultiplier
        );
        draw();
    });

    $("#minus").on("click", function () {
        //scale *= scaleMultiplier;
        zoomAtPosition(
            canvas.width / 2,
            canvas.height / 2,
            scale * scaleMultiplier
        );
        draw();
    });

    $("#reset").on("click", function () {
        //scale *= scaleMultiplier;
        mapLoader.setDefaultZoom();
        draw();
    });

    // UI Buttons
    // Config
    $("#openSettings").on("click", function () {
        settingsOpen = !settingsOpen;
        if (settingsOpen) {
            mapMeta.loadToSetup();
            $("#settingsWrapper").removeClass("disabled");
        } else {
            $("#settingsWrapper").addClass("disabled");
        }
    });

    $("#map-select").on("change", function () {
        let m = $("#map-select").val();
        mapLoader.load(m);
        draw();
    });

    $("#up-left-set-btn").on("click", function () {
        clickMode.set("setLeftUpPos");
        msgBar.setText("Haga click en el limite superior izquierdo del mapa.");
    });

    $("#down-right-set-btn").on("click", function () {
        clickMode.set("setRightDownPos");
        msgBar.setText("Haga click en el limite inferior derecho del mapa.");
    });

    $("#set-ok-btn").on("click", function () {
        mapMeta.loadFromSetup();
        mapMeta.loadToGlobal();
        settingsOpen = false;
        $("#settingsWrapper").addClass("disabled");
    });

    $("#set-cancel-btn").on("click", function () {
        settingsOpen = false;
        $("#settingsWrapper").addClass("disabled");
    });

    $("#dev-json-vals").on("click", function () {
        mapMeta.alertJson();
    });

    $("#one-metre-px-def").on("click", function () {
        clickMode.set("setMetreDefPoint1");
        msgBar.setText("Haga click en el 1er punto de la regla.");
    });

    // Lines
    function createLineFun() {
        clickMode.set("setLinePoint1");
        msgBar.setText("Click en el 1er punto de la linea");
    }
    $("#openLinePane").on("dblclick", createLineFun);
    $("#createLine").on("click", createLineFun);

    $("#openLinePane").on("click", function () {
        linesPaneOpen = !linesPaneOpen;
        if (linesPaneOpen) {
            $("#linesWrapper").removeClass("disabled");
        } else {
            $("#linesWrapper").addClass("disabled");
        }
    });

    function deleteLineFun() {
        mapLineList.deleteActive();
        mapLineList.updateNode();
    }
    $("#deleteLine").on("click", deleteLineFun);

    // Redraw on resize
    $(window).resize(function () {
        draw();
    });

    // Canvas functionality
    // Mouse down (click downstroke)
    $(canvas).on("mousedown", function (evt) {
        mouseDown = true;

        startDragOffset.x = evt.clientX - translatePos.x;
        startDragOffset.y = evt.clientY - translatePos.y;
    });

    // Mousemove
    $(canvas).on("mousemove", function (evt) {
        if (mouseDown) {
            dragging = true;
            translatePos.x = evt.clientX - startDragOffset.x;
            translatePos.y = evt.clientY - startDragOffset.y;
            draw(scale, translatePos);
        }

        // Set mouse pointer
        if (dragging) {
            $(canvas).addClass("grabbing");
        } else {
            $(canvas).removeClass("grabbing");
        }

        // Draw data on mouse move
        var currentMousePos = getMousePos(canvas, evt);
        var zoomedMousePos = getMousePosInMap(canvas, evt);

        var message =
            currentMousePos.x +
            "," +
            currentMousePos.y +
            "\n Translate: " +
            translatePos.x +
            ", " +
            translatePos.y +
            "\n Scale: " +
            scale +
            "\n Pos (inside)" +
            zoomedMousePos.x +
            ", " +
            zoomedMousePos.y;
        statusBar.setText(message);
        draw();
    });

    // Eqv to Click
    $(canvas).on("mouseup", function (evt) {
        var canvas = document.getElementById("renderCanvas");
        var context = canvas.getContext("2d");

        if (!dragging) {
            switch (clickMode.mode) {
                case "setLeftUpPos":
                    $("#up-left-pos-x").val(Math.round(coordPos.x));
                    $("#up-left-pos-y").val(Math.round(coordPos.y));
                    clickMode.clear();
                    break;
                case "setRightDownPos":
                    $("#down-right-pos-x").val(Math.round(coordPos.x));
                    $("#down-right-pos-y").val(Math.round(coordPos.y));
                    clickMode.clear();
                    break;

                case "setLinePoint1":
                    temp.mapline.point1 = screenToMapPos(mousePos);
                    temp.mapline.templine.p1 = temp.mapline.point1;
                    clickMode.set("setLinePoint2");
                    msgBar.setText("Click en el 2do punto de la linea");
                    break;
                case "setLinePoint2":
                    var pos = screenToMapPos(mousePos);
                    mapLineList.add(
                        new MapLine(
                            temp.mapline.point1, 
                            pos, 
                            {
                                color: "#f00",
                                width: 2,
                            })
                    );
                    clickMode.clear();
                    msgBar.clear();
                    draw();
                    break;

                case "setMetreDefPoint1":
                    clickMode.set("setMetreDefPoint2");
                    msgBar.setText("Haga click en el 2do punto de la regla.");

                    temp.mapline.point1 = screenToMapPos(mousePos);
                    break;
                case "setMetreDefPoint2":
                    var pos = screenToMapPos(mousePos);
                    var dist = Math.sqrt(
                        (pos.x - temp.mapline.point1.x) ** 2 +
                            (pos.y - temp.mapline.point1.y) ** 2
                    );

                    clickMode.clear();
                    msgBar.clear();
                    var i = parseInt(
                        prompt("Cuanto media ese punto (en metros)?", "900")
                    );
                    $("#one-metre-px").val(dist / i);
                    break;
            }
        }

        mouseDown = false;
        dragging = false;
    });

    // Cancel mouse movements
    $(canvas).on("mouseover", function (evt) {
        mouseDown = false;
        dragging = false;
    });

    $(canvas).on("mouseout", function (evt) {
        mouseDown = false;
        dragging = false;
    });

    // Wheel zooming
    canvas.addEventListener("wheel", function (e) {
        // jquery is broken with wheel?
        e.preventDefault();
        let previousScale = scale;

        // calculate scale direction 6 new scale value
        let scaleMult = e.deltaY > 0 ? scaleMultiplier : 1 / scaleMultiplier;
        zoomAtPosition(e.offsetX, e.offsetY, scale * scaleMult);
        draw();
    });
});

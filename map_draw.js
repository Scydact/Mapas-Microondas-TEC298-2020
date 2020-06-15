// Draw function
function draw() {
    var canvas = document.getElementById("renderCanvas");
    var context = canvas.getContext("2d");

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);

    //drawMap(context);
    mapLoader.draw(context);

    // Map lines
    mapLineList.draw(context);
    if (clickMode.mode == "setLinePoint2") {
        let pos = screenToMapPos(mousePos);
        temp.mapline.templine.p2 = pos;
        temp.mapline.templine.draw(context);
    }

    // Cursor overlay
    //drawCurrentPosition(context);
}

// Draws the map
function drawMap(context) {
    var image = document.getElementById("baseImage");
    context.save();
    context.translate(translatePos.x, translatePos.y);
    context.scale(scale, scale);

    context.drawImage(image, 0, 0);
    // context.beginPath(); // begin custom shape
    // context.moveTo(-119, -20);
    // context.bezierCurveTo(-159, 0, -159, 50, -59, 50);
    // context.bezierCurveTo(-39, 80, 31, 80, 51, 50);
    // context.bezierCurveTo(131, 50, 131, 20, 101, 0);
    // context.bezierCurveTo(141, -60, 81, -70, 51, -50);
    // context.bezierCurveTo(31, -95, -39, -80, -39, -50);
    // context.bezierCurveTo(-89, -95, -139, -80, -119, -20);
    // context.closePath(); // complete custom shape
    // var grd = context.createLinearGradient(-59, -100, 81, 100);
    // grd.addColorStop(0, "#8ED6FF"); // light blue
    // grd.addColorStop(1, "#004CB3"); // dark blue
    // context.fillStyle = grd;
    // context.fill();

    // context.lineWidth = 5;
    // context.strokeStyle = "#0000ff";
    // context.stroke();
    context.restore();
}

// Draws coordenate indicator
// function drawPosition(context, screenPoint, coordPoint) {
//     context.save();
//     padding = { x: 5, y: 5 };
//     margin = { x: 20, y: 0 };

//     var position = formattedPixelPointToMapPoint(coordPoint);
//     var msg = "Pos: (" + position.x + "," + position.y + ")";
//     context.font = "15px Arial";

//     context.textBaseline = "top";
//     context.fillStyle = "#fff";
//     var width = context.measureText(msg).width;
//     context.fillRect(
//         screenPoint.x + margin.x,
//         screenPoint.y + margin.y,
//         width + 2 * padding.x,
//         15 + 2 * padding.y
//     );

//     context.fillStyle = "#333";
//     context.fillText(
//         msg,
//         screenPoint.x + margin.x + padding.x,
//         screenPoint.y + margin.y + padding.y
//     );

//     context.restore();
// }

// function drawCurrentPosition(context) {
//     drawPosition(context, mousePos, coordPos);
// }

// Classes
let MapLine = class {
    hover = false;
    active = false;
    disabled = false;

    styles = {
        normal: {
            color: "red",
            width: 1,
        },
        hover: {
            color: "cyan",
            width: 2,
        },
        active: {
            color: "green",
            width: 2,
        },
        disabled: {
            color: "gray",
            width: 1,
        },
    };

    constructor(p1, p2, normalStyle) {
        this.p1 = p1;
        this.p2 = p2;
        this.styles.normal = normalStyle;
    }

    mapToScreenPos() {
        var p1 = mapToScreenPos(this.p1);
        var p2 = mapToScreenPos(this.p2);
        return { p1, p2 };
    }

    drawWithoutContextSave(context) {
        var sp = this.mapToScreenPos();

        context.beginPath();

        context.moveTo(sp.p1.x, sp.p1.y);
        context.lineTo(sp.p2.x, sp.p2.y);

        let selectedStyle;
        if (this.disabled) {
            selectedStyle = this.styles.disabled;
        } else if (this.active) {
            selectedStyle = this.styles.active;
        } else if (this.hover) {
            selectedStyle = this.styles.hover;
        } else {
            selectedStyle = this.styles.normal;
        }

        context.strokeStyle = selectedStyle.color;
        context.lineWidth = selectedStyle.width;

        context.stroke();

        context.closePath();
    }

    draw(context) {
        context.save();
        this.drawWithoutContextSave(context);
        context.restore();
    }

    isCloseToScreenPoint(point, distance) {
        var sp = this.mapToScreenPos();
        var angle = Math.atan2(sp.p2.y - sp.p1.y, sp.p2.x - sp.p1.x);

        var offsetX = distance * Math.cos(Math.PI / 2 + angle);
        var offsetY = distance * Math.sin(Math.PI / 2 + angle);

        var bpA = new p(sp.p1.x + offsetX, sp.p1.y + offsetY);
        var bpB = new p(sp.p1.x - offsetX, sp.p1.y - offsetY);
        var bpD = new p(sp.p2.x + offsetX, sp.p2.y + offsetY);

        var AM = p.Minus(mousePos, bpA);
        var AB = p.Minus(bpB, bpA);
        var AD = p.Minus(bpD, bpA);

        var AMxAB = p.Dot(AM, AB);
        var ABxAB = p.Dot(AB, AB);
        var AMxAD = p.Dot(AM, AD);
        var ADxAD = p.Dot(AD, AD);

        return 0 < AMxAB && AMxAB < ABxAB && 0 < AMxAD && AMxAD < ADxAD;
    }

    getDistancePx() {
        return p.Distance(this.p1, this.p2);
    }

    getDistanceMetre() {
        return this.getDistancePx() / oneMetreInPx;
    }
};

let MapLineList = class {
    constructor() {
        this.list = [];
        this.node = null;
    }

    toJson() {
        return JSON.stringify(this.list);
    }

    parseJson(txt) {
        let json = JSON.parse(txt);
        let This = this;
        json.forEach(function (e) {
            let a = new MapLine();
            Object.assign(a, e);
            This.add(a);
        });
    }

    add(line) {
        this.list.push(line);
        this.updateNode();
    }

    draw(context) {
        context.save();
        this.list.forEach((element) => element.drawWithoutContextSave(context));
        context.restore();
    }

    // Node stuff
    deselectAll() {
        this.list.forEach((element) => (element.active = false));
        $(this.node).find(".active").removeClass("active");
    }

    deleteActive() {
        this.list = this.list.filter((e) => !e.active);
        draw();
    }

    updateNode() {
        if (this.node) {
            this.node.innerHTML = "";
            let This = this;

            for (let i = 0; i < this.list.length; i++) {
                let l = This.list[i];

                let d = document.createElement("div");
                let djq = $(d);
                if (l.active) {
                    djq.addClass("active");
                }
                let p = document.createElement("p");
                p.innerHTML =
                    "(" +
                    (i + 1).toString() +
                    ") d=" +
                    l.getDistanceMetre().toFixed(2) +
                    "m";

                // Append to list node
                d.appendChild(p);
                this.node.appendChild(d);

                // Events
                djq.addClass("lineList");
                djq.on("click", function () {
                    if (!modifier.shift) {
                        This.deselectAll();
                    }
                    l.active = true;

                    let t = $(this);
                    t.addClass("active");

                    draw();
                });

                djq.on("mouseover", function () {
                    l.hover = true;
                    draw();
                });

                djq.on("mouseout", function () {
                    l.hover = false;
                    draw();
                });
            }
        }
    }
};

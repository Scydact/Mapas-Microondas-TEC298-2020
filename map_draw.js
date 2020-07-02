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

    // Map points
    mapPointList.draw(context);

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
class MapLine {
    hover = false;
    active = false;
    disabled = false;

    /**
     * Divisions:
     * - Disabled when 0.
     * - Segmented in n parts when positive.
     * - Segmented every n meters when negative.
     */
    divisions = 0;

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

    /**
     * 
     * @param {p} p1 
     * @param {p} p2 
     * @param {*} normalStyle 
     */
    constructor(p1, p2, normalStyle) {
        this.p1 = p1;
        this.p2 = p2;
        this.mapPointP1 = new MapPoint(this.p1);
        this.mapPointP2 = new MapPoint(this.p2);
        if (normalStyle) {this.styles.normal = normalStyle;}
    }

    toJson() {
        let o = {
            hover: this.hover,
            active: this.active,
            disabled: this.disabled,

            divisions: this.divisions,

            styles: this.styles,

            p1: this.p1,
            p2: this.p2
        }
        return JSON.stringify(o);
    }

    static fromJObject(o) {
        let l = new MapLine(o.p1, o.p2);

        if (o.styles) {l.styles = o.styles}
        
        l.hover = o.hover;
        l.active = o.active;
        l.disabled = o.disabled;

        l.divisions = (o.divisions) ? o.divisions : 0;

        return l;
    }

    static fromJson(txt) {
        let o = JSON.parse(txt);
        return this.fromJObject(o);
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

        // draw associated map points
        [this.mapPointP1, this.mapPointP2].forEach((e) => {
            e.styles = this.styles;
            e.active = this.active;
            e.hover = this.hover;
            e.disabled = this.disabled;
            e.draw(context);
        });

        // divisions
        if (this.divisions > 0) {
            let count = this.divisions; // amount of points to do.
            let d = p.Minus(sp.p2, sp.p1); // dx & dy

            let dx = d.x / (this.divisions + 1);
            let dy = d.y / (this.divisions + 1);

            let angle = Math.atan2(d.y, d.x) + Math.PI/2;
            let lengthFromLine = selectedStyle.width + 10;
            let ax = lengthFromLine*Math.cos(angle);
            let ay = lengthFromLine*Math.sin(angle);

            while (count) {
                context.beginPath();
                // context.arc(
                //     ,
                //     sp.p1.y + dy * count,
                //     selectedStyle.width + 2,
                //     0,
                //     2 * Math.PI,
                //     false
                // );
                // context.fillStyle = selectedStyle.color;
                // context.fill();

                // current x & y, and offsets
                let cx = sp.p1.x + dx * count;
                let cy = sp.p1.y + dy * count;
                context.moveTo(cx - ax, cy - ay);
                context.lineTo(cx + ax, cy + ay);
                context.stroke();
                context.closePath();
                count--;
            }


        }

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

        var AM = p.Minus(point, bpA);
        var AB = p.Minus(bpB, bpA);
        var AD = p.Minus(bpD, bpA);

        var AMxAB = p.Dot(AM, AB);
        var ABxAB = p.Dot(AB, AB);
        var AMxAD = p.Dot(AM, AD);
        var ADxAD = p.Dot(AD, AD);

        return 0 < AMxAB && AMxAB < ABxAB && 0 < AMxAD && AMxAD < ADxAD;
    }

    getDistanceToScreenPoint(ps) {
        let pl = this.mapToScreenPos();
        let denominator = p.Distance(pl.p1, pl.p2);
        let numerator = Math.abs(
            (pl.p2.y - pl.p1.y) * ps.x 
            -(pl.p2.x - pl.p1.x) * ps.y
            + pl.p2.x * pl.p1.y
            - pl.p2.y * pl.p1.x);
        return numerator/denominator;
    }

    getDistancePx() {
        return p.Distance(this.p1, this.p2);
    }

    getDistanceMetre() {
        return this.getDistancePx() / oneMetreInPx;
    }

    updateEditNode(editNode) {
        let T = this;
        let l;
        
        l = document.createElement('label');
        l.innerText = 'Anchura: ';
        editNode.appendChild(l);

        let inputWidth = document.createElement('input');
        inputWidth.setAttribute('type','number');
        inputWidth.setAttribute('min','0');
        inputWidth.setAttribute('step','0.25');
        inputWidth.setAttribute('value',T.styles.normal.width.toString());
        $(inputWidth).change(function () {
            T.styles.normal.width = parseFloat($(inputWidth).val());
            T.styles.active.width = parseFloat($(inputWidth).val()) + 1;
            T.styles.hover.width = parseFloat($(inputWidth).val()) + 1;
            draw();
        });
        editNode.appendChild(inputWidth);

        editNode.appendChild(document.createElement('br'));

        l = document.createElement('label');
        l.innerText = 'Divisiones: ';
        editNode.appendChild(l);

        let inputDivs = document.createElement('input');
        inputDivs.setAttribute('type','number');
        inputDivs.setAttribute('min','0');
        inputDivs.setAttribute('step','1');
        inputDivs.setAttribute('value',T.divisions);
        $(inputDivs).change(function () {
            T.divisions = parseFloat($(inputDivs).val());
            draw();
        });
        editNode.appendChild(inputDivs);
    }

};

class MapLineList {
    constructor() {
        this.list = [];
        this.node = null;
    }

    toJson() {
        let l = this.list.map((e) => e.toJson());
        return JSON.stringify(l);
    }

    parseJson(txt) {
        let json = JSON.parse(txt);
        let This = this;
        json.forEach(function (e) {
            let a = MapLine.fromJson(e);
            This.add(a);
        });
    }

    add(line) {
        this.list.push(line);
        let i = this.list.length - 1;
        this.list[i].index = i;
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
        //this.updateNode();
        // draw();
    }

    getActive() {
        return this.list.filter((e) => e.active);
    }

    deleteActive() {
        this.list = this.list.filter((e) => !e.active);
        this.updateListIndexes();
        // updateNode();
        // draw();
    }

    getCloseToScreenPoint(point, distance) {
        return this.list
            .filter((e)=>e.isCloseToScreenPoint(point, distance))
            .sort((a, b) => 
                a.getDistanceToScreenPoint(point)
                - b.getDistanceToScreenPoint(point));
    }

    updateListIndexes() {
        let x = this.list;
        let l = this.list.length;
        for (let i = 0; i < l; i++) {
            x[i].index = i;
        }
    }

    updateNode() {
        if (this.node) {
            this.node.innerHTML = "";
            let This = this;

            for (let i = 0; i < this.list.length; i++) {
                let l = This.list[i];

                let d = document.createElement("div");
                let djq = $(d);
                if (l.active) {djq.addClass("active")}
                if (l.hover) {djq.addClass("hover")}
                let p = document.createElement("p");
                p.innerHTML = `(${i+1}) d=${l.getDistanceMetre().toFixed(2)}m`;

                // Append to list node
                d.appendChild(p);
                this.node.appendChild(d);

                // Events
                djq.addClass("lineList");
                djq.on("click", function () {
                    if (!modifier.shift) {
                        This.deselectAll();
                    }
                    l.active = !l.active;

                    let t = $(this);
                    if (l.active) {t.addClass("active")}
                    else {t.removeClass("active")}

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

class MapPoint {
    hover = false;
    active = false;
    disabled = false;
    name = "";

    styles = {
        normal: {
            color: "red",
            width: 3,
        },
        hover: {
            color: "cyan",
            width: 5,
        },
        active: {
            color: "green",
            width: 5,
        },
        disabled: {
            color: "gray",
            width: 1,
        },
    };

    constructor(point, normalStyle) {
        this.p = point;
        if (normalStyle) {this.styles.normal = normalStyle;}
    }

    toJson() {
        let o = {
            hover: this.hover,
            active: this.active,
            disabled: this.disabled,

            styles: this.styles,

            p: this.p,
            name: this.name
        }
        return JSON.stringify(o);
    }

    static fromJObject(o) {
        let l = new MapPoint(o.p);
        l.name = o.name;
        l.p = o.p;

        // styles
        if (o.styles) {l.styles = o.styles}
        
        // state
        l.hover = o.hover;
        l.active = o.active;
        l.disabled = o.disabled;

        return l;
    }

    static fromJson(txt) {
        let o = JSON.parse(txt);
        return this.fromJObject(o);
    }

    drawWithoutContextSave(context) {
        var sp = mapToScreenPos(this.p)

        context.beginPath();

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

        context.arc(
            sp.x,
            sp.y,
            selectedStyle.width,
            0,
            2 * Math.PI,
            false
        );

        context.fillStyle = selectedStyle.color;
        context.fill();
        // context.strokeStyle = selectedStyle.color;
        // context.lineWidth = selectedStyle.width;

        // context.stroke();

        context.closePath();
    }

    draw(context) {
        context.save();
        this.drawWithoutContextSave(context);
        context.restore();
    }

    isCloseToScreenPoint(point, distance) {
        var sp = mapToScreenPos(this.p);
        
        return p.Distance(sp, point) < distance;
    }

    getDistanceToScreenPoint(point) {
        return this.getDistancePx(point);
    }

    getDistancePx(point) {
        return p.Distance(this.p, point);
    }

    getDistanceMetre(point) {
        return this.getDistancePx(point) / oneMetreInPx;
    }


    updateEditNode(editNode) {
        let T = this;
        
        let l = document.createElement('label');
        l.innerText = 'Anchura: ';
        editNode.appendChild(l);

        let i = document.createElement('input');
        i.setAttribute('type','number');
        i.setAttribute('min','0');
        i.setAttribute('step','0.25');
        i.setAttribute('value',T.styles.normal.width.toString());
        $(i).change(function () {
            T.styles.normal.width = parseFloat($(i).val());
            T.styles.active.width = parseFloat($(i).val()) + 2;
            T.styles.hover.width = parseFloat($(i).val()) + 2;
            draw();
        });
        editNode.appendChild(i);
    }
};



class MapPointList {
    constructor() {
        this.list = [];
        this.node = null;
    }

    toJson() {
        let l = this.list.map((e) => e.toJson());
        return JSON.stringify(l);
    }

    parseJson(txt) {
        let json = JSON.parse(txt);
        let This = this;
        json.forEach(function (e) {
            let a = MapPoint.fromJson(e);
            This.add(a);
        });
    }

    add(line) {
        this.list.push(line);
        let i = this.list.length - 1;
        this.list[i].index = i;
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
        //this.updateNode();
        // draw();
    }

    getActive() {
        return this.list.filter((e) => e.active);
    }

    deleteActive() {
        this.list = this.list.filter((e) => !e.active);
        this.updateListIndexes();
        // updateNode();
        // draw();
    }

    getCloseToScreenPoint(point, distance) {
        return this.list
            .filter((e)=>e.isCloseToScreenPoint(point, distance))
            .sort((a, b) => 
                a.getDistanceToScreenPoint(point)
                - b.getDistanceToScreenPoint(point));
    }

    updateListIndexes() {
        let x = this.list;
        let l = this.list.length;
        for (let i = 0; i < l; i++) {
            x[i].index = i;
        }
    }

    updateNode() {
        if (this.node) {
            this.node.innerHTML = "";
            let This = this;

            for (let i = 0; i < this.list.length; i++) {
                let l = This.list[i];

                let d = document.createElement("div");
                let djq = $(d);
                if (l.active) {djq.addClass("active")}
                if (l.hover) {djq.addClass("hover")}
                let p = document.createElement("p");
                let name = (l.name) ? l.name : (i+1).toString();
                let pos = formattedPixelPointToMapPoint(l.p);
                p.innerHTML = `(${name}) @(${pos.x}, ${pos.y})`;

                // Append to list node
                d.appendChild(p);
                this.node.appendChild(d);

                // Events
                djq.addClass("lineList");
                djq.on("click", function () {
                    if (!modifier.shift) {
                        This.deselectAll();
                    }
                    l.active = !l.active;

                    let t = $(this);
                    if (l.active) {t.addClass("active")}
                    else {t.removeClass("active")}

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
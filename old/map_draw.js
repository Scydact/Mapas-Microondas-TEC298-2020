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
        temp.mapline.templine.p2 = coordPos;
        temp.mapline.templine.draw(context);
    }

    if (clickMode.mode == "setTopographicPoint") {
        temp.mapline.templine.p1 = coordPos;
        temp.mapline.templine.p2 = temp.topo.mapLine.getPointProjection(coordPos);
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

// Some helper functions
function createButton(parentNode, text, callback, tooltip) {
    let b = document.createElement('input');
    b.setAttribute('type','button');
    b.setAttribute('value',text);
    if (tooltip) {b.setAttribute('title',tooltip)}
    parentNode.appendChild(b);
    $(b).on('click', callback);
    return b;
}

function createLabel(parentNode, text, tooltip) {
    let l = document.createElement('label');
    l.innerText = text;
    parentNode.appendChild(l);
    return l;
}

function lineBreak(parentNode) {
    let b = document.createElement('br');
    parentNode.appendChild(b);
    return b;
}




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
        this.topographicPoints = new TopographicProfilePointList(this);
        if (normalStyle) {this.styles.normal = normalStyle;}
    }

    toJson() {
        let o = {
            hover: this.hover,
            active: this.active,
            disabled: this.disabled,

            styles: this.styles,

            p1: this.p1,
            p2: this.p2
        }
        if (this.divisions) {o.divisions = this.divisions}
        if (this.topographicPoints.list.length) {o.topographicPoints = this.topographicPoints.toJson()}
        return JSON.stringify(o);
    }

    static fromJObject(o) {
        let l = new MapLine(o.p1, o.p2);

        if (o.styles) {l.styles = o.styles}
        
        l.hover = o.hover;
        l.active = o.active;
        l.disabled = o.disabled;

        l.divisions = (o.divisions) ? o.divisions : 0;

        if (o.topographicPoints) {l.topographicPoints.parseJson(o.topographicPoints)}

        return l;
    }

    static fromJson(txt) {
        let o = JSON.parse(txt);
        return this.fromJObject(o);
    }

    reverse() {
        let pTemp = this.p2;
        this.p2 = this.p1;
        this.p1 = pTemp;

        this.topographicPoints.reverse();
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

        // topograhpic points
        this.topographicPoints.draw(context);

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

    /**
     * Gets the point that cuts this line orthogonally to another point.
     * @param {p} point 
     */
    getPointProjection(point) {
        // source: https://en.wikipedia.org/wiki/Vector_projection

        let naturalB = p.Minus(this.p2, this.p1);
        let naturalA = p.Minus(point, this.p1);

        let mult = p.Dot(naturalA, naturalB) / p.Dot(naturalB, naturalB);
        let naturalAPB = p.ScalarMult(naturalB, mult); 

        return p.Plus(naturalAPB, this.p1);
    }

    updateEditNode(editNode) {
        let T = this;

        createLabel(editNode, `Longitud de linea: ${T.getDistanceMetre().toFixed(2)} m`)
        lineBreak(editNode);

        // Width
        createLabel(editNode, 'Anchura: ');

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

        lineBreak(editNode);

        // Divisions
        createLabel(editNode, 'Divisiones: ')

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

        lineBreak(editNode);
        lineBreak(editNode);

        // Topographic
        createLabel(editNode, 'Perfil topografico: ');
        lineBreak(editNode);

        createButton(editNode, '+', function() {
            temp.topo = T.topographicPoints;
            clickMode.set('setTopographicPoint');
            msgBar.setText('Click para marcar un perfil topografico.\nEscape para cancelar.');
        }, 'Agregar puntos topograficos.');

        createButton(editNode, '-', function() {
            T.topographicPoints.deleteActive();
            T.topographicPoints.updateNode();
            draw();
        }, 'Eliminar puntos topograficos seleccionados.');

        createButton(editNode, 'Todos', function() {
            let tpl = T.topographicPoints.list;
            let tpActive = tpl.filter((e) => e.active);
            if (tpActive.length == tpl.length) { // Deselect all if everything is already selected
                tpl.forEach((e) => e.active = false);
            }
            else {
                tpl.forEach((e) => e.active = true);
            }
            T.topographicPoints.updateNode();
            draw();
        }, 'Selecciona todos los puntos topograficos.');

        createButton(editNode, 'Invertir', function() {
            T.topographicPoints.list.forEach((e) => e.active = !e.active);
            T.topographicPoints.updateNode();
            draw();
        }, 'Invierte la seleccion.');

        lineBreak(editNode);

        createButton(editNode, 'Reverse', function() {
            T.reverse();
            draw();
        }, 'Invertir el orden de los puntos. Ej. en vez de A a B, sera de B a A.');

        createButton(editNode, 'Descargar', function() {
            T.topographicPoints.downloadCsv();
        }, 'Descargar la lista de puntos topograficos de esta linea en formato .csv');


        let topoDiv = document.createElement('div');
        topoDiv.id = 'topoPointsWrapper';
        let j = $(topoDiv);
        j.addClass('scroll');
        j.addClass('listContainer');
        j.css('max-height','50vh');

        editNode.appendChild(topoDiv);
        this.topographicPoints.node = topoDiv;
        this.topographicPoints.updateNode();
    }

};

class MapLineList {
    constructor() {
        this.list = [];
        this.node = null;
        this.toolNode = null;
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
        this.list.forEach(function (element) {
            element.active = false; 
            element.topographicPoints.deselectAll();
        });
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
        editPane.updateActive();
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

    toolBox = {
        T: this,
        createElement: function () {
            clickMode.set('setLinePoint1');
            msgBar.setText('Click en el 1er punto de la linea');
        },
        deleteElement: function () {
            this.T.deleteActive();
            this.T.updateNode();
            draw();
        }
    }

    updateToolNode(toolNode) {
        if (toolNode) {this.toolNode = toolNode}
        if (this.toolNode) {
            let T = this;
            let TN = this.toolNode;
            TN.innerHTML = '';

            createButton(TN, '+', () => T.toolBox.createElement(), 'Crear una nueva linea.');
            createButton(TN, '-', () => T.toolBox.deleteElement(), 'Eliminar las lineas seleccionadas.');

            createButton(TN, 'Todos', function() {
                let elements = T.list;
                let activeElements = elements.filter((e) => e.active);
                if (activeElements.length == elements.length) { // Deselect all if everything is already selected
                    elements.forEach((e) => e.active = false);
                }
                else {
                    elements.forEach((e) => e.active = true);
                }
                T.updateNode();
                draw();
            }, 'Selecciona/deselecciona todas las lineas.');
    
            createButton(TN, 'Invertir', function() {
                T.list.forEach((e) => e.active = !e.active);
                T.updateNode();
                draw();
            }, 'Invierte la seleccion.');
        }
    }

    updateNode() {
        if (this.node) {
            this.node.innerHTML = "";
            let T = this;

            for (let i = 0; i < this.list.length; i++) {
                let l = T.list[i];

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
                        T.deselectAll();
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
        editPane.updateActive();
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

    toolBox = {
        T: this,
        createElement: function () {
            clickMode.set('setPointMarker');
            msgBar.setText('Click en un punto');
        },
        deleteElement: function () {
            this.T.deleteActive();
            this.T.updateNode();
            draw();
        }
    }

    updateToolNode(toolNode) {
        if (toolNode) {this.toolNode = toolNode}
        if (this.toolNode) {
            let T = this;
            let TN = this.toolNode;
            TN.innerHTML = '';

            createButton(TN, '+', () => T.toolBox.createElement(), 'Crear un nuevo punto.');
            createButton(TN, '-', () => T.toolBox.deleteElement(), 'Eliminar los puntos seleccionados.');
            
            createButton(TN, 'Todos', function() {
                let elements = T.list;
                let activeElements = elements.filter((e) => e.active);
                if (activeElements.length == elements.length) { // Deselect all if everything is already selected
                    elements.forEach((e) => e.active = false);
                }
                else {
                    elements.forEach((e) => e.active = true);
                }
                T.updateNode();
                draw();
            }, 'Selecciona/deselecciona todos los puntos.');
    
            createButton(TN, 'Invertir', function() {
                T.list.forEach((e) => e.active = !e.active);
                T.updateNode();
                draw();
            }, 'Invierte la seleccion.');
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

class TopographicProfilePoint extends MapPoint {
    constructor(position, parentMapLine, height, normalStyle) {
        super(new p(0, 0), normalStyle);
        this.position = position;
        this.height = height;
        this.mapLine = parentMapLine;
        this.updatePoint(parentMapLine.p1, parentMapLine.p2);
    }

    /**
     * Creates a topographicProfilePoint from a coordPos 
     * (doesn't need to be on the line, as this method will project it anyways)
     * @param {p} point 
     * @param {MapLine} parentMapLine 
     * @param {*} height 
     * @param {*} normalStyle 
     */
    static fromCoordPoint(point, parentMapLine, height, normalStyle) {
        let projectedP = parentMapLine.getPointProjection(coordPos);
        let dp = p.Distance(projectedP, parentMapLine.p1);
        let dl = p.Distance(parentMapLine.p1, parentMapLine.p2);
        let pos = dp/dl;

        return new TopographicProfilePoint(pos, parentMapLine, height, normalStyle);
    }

    toJson() {
        let o = {
            position: this.position,
            height: this.height,
            styles: this.styles
        }
        return JSON.stringify(o);
    }

    static fromJObject(o, parentMapLine) {
        let tpp = new TopographicProfilePoint(o.position, parentMapLine, o.height);
        if (o.styles) {tpp.styles = o.styles};
        return tpp;
    }

    static fromJson(txt, parentMapLine) {
        return TopographicProfilePoint.fromJObject(JSON.parse(txt), parentMapLine);
    }

    updatePoint(p1, p2) {
        let dp = p.Minus(p2, p1);
        this.p.x = p1.x + this.position * dp.x;
        this.p.y = p1.y + this.position * dp.y;
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
}

class TopographicProfilePointList extends MapPointList {
    /**
     * 
     * @param {MapLine} parentMapLine 
     */
    constructor(parentMapLine) {
        super();
        this.mapLine = parentMapLine;
    }

    /**
     * Adds a new TopographicProfilePoint from a mouseClick (coordPoint) and sets its height.
     * @param {p} coordPoint 
     * @param {*} height 
     */
    add(coordPoint, height) {
        this.list.push(
            TopographicProfilePoint.fromCoordPoint(
                coordPoint,
                this.mapLine,
                height));
        this.sortList();
        this.updateNode();
    }

    addTopographicProfilePoint(topoPoint) {
        this.list.push(topoPoint);
        this.sortList();
        this.updateNode();
    }

    reverse() {
        this.list.forEach((e) => e.position = 1 - e.position);
        this.sortList();
        this.updateNode();
    }

    sortList() {
        return this.list.sort((a, b) => a.position - b.position);
    }

    parseJson(txt) {
        let json = JSON.parse(txt);
        let This = this;
        json.forEach(function (e) {
            let a = TopographicProfilePoint.fromJson(e, This.mapLine);
            This.addTopographicProfilePoint(a);
        });
    }

    /**
     * Creates an array (table) from this object.
     * Rows:
     *  - distance
     *  - height
     *  - lon
     *  - lat
     *  - pos (%)
     */
    toTableData() {
        let rows = [];
        let totalLength = this.mapLine.getDistanceMetre();
        for(let i = this.list.length; i--; ) {
            let currentPoint = this.list[i];
            let d = currentPoint.position * totalLength;
            let h = currentPoint.height;
            let coords = formattedPixelPointToMapPoint(currentPoint.p);
            rows.push([d,h,coords.x,coords.y,currentPoint.position]);
        }
        rows.push(['Distancia [m]','Altura [m]','Longitud', 'Latitud', 'Posicion [%]']);
        return rows.reverse();
    }
    /**
     * Creates a csv string from this object
     */
    toCsv() {
        let data = this.toTableData();
        return 'data:text/csv;charset=utf-8,\ufeff' 
        + data.map(e => e.join(',')).join('\n');
    }
    /**
     * Prompts download of a csv file containing this object's data.
     */
    downloadCsv() {
        var encodedUri = encodeURI(this.toCsv());
        var link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        var name = (this.mapLine.name) ? this.mapLine.name : this.mapLine.index;
        link.setAttribute('download', `linea-${name}-${mapLoader.currentMap}.csv`);
        //document.body.appendChild(link); // Required for FF

        link.click();
    }

    updateNode() {
        if (this.node) {
            this.node.innerHTML = "";
            let This = this;
            let lineLength = this.mapLine.getDistanceMetre();

            for (let i = 0; i < this.list.length; i++) {
                let currentMapPoint = This.list[i];

                let d = document.createElement("div");
                let djq = $(d);
                if (currentMapPoint.active) {djq.addClass("active")}
                if (currentMapPoint.hover) {djq.addClass("hover")}
                let p = document.createElement("p");
                p.innerHTML = `d = ${(currentMapPoint.position * lineLength).toFixed(2)} m, h = ${currentMapPoint.height} m`;

                // Append to list node
                d.appendChild(p);
                this.node.appendChild(d);

                // Events
                djq.addClass("lineList");
                djq.on("click", function () {
                    if (!modifier.shift) {
                        This.deselectAll();
                    }
                    currentMapPoint.active = !currentMapPoint.active;

                    let t = $(this);
                    if (currentMapPoint.active) {t.addClass("active")}
                    else {t.removeClass("active")}

                    draw();
                });

                djq.on("mouseover", function () {
                    currentMapPoint.hover = true;
                    draw();
                });

                djq.on("mouseout", function () {
                    currentMapPoint.hover = false;
                    draw();
                });
            }
        }
    }


}
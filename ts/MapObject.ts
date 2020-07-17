import {
    Restorable,
    ObjectAssignProperty,
    createButton,
    createElement,
    createLabel,
    lineBreak,
} from './Utils.js';
import { Point, UnaryOperator } from './Point.js';
import { App } from './App.js';
import { Line } from './Line.js';
import { UndoRedoStackActionObject } from './UndoRedoManager.js';

//#region Generics
/** Stype definition for a MapObject. Used in draw() */
export type MapObjectStyle = {
    color: string;
    width: number;
    type: string;
    [key: string]: any;
};

/** Style container used to draw the corresponding MapObject */
export type MapObjectStyleList = {
    normal: MapObjectStyle;
    hover: MapObjectStyle;
    active: MapObjectStyle;
    disabled: MapObjectStyle;
    [key: string]: any;
};

/** Possible mapObject interactivity states */
export type MapObjectState = 'normal' | 'hover' | 'active' | 'disabled';

/** Generic MapObject that can be drawn, saved, and restored. */
export abstract class MapObject implements Restorable {
    /** The current interaction status of this object */
    state = {
        hover: false,
        active: false,
        disabled: false,
    };
    name = '';

    /**
     * If this is set to 'normal', 'hover', 'active' or 'disabled,
     * the object will be forcefully drawn using that style.
     */
    forceStatus = null;

    /** If not null, will use this set of styles instead. */
    globalStyle = null;

    /** Styles used to draw this object */
    style: MapObjectStyleList = {
        normal: {
            color: 'red',
            width: 2,
            type: 'solid',
        },
        hover: {
            color: 'cyan',
            width: 4,
            type: 'solid',
        },
        active: {
            color: 'green',
            width: 4,
            type: 'solid',
        },
        disabled: {
            color: 'gray',
            width: 1,
            type: 'solid',
        },
    };

    /** Checks if the globalStyle is defined and returns it, or returns the local style. */
    getCurrentStyle() {
        return this.globalStyle ? this.globalStyle : this.style;
    }

    app: App;
    constructor(app: App) {
        this.app = app;
    }

    abstract toJObject(): object;

    abstract assign(o): boolean;

    /** Returns the distance from this element to the given canvas point. */
    abstract getDistanceToPoint(p: Point): number;

    /** Returns the distance from this element to the given screen point. */
    abstract getDistanceToScreenPoint(p: Point): number;

    /**
     * Draws this object on the given context using the given app's settings.
     * - The app determines when to draw on Screen (constant width on screen) or on Canvas (as part of the map)
     * */
    abstract draw(context: CanvasRenderingContext2D);

    /** Returns the value that would be displayed on a MapObjectList node. (E.g. name and position) */
    abstract getListNodeElementContent(
        index?: number,
        array?: any[]
    ): HTMLElement;

    //#region state related methods
    /**
     * Gets all the elements that are in the given state.
     * Direct replacement to getActive();
     * @param state State to filter.
     * @param invertSelection If true, inverts the selection.
     */
    getState(state: MapObjectState) {
        return this.state[state];
    }

    /**
     * Sets the state of all objects inside to the given value.
     * Direct replacement to deselectAll();
     */
    setState(state: MapObjectState, value: boolean) {
        this.state[state] = value;
    }

    /**
     * Switches the given state of all the list elements. (a = !a)
     * @param state
     */
    flipState(state: MapObjectState) {
        this.setState(state, !this.getState(state));
    }
    //#endregion

    /** Returns the message that would display on top of  */
    abstract getHoverMessageContent(): string;

    /** Returns the node that goes inside EditPane */
    abstract getEditNodeContent(): HTMLElement; // TODO: Make this an interface inside EditPane
}

/**
 * Implements basic MapObjectList functionality
 * Properties:
 * - list[]
 * - node
 * - paneNode
 * - globalStyle
 *
 * Methods
 * - draw(): very basic, only calls (draw) on each element.
 * - abstract toJObject()
 * - abstract assign()
 *
 * Selection Methods:
 * -
 *
 */
export abstract class MapObjectList implements Restorable {
    list: MapObject[] = [];
    node: HTMLElement;

    /** Global style used by all elements of this list. */
    globalStyle: MapObjectStyleList = {
        normal: {
            color: 'red',
            width: 2,
            type: 'solid',
        },
        hover: {
            color: 'cyan',
            width: 4,
            type: 'solid',
        },
        active: {
            color: 'green',
            width: 4,
            type: 'solid',
        },
        disabled: {
            color: 'gray',
            width: 1,
            type: 'solid',
        },
    };

    abstract toolboxTooltips: {
        createElement: string;
        deleteElement: string;
    };

    abstract toolbox: {
        createElement: Function;
        deleteElement: Function;
    };

    app: App;
    constructor(app: App) {
        this.app = app;
    }

    /**
     * Gets all the elements that are in the given state.
     * Direct replacement to getActive();
     * @param state State to filter.
     * @param invertSelection If true, inverts the selection.
     */
    getState(state: MapObjectState, invertSelection?: boolean) {
        if (invertSelection) {
            return this.list.filter((e) => !e.getState(state));
        } else {
            return this.list.filter((e) => e.getState(state));
        }
    }

    /**
     * Sets the state of all objects inside to the given value.
     * Direct replacement to deselectAll();
     */
    setState(state: MapObjectState, value: boolean) {
        this.list.forEach((e) => (e.setState(state, value)));
        return this.list;
    }

    /**
     * Deletes all the elements that are in the given state.
     * Direct replacement to deleteActive();
     * @param state State to filter.
     * @param invertSelection If true, inverts the selection.
     */
    deleteState(state: MapObjectState, invertSelection?: boolean) {
        this.list = this.getState(state, !invertSelection);
        return this.list;
    }

    /**
     * Switches the given state of all the list elements. (a = !a)
     * @param state
     */
    flipState(state: MapObjectState) {
        this.list.forEach((e) => e.flipState(state));
        return this.list;
    }

    /** Runs inside add() after adding a new element. */
    _addExtra() {}

    /** Pushes the given MapObject to this list. */
    add(object: MapObject) {
        let undoActionObject: UndoRedoStackActionObject = {
            action: 'ModifyMapObjectListElement',
            source: this,
            data: undefined,
            oldData: this.list.filter((e) => true),
        };

        object.globalStyle = this.globalStyle;
        this.list.push(object);
        this._addExtra();

        undoActionObject.data = this.list.filter((e) => true);
        this.app.undoman.do(undoActionObject);

        this.updateNode();
    }

    /** Evaluates each element's getDistanceToScreenPoint() */
    getCloseToScreenPoint(p, distance) {
        return this.list.filter(
            (e) => e.getDistanceToScreenPoint(p) < distance
        );
    }

    abstract toJObject(): object;
    //  {
    //     let l = this.list.map((e) => e.toJObject());
    //     let o = {
    //         globalStyle: this.globalStyle,
    //         list: l
    //     };
    //     return o;
    // }

    abstract assign(o): boolean;
    // {
    //     let JObjectList = o['list'];
    //     // CHANGE MapObject to T
    //     let newList = JObjectList.map((e) => MapObject.fromJObject(e));
    //     this.list = newList;

    //     ObjectAssignProperty(this, o, 'globalStyle');
    //     return true;
    // };

    /**
     * Draws this object on the given context using the given app's settings.
     * - The app determines when to draw on Screen (constant width on screen) or on Canvas (as part of the map)
     * */
    draw(context: CanvasRenderingContext2D) {
        this.list.forEach((e) => e.draw(context));
    }

    /** Recreates the attached node (to show the list to the used) */
    updateNode(): boolean {
        if (this.node) {
            this.node.innerHTML = '';
            let T = this;

            for (let i = 0; i < this.list.length; i++) {
                let obj = this.list[i];

                let div = document.createElement('div');
                let divJQuery = $(div);

                if (obj.state.active) {
                    divJQuery.addClass('active');
                }
                if (obj.state.hover) {
                    divJQuery.addClass('hover');
                }
                if (obj.state.disabled) {
                    divJQuery.addClass('disabled');
                }

                let ElementContents = obj.getListNodeElementContent(
                    i,
                    this.list
                );
                div.appendChild(ElementContents);

                // Events
                divJQuery.addClass('objectList');
                divJQuery.on('click', () => {
                    if (!this.app.interman.modifier.shift) {
                        this.setState('active', false);
                    }
                    obj.state.active = !obj.state.active;

                    // if (obj.state.active) {
                    //     divJQuery.addClass('active');
                    // } else {
                    //     divJQuery.removeClass('active');
                    // }
                    this.updateNode();

                    this.app.draw();
                });

                divJQuery.on('mouseover', () => {
                    obj.state.hover = true;
                    this.app.draw();
                });

                divJQuery.on('mouseout', () => {
                    obj.state.hover = false;
                    this.app.draw();
                });

                // Append to the actual list.
                this.node.appendChild(div);
            }

            return true;
        }
        return false;
    }

    /** Called after adding basic buttons. */
    _extraNodeButtons(toolNode: HTMLElement) {

    } 

    /** Recreates the tool buttons (add, remove...) for the list. */
    updateNodeButtons(toolNode: HTMLElement) {
        if (toolNode) {
            toolNode.innerHTML = '';

            createButton(
                toolNode,
                '+',
                () => this.toolbox.createElement(),
                this.toolboxTooltips.createElement
            );
            createButton(
                toolNode,
                '-',
                () => this.toolbox.deleteElement(),
                this.toolboxTooltips.deleteElement
            );

            createButton(
                toolNode,
                'Todos',
                () => {
                    let elements = this.list;
                    let activeElements = this.getState('active');

                    // Deselect all if everything is already selected
                    let allActiveState = !(
                        activeElements.length == elements.length
                    );
                    this.setState('active', allActiveState);
                    this.updateNode();
                    this.app.draw();
                },
                'Selecciona/deselecciona todos los elementos de la lista.'
            );

            createButton(
                toolNode,
                'Invertir',
                () => {
                    this.flipState('active');
                    this.updateNode();
                    this.app.draw();
                },
                'Invierte la seleccion de la lista.'
            );

            this._extraNodeButtons(toolNode);
        }
    }
}

//#endregion

/** A line that can be drawed on the map */
export class MapLine extends MapObject {
    l = new Line(Point.ZERO(), Point.ZERO());
    divisions = 0;
    topoPoints = new TopographicProfilePointList(this);

    /** Creates a new line and sets its defining points. */
    static fromPoints(p1: Point, p2: Point, app: App) {
        let x = new this(app);
        x.l.p1 = p1;
        x.l.p2 = p2;
        return x;
    }

    getHoverMessageContent(): string {
        return `d=${this.getLengthMetre().toFixed(2)}m`;
    }

    toJObject() {
        let o = {
            l: this.l,
            divisions: this.divisions,
            forceStatus: this.forceStatus,
        };
        if (this.globalStyle === null) {
            o['style'] = this.style;
        }
        if (this.topoPoints.list.length) {
            o['topoPoints'] = this.topoPoints.toJObject();
        }

        return o;
    }

    /** Is this object had a global style, return true. */
    assign(o: any): boolean {
        this.l = Line.fromObject(o.l);

        ObjectAssignProperty(this, o, 'divisions');
        ObjectAssignProperty(this, o, 'forceStatus');

        if (o['topoPoints']) {
            this.topoPoints.assign(o['topoPoints']);
        }

        let usesLocalStyle = ObjectAssignProperty(this, o, 'style');
        return usesLocalStyle;
    }

    /** Creates and assigns a new object. */
    static fromJObject(o: object, app: App, globalStyle?: MapObjectStyleList) {
        let x = new this(app);
        if (!x.assign(o) && globalStyle) {
            x.globalStyle = globalStyle;
        }
        return x;
    }

    /** Gets the points that make this line as Screen Points */
    getGetLineAtScreenPoints() {
        let p1 = this.app.canvasPointToScreenPoint(this.l.p1);
        let p2 = this.app.canvasPointToScreenPoint(this.l.p2);
        return new Line(p1, p2);
    }

    /** Returns the length of this line, in metres. */
    getLengthMetre() {
        return this.l.length() / this.app.mapMeta.oneMetreInPx;
    }

    // TODO: Remove this;
    /** Returns the distance from this line to the given point, supposing that this line is infinite. */
    getDistanceToPointAsInfiniteLine(ps: Point) {
        let pl = this.getGetLineAtScreenPoints();
        let denominator = Point.Distance(pl.p1, pl.p2);
        let numerator = Math.abs(
            (pl.p2.y - pl.p1.y) * ps.x -
                (pl.p2.x - pl.p1.x) * ps.y +
                pl.p2.x * pl.p1.y -
                pl.p2.y * pl.p1.x
        );
        return numerator / denominator;
    }

    /** Returns the distance from this line segment to the given point */
    getDistanceToPoint(p: Point) {
        return Line.DistanceToPoint(this.l, p);
    }

    /** Returns the distance from this line segment to the given screen point. */
    getDistanceToScreenPoint(p: Point) {
        let l = this.getGetLineAtScreenPoints();
        return Line.DistanceToPoint(l, p);
    }

    draw(context: CanvasRenderingContext2D) {
        context.save();
        let sp = this.getGetLineAtScreenPoints();

        context.beginPath();
        context.moveTo(sp.p1.x, sp.p1.y);
        context.lineTo(sp.p2.x, sp.p2.y);

        let styleList = this.getCurrentStyle();
        let selectedStyle: MapObjectStyle;
        if (this.state.disabled) {
            selectedStyle = styleList.disabled;
        } else if (this.state.active) {
            selectedStyle = styleList.active;
        } else if (this.state.hover) {
            selectedStyle = styleList.hover;
        } else {
            selectedStyle = styleList.normal;
        }

        context.strokeStyle = selectedStyle.color;
        context.lineWidth = selectedStyle.width;

        context.stroke();
        context.closePath();

        // topograhpic points
        this.topoPoints.draw(context);

        // divisions
        if (this.divisions > 0) {
            let count = this.divisions; // amount of points to do.
            let d = Point.Minus(sp.p2, sp.p1); // dx & dy

            let dx = d.x / (this.divisions + 1);
            let dy = d.y / (this.divisions + 1);

            let angle = Math.atan2(d.y, d.x) + Math.PI / 2;
            let lengthFromLine = selectedStyle.width + 7;
            let ax = lengthFromLine * Math.cos(angle);
            let ay = lengthFromLine * Math.sin(angle);

            while (count) {
                context.beginPath();

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

        context.restore();
    }

    getListNodeElementContent(index) {
        let p = document.createElement('p');
        p.innerHTML = `(${index + 1}) d=${this.getLengthMetre().toFixed(2)}m`;
        return p;
    }

    getEditNodeContent(): HTMLElement {
        let outDiv = document.createElement('div');

        createLabel(
            outDiv,
            `Longitud de linea: ${this.getLengthMetre().toFixed(2)}m`
        );
        lineBreak(outDiv);

        {
            // Width
            createLabel(outDiv, 'Anchura: ');

            let inputWidth = createElement(outDiv,'input');
            inputWidth.setAttribute('type', 'number');
            inputWidth.setAttribute('min', '0');
            inputWidth.setAttribute('step', '0.25');
            inputWidth.setAttribute(
                'value',
                this.style.normal.width.toString()
            );
            $(inputWidth).change(() => {
                let w = parseFloat($(inputWidth).val().toString());
                this.style.normal.width = w;
                this.style.active.width = w + 1;
                this.style.hover.width = w + 1;
                this.app.draw();
            });

            lineBreak(outDiv);
        }

        {
            // Divisions
            createLabel(outDiv, 'Divisiones: ');

            let inputDivs = createElement(outDiv, 'input');
            inputDivs.setAttribute('type', 'number');
            inputDivs.setAttribute('min', '0');
            inputDivs.setAttribute('step', '1');
            inputDivs.setAttribute('value', this.divisions.toString());
            $(inputDivs).change(() => {
                this.divisions = parseFloat($(inputDivs).val().toString());
                this.app.draw();
            });

            lineBreak(outDiv);
        }

        { 
            // Topographic profile points
            lineBreak(outDiv);
            createLabel(outDiv, 'Perfil topografico: ');
            lineBreak(outDiv);

            let toolDiv = createElement(outDiv, 'div');
            this.topoPoints.updateNodeButtons(toolDiv);

            let listDiv = createElement(outDiv, 'div');
            listDiv.classList.add('listContainer');
            listDiv.classList.add('scroll');
            this.topoPoints.node = listDiv;
            this.topoPoints.updateNode();
        }

        return outDiv;
    }
}

/** MapLine container with a few functions */
export class MapLineList extends MapObjectList {
    toolboxTooltips = {
        createElement: 'Crear nueva linea.',
        deleteElement: 'Eliminar lineas seleccionadas.',
    };

    toolbox = {
        createElement: () => {
            this.app.interman.clickMode.set('setLinePoint1');
            this.app.interman.out.topMsgBar.set(
                'Click en el 1er punto de la linea'
            );
        },
        deleteElement: (doNotDraw?: boolean) => {
            let undoActionObject: UndoRedoStackActionObject = {
                action: 'ModifyMapObjectListElement',
                source: this,
                data: undefined,
                oldData: this.list.filter((e) => true),
            };
            undoActionObject.data = this.deleteState('active').filter(
                (e) => true
            );
            if (
                undoActionObject.data.length != undoActionObject.oldData.length
            ) {
                this.app.undoman.do(undoActionObject);
            }
            this.updateNode();
            if (!doNotDraw) {
                this.app.draw();
            } // on functions that already draw.
        },
    };

    toJObject(): object {
        let l = this.list.map((e) => e.toJObject());
        let o = {
            globalStyle: this.globalStyle,
            list: l,
        };
        return o;
    }

    assign(o: any): boolean {
        let JObjectList = o['list'];
        ObjectAssignProperty(this, o, 'globalStyle');
        let newList = JObjectList.map((e) =>
            MapLine.fromJObject(e, this.app, this.globalStyle)
        );
        this.list = newList;

        return true;
    }
}

export type MapPointDrawStyle = (
    {type: 'dot', scale: number, offset: number} | 
    {type: 'line', angle: number, scale: number, offset: number});

/** A point that can be drawed on the map */
export class MapPoint extends MapObject {
    p = Point.ZERO();
    drawStyle: MapPointDrawStyle = {type: 'dot', scale: 1.5, offset: 1};

    /** Creates a new line and sets its defining points. */
    static fromPoint(p: Point, app: App) {
        let x = new this(app);
        x.p.assign(p);
        return x;
    }

    getHoverMessageContent(): string {
        let position = this.app.mapMeta.sexagecimalCanvasPointToCoordPoint(this.p);
        return `P @ (${position.x}, ${position.y})`;
    }

    toJObject(): object {
        let o = {
            p: this.p,
            forceStatus: this.forceStatus,
        };
        if (this.globalStyle === null) {
            o['style'] = this.style;
        }

        return o;
    }

    /** Is this object had a global style, return true. */
    assign(o: any): boolean {
        this.p.assign(o.p);

        ObjectAssignProperty(this, o, 'forceStatus');

        let usesLocalStyle = ObjectAssignProperty(this, o, 'style');
        return usesLocalStyle;
    }

    /** Creates and assigns a new object. */
    static fromJObject(o: object, app: App, globalStyle?: MapObjectStyleList) {
        let x = new this(app);
        if (!x.assign(o) && globalStyle) {
            x.globalStyle = globalStyle;
        }
        return x;
    }

    /** Returns the distance from this line segment to the given point */
    getDistanceToPoint(p: Point) {
        return Point.Distance(this.p, p);
    }

    /** Returns the distance from this line segment to the given screen point. */
    getDistanceToScreenPoint(p: Point) {
        return Point.Distance(this.app.canvasPointToScreenPoint(this.p), p);
    }

    draw(context: CanvasRenderingContext2D) {
        let sp = this.app.canvasPointToScreenPoint(this.p);

        let styleList = this.getCurrentStyle();
        let selectedStyle: MapObjectStyle;
        if (this.state.disabled) {
            selectedStyle = styleList.disabled;
        } else if (this.state.active) {
            selectedStyle = styleList.active;
        } else if (this.state.hover) {
            selectedStyle = styleList.hover;
        } else {
            selectedStyle = styleList.normal;
        }

        context.save();

        let ds = this.drawStyle;
        if (ds.type = 'dot') {
            context.beginPath();
            let width = ds.scale * selectedStyle.width + ds.offset; 

            context.arc(sp.x, sp.y, width, 0, 2 * Math.PI, false);
    
            context.fillStyle = selectedStyle.color;
            context.fill();
    
            context.closePath();
        }

        context.restore();
    }

    getListNodeElementContent(index) {
        let p = document.createElement('p');
        let position = this.app.mapMeta.sexagecimalCanvasPointToCoordPoint(this.p);
        p.innerHTML = 
        `(${index + 1}) @(${position.x},${position.y})`;
        return p;
    }

    getEditNodeContent() {
        let outDiv = document.createElement('div');
        let l = document.createElement('label');
        l.innerText = 'Anchura: ';
        outDiv.appendChild(l);

        let i = document.createElement('input');
        i.setAttribute('type', 'number');
        i.setAttribute('min', '0');
        i.setAttribute('step', '0.25');
        i.setAttribute('value', this.style.normal.width.toString());
        $(i).change(() => {
            let w = parseFloat($(i).val().toString());
            this.style.normal.width = w;
            this.style.active.width = w + 2;
            this.style.hover.width = w + 2;
            this.app.draw();
        });
        outDiv.appendChild(i);

        return outDiv;
    }
}

/** MapPoint container with a few functions */
export class MapPointList extends MapObjectList {
    toolboxTooltips = {
        createElement: 'Crear nuevo punto.',
        deleteElement: 'Eliminar puntos seleccionados.',
    };

    toolbox = {
        createElement: () => {
            this.app.interman.clickMode.set('setPointMarker');
            this.app.interman.out.topMsgBar.set(
                'Click en un punto para marcarlo'
            );
        },
        deleteElement: (doNotDraw?: boolean) => {
            let undoActionObject: UndoRedoStackActionObject = {
                action: 'ModifyMapObjectListElement',
                source: this,
                data: undefined,
                oldData: this.list.filter((e) => true),
            };
            undoActionObject.data = this.deleteState('active').filter(
                (e) => true
            );
            if (
                undoActionObject.data.length != undoActionObject.oldData.length
            ) {
                this.app.undoman.do(undoActionObject);
            }
            this.updateNode();
            if (!doNotDraw) {
                this.app.draw();
            } // on functions that already draw.
        },
    };

    toJObject(): object {
        let l = this.list.map((e) => e.toJObject());
        let o = {
            globalStyle: this.globalStyle,
            list: l,
        };
        return o;
    }

    assign(o: any): boolean {
        let JObjectList = o['list'];
        ObjectAssignProperty(this, o, 'globalStyle');
        let newList = JObjectList.map((e) =>
            MapPoint.fromJObject(e, this.app, this.globalStyle)
        );
        this.list = newList;

        return true;
    }
}

/**
 * Point that goes inside MapLine and defines a topographic profile marker
 * It is VERY dependant on a MapLine, and cannot function properly without one.
 */
export class TopographicProfilePoint extends MapPoint {
    position: number = 0.5;
    height: number = 0;
    parentMapLine: MapLine;

    getHoverMessageContent(): string {
        return `d=${(
            this.position * this.parentMapLine.getLengthMetre()
        ).toFixed(2)}m (linea=${this.parentMapLine.getLengthMetre().toFixed(2)}m)`;
    }

    getCurrentStyle() {
        return this.parentMapLine.getCurrentStyle();
    }

    getPoint() {
        let l = this.parentMapLine.l;
        let dp = Point.Minus(l.p2, l.p1);
        return Point.BinaryOperation(l.p1, dp, (a, b) => a + this.position * b);
    }

    get p() {
        return this.getPoint();
    }

    set p(val) {} // ignore p values

    constructor(parentMapLine: MapLine, position: number, height: number) {
        super(parentMapLine.app);
        this.parentMapLine = parentMapLine;
        this.position = position;
        this.height = height;
    }

    static createDefault(parentMapLine: MapLine) {
        return new this(parentMapLine, 0.5, 0.0);
    }

    static fromCanvasPoint(
        parentMapLine: MapLine,
        canvasPoint: Point,
        height: number
    ) {
        let newPos = Line.NormalizedScalarPointProjection(
            parentMapLine.l,
            canvasPoint
        );

        newPos = Math.min(1, Math.max(0, newPos)); // Cap at line length
        return new this(parentMapLine, newPos, height);
    }

    toJObject() {
        let o = {
            position: this.position,
            height: this.height,
            forceStatus: this.forceStatus,
        };
        if (this.globalStyle === null) {
            o['style'] = this.style;
        }

        return o;
    }

    /** Is this object had a global style, return true. */
    assign(o: any): boolean {
        ObjectAssignProperty(this, o, 'position');
        ObjectAssignProperty(this, o, 'height');
        ObjectAssignProperty(this, o, 'forceStatus');

        let usesLocalStyle = ObjectAssignProperty(this, o, 'style');
        return usesLocalStyle;
    }

    /** Creates and assigns a new object. */
    static fromJObject(parentMapLine: MapLine, o: object) {
        let x = this.createDefault(parentMapLine);
        x.assign(o);
        return x;
    }

    getListNodeElementContent() {
        let p = document.createElement('p');
        p.innerHTML = `d = ${(
            this.position * this.parentMapLine.getLengthMetre()
        ).toFixed(2)} m, h = ${this.height.toFixed(2)} m`;
        return p;
    }
}

/** MapPoint container with a few functions */
export class TopographicProfilePointList extends MapPointList {
    parentMapLine: MapLine;
    list: TopographicProfilePoint[];

    toolboxTooltips = {
        createElement: 'Crear nuevo punto topografico.',
        deleteElement: 'Eliminar los puntos topograficos seleccionados.',
    };

    constructor(parentMapLine: MapLine) {
        super(parentMapLine.app);
        this.parentMapLine = parentMapLine;
    }

    toolbox = {
        createElement: () => {
            let im = this.app.interman;
            let tt = im.temp.topoPointTool;
            im.clickMode.set('setTopographicPoint');
            im.out.topMsgBar.set(
                'Click para marcar un punto del perfil topografico.'
            );
            tt.sourceLine = this.parentMapLine;
            tt.draftLine.app = this.app;
            tt.draftLine.l.p1 = this.app.mouse.canvasSnap;
            tt.draftLine.l.p2 = Line.PointProjection(this.parentMapLine.l, this.app.mouse.canvasSnap);
        },
        deleteElement: (doNotDraw?: boolean) => {
            let undoActionObject: UndoRedoStackActionObject = {
                action: 'ModifyMapObjectListElement',
                source: this,
                data: undefined,
                oldData: this.list.filter((e) => true),
            };
            undoActionObject.data = this.deleteState('active').filter(
                (e) => true
            );
            if (
                undoActionObject.data.length != undoActionObject.oldData.length
            ) {
                this.app.undoman.do(undoActionObject);
            }
            this.updateNode();
            if (!doNotDraw) {
                this.app.draw();
            } // on functions that already draw.
        },
    };

    toJObject(): object {
        let l = this.list.map((e) => e.toJObject());
        let o = {
            list: l,
        };
        return o;
    }

    assign(o: any): boolean {
        let JObjectList = o['list'];
        let newList = JObjectList.map((e) =>
            TopographicProfilePoint.fromJObject(this.parentMapLine, e)
        );
        this.list = newList;

        return true;
    }

    _addExtra() {
        this.sortList();
    }

    /** Sorts the list of topographical profile points. */
    sortList() {
        return this.list.sort((a, b) => a.position - b.position);
    }

    /** Reverses the position of each point (E.g. p=12% becomes p=88%) */
    reverseList() {
        this.list.forEach((e) => (e.position = 1 - e.position));
        this.sortList();
        this.updateNode();
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
    _getDataAsTableArray() {
        let rows = [];
        let totalLength = this.parentMapLine.getLengthMetre();
        let mapMeta = this.app.mapMeta;
        let formatAsCoords = (p: Point) => mapMeta.sexagecimalCanvasPointToCoordPoint(p);
        for(let i = this.list.length; i--; ) {
            let currentPoint = this.list[i];
            let d = currentPoint.position * totalLength;
            let h = currentPoint.height;
            let coords = formatAsCoords(currentPoint.p);
            rows.push([d,h,coords.x,coords.y,currentPoint.position]);
        }
        rows.push(['Distancia [m]','Altura [m]','Longitud', 'Latitud', 'Posicion [%]']);
        return rows.reverse();
    }

    /** Creates a csv blob from this object */
    _toCsv() {
        // TODO: Move this to Utils
        let data = this._getDataAsTableArray();
        return 'data:text/csv;charset=utf-8,\ufeff' // extra BOM character, cuz excel recognizes CSV files as ASCII 
        + data.map(e => e.join(',')).join('\n');
    }

    /** Prompts download of a csv file containing this topographical profile's data. */
    _downloadCsv() {
        var encodedUri = encodeURI(this._toCsv());
        var link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `perfil_topografico_${this.app.mapLoader.currentMap}.csv`);
        //document.body.appendChild(link); // Required for FF

        link.click();
    }

    _extraNodeButtons(editNode: HTMLElement) {
        lineBreak(editNode);

        createButton(editNode, 'Reverse', () => {
            this.parentMapLine.l.flip();
            this.reverseList();
            this.app.draw();
        }, 'Invertir el orden de los puntos. Ej. en vez de A a B, sera de B a A.');

        createButton(editNode, 'Descargar', () => {
            this._downloadCsv(); // TODO: Change to Util.downloadBlob();
        }, 'Descargar la lista de puntos topograficos de esta linea en formato .csv');

    }
}

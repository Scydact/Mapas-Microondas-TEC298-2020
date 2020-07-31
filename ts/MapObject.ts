import {
    Restorable,
    ObjectAssignProperty,
    createButton,
    createElement,
    createLabel,
    lineBreak,
    svgToPng,
    downloadUri,
    downloadBlob,
    getSvgUrl,
    downloadUrl,
    TopoCalculator,
    formatEng,
} from './Utils.js';
import { Point, UnaryOperator } from './Point.js';
import { App } from './App.js';
import { Line } from './Line.js';
import { UndoRedoStackActionObject } from './UndoRedoManager.js';
import { map } from 'jquery';

declare var SVGInject: any;
declare var XLSX: any;

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

    /** Called when setState or flipState is used */
    _StateChanged(state: MapObjectState, newValue: boolean) {}

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
        this._StateChanged(state, value);
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
     * @param value Optional, gets states with this value. Defaults to true.
     */
    getState(state: MapObjectState, value?: boolean) {
        if (value === undefined) value = true;

        if (value) {
            return this.list.filter((e) => e.getState(state));
        } else {
            return this.list.filter((e) => !e.getState(state));
        }
    }

    /**
     * Sets the state of all objects inside to the given value.
     * Direct replacement to deselectAll();
     */
    setState(state: MapObjectState, value: boolean) {
        this.list.forEach((e) => e.setState(state, value));
        return this.list;
    }

    /**
     * Deletes all the elements that are in the given state.
     * Direct replacement to deleteActive();
     * @param state State to filter.
     * @param value Deletes states with this value.
     */
    deleteState(state: MapObjectState, value?: boolean) {
        if (value === undefined) value = true;
        this.list = this.getState(state, !value);
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

    /** Called after updateNode. */
    _extraNode() {}

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
                    obj.setState('hover', true);
                    this.app.draw();
                });

                divJQuery.on('mouseout', () => {
                    obj.setState('hover', false);
                    this.app.draw();
                });

                // Append to the actual list.
                this.node.appendChild(div);
            }
            this._extraNode();
            return true;
        }
        return false;
    }

    /** Called after adding basic buttons. */
    _extraNodeButtons(toolNode: HTMLElement) {}

    /** Recreates the tool buttons (add, remove...) for the list. */
    updateNodeButtons(toolNode: HTMLElement) {
        if (toolNode) {
            toolNode.innerHTML = '';

            let AddRemoveDiv = createElement(toolNode, 'div');
            AddRemoveDiv.classList.add('btnGroup');

            createButton(
                AddRemoveDiv,
                //'+',<div id=zoomPlus class='floatingButton'><i class="fas fa-plus" style="font-size: 0.75em;"></i></div>
                '<i class="fas fa-plus" style="font-size: 0.75em;"></i>',
                () => this.toolbox.createElement(),
                this.toolboxTooltips.createElement
            );
            createButton(
                AddRemoveDiv,
                //'-',
                '<i class="fas fa-minus" style="font-size: 0.75em;"></i>',
                () => this.toolbox.deleteElement(),
                this.toolboxTooltips.deleteElement
            );

            createButton(
                toolNode,
                '<i class="fas fa-check-square"></i><span>Seleccionar todos</span>',
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
                '<i class="fas fa-adjust"></i><span>Invertir selección</span>',
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

    _StateChanged(state: MapObjectState, value: boolean) {
        if (state == 'active' && !value) {
            this.topoPoints.setState('active', false);
            this.topoPoints.setState('hover', false);
        } else if (state == 'hover' && !this.state.active)
            this.topoPoints.setState('hover', value);
    }

    /** Creates a new line and sets its defining points. */
    static fromPoints(p1: Point, p2: Point, app: App) {
        let x = new this(app);
        x.l.p1 = p1;
        x.l.p2 = p2;
        return x;
    }

    getHoverMessageContent(): string {
        if (this.app.DEBUG) {
            let x = this.app as any;
            x.HOVER_LINE_LENGTH = this.getLengthMetre(); // DEBUG, used for adding distances
        }
        let d = this.getFormattedLength();
        return 'L @ d = ' + d;
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

    /** Returns the length of this line, in canvas units */
    getLength() {
        return this.l.length();
    }

    /** Returns the length of this line, in metres. */
    getLengthMetre() {
        return this.app.DistanceUtils.canvas2metre(this.l.length());
    }

    /** Returns the distance formatted in the units specified on  */
    getFormattedLength() {
        return this.app.DistanceFormat.canvas2unit(this.l.length());
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
        // devicePixelRatio for device zooming & mobile support
        context.lineWidth = devicePixelRatio * selectedStyle.width;

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
        p.innerHTML = `(${index + 1}) d = ${this.getFormattedLength()}`;
        return p;
    }

    getEditNodeContent(): HTMLElement {
        let outDiv = document.createElement('div');

        createLabel(outDiv, `Longitud de linea: ${this.getFormattedLength()}`);
        lineBreak(outDiv);
        if (false) {
            // Width
            createLabel(outDiv, 'Anchura: ');

            let inputWidth = createElement(outDiv, 'input');
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

        if (false) {
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
            createElement(outDiv, 'h2', 'Perfil topografico: ');
            lineBreak(outDiv);

            //createElement(outDiv, 'span','(Click en la imagen para descargarla.)');
            let topoRender = createElement(outDiv, 'div');
            this.topoPoints.nodeRender = topoRender;
            this.topoPoints.updateNodeRender();
            $(topoRender).on('click', () => {
                let d = document.createElement('div');
                let i = createElement(d, 'img') as HTMLImageElement;
                i.style.width = '80vw';
                i.style.height = '80vh';
                i.style.objectFit = 'contain';

                let url = getSvgUrl(this.topoPoints.mySvg.outerHTML);
                i.onload = () => URL.revokeObjectURL(url);
                i.src = url;

                let footer = createElement(d, 'div');
                footer.classList.add('footerButtonWrapper');
                createButton(
                    footer,
                    'Descargar SVG',
                    () => this.topoPoints._downloadSvg(),
                    'Descargar la imagen en formato vectorial SVG.'
                );
                createButton(
                    footer,
                    'Descargar PNG',
                    () => this.topoPoints._downloadPng(),
                    'Descargar la imagen en formato bitmap PNG.'
                );
                this.app.interman.out.dialog.createOkButton(footer);
                this.app.interman.out.dialog.setNode(d, false);
            });

            lineBreak(outDiv);

            let toolDiv = createElement(outDiv, 'div');
            toolDiv.classList.add('buttonWrapper');
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
            this.app.interman.out.topMsg.set(
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

export type MapPointDrawStyle =
    | { type: 'dot'; scale: number; offset: number }
    | { type: 'line'; angle: number; scale: number; offset: number };

/** A point that can be drawed on the map */
export class MapPoint extends MapObject {
    p = Point.ZERO();
    drawStyle: MapPointDrawStyle = { type: 'dot', scale: 1.5, offset: 1 };

    /** Creates a new line and sets its defining points. */
    static fromPoint(p: Point, app: App) {
        let x = new this(app);
        x.p.assign(p);
        return x;
    }

    getHoverMessageContent(): string {
        let position = this.app.mapMeta.sexagecimalCanvasPointToCoordPoint(
            this.p
        );
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
        if ((ds.type = 'dot')) {
            context.beginPath();
            // devicePixelRatio for device zooming & mobile support
            let width =
                devicePixelRatio * ds.scale * selectedStyle.width + ds.offset;

            context.arc(sp.x, sp.y, width, 0, 2 * Math.PI, false);

            context.fillStyle = selectedStyle.color;
            context.fill();

            context.closePath();
        }

        context.restore();
    }

    getListNodeElementContent(index) {
        let p = document.createElement('p');
        let position = this.app.mapMeta.sexagecimalCanvasPointToCoordPoint(
            this.p
        );
        p.innerHTML = `(${index + 1}) @(${position.x},${position.y})`;
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
            this.app.interman.out.topMsg.set('Click en un punto para marcarlo');
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
        let dp = this.app.DistanceFormat.canvas2unit(
            this.position * this.parentMapLine.l.length(),
            false
        );
        let dl = this.parentMapLine.getFormattedLength();
        return `PT @ d = ${dp} / ${dl}`;
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
        let dp = this.app.DistanceFormat.canvas2unit(
            this.position * this.parentMapLine.getLength()
        );
        p.innerHTML = `d = ${dp}, h = ${this.height} m`;
        return p;
    }
}

/** MapPoint container with a few functions */
export class TopographicProfilePointList extends MapPointList {
    parentMapLine: MapLine;
    list: TopographicProfilePoint[];

    /* SVG Data */
    nodeRender: HTMLElement;
    mySvg: HTMLElement;
    myPolyline: HTMLElement;
    myRectangle: HTMLElement;
    myLine: HTMLElement;
    myTextAltitud1: HTMLElement;
    myTextAltitud2: HTMLElement;
    myTextDistancia: HTMLElement;

    /** Data to do Fresnel radius calculation */
    Fresnel = {
        /** n-th Fresnel radius */
        n: 1,
        /** 
         * Distance from first/last point (relative from 0% to 100%).
         * 
         * Note: It doesnt matter if it is from the start or the end, 
         * because the calculation is symmetrical. E.g., Fn(0.3) == Fn(0.7).
         */
        d: 0.5,
        /** If true, distance input will be shown as percent instead 
         * of as calculated distance (in the info pane) */
        showAsPercent: false,
    }


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
            im.out.topMsg.set(
                'Click para marcar un punto del perfil topografico.'
            );
            tt.sourceLine = this.parentMapLine;
            tt.draftLine.app = this.app;
            tt.draftLine.l.p1 = this.app.mouse.canvasSnap;
            tt.draftLine.l.p2 = Line.PointProjection(
                this.parentMapLine.l,
                this.app.mouse.canvasSnap
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

            this.updateNodeRender(); // Somehow, it is called on element creation but not on deletion.
        },
        createElementPrompt: (canvasPoint: Point) => {
            let d = document.createElement('div');
            createElement(d, 'h3', 'Crear punto topográfico');
            createLabel(d, 'Altura del punto marcado [m]: ');
            let input = createElement(d, 'input') as HTMLInputElement;
            input.setAttribute('type', 'number');

            let diag = this.app.interman.out.dialog;

            let f = diag.createFooterButtonWrapperNode(d);

            let cancelCallback = () => {
                diag.clear();
            };
            let okCallback = () => {
                let hTxt = input.value;
                let n = parseFloat(hTxt);
                if (n !== NaN) {
                    let targetLine = this.parentMapLine;
                    targetLine.topoPoints.add(
                        TopographicProfilePoint.fromCanvasPoint(
                            targetLine,
                            canvasPoint,
                            n
                        )
                    );
                    targetLine.topoPoints.updateNodeRender();
                    this.app.draw();
                }
                diag.clear();
            };

            createButton(f, 'Cancelar', cancelCallback);
            createButton(f, 'OK', okCallback).classList.add('primary');

            diag.setNode(d, false);
            diag.callback = (code) => {
                if (code) okCallback();
                else cancelCallback();
                diag.clear();
            }
            input.focus();
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

    _extraNode() {}

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
        let formatAsCoords = (p: Point) =>
            mapMeta.sexagecimalCanvasPointToCoordPoint(p);
        for (let i = this.list.length; i--; ) {
            let currentPoint = this.list[i];
            let d = currentPoint.position * totalLength;
            let h = currentPoint.height;
            let coords = formatAsCoords(currentPoint.p);
            rows.push([Math.round(d), h, coords.x, coords.y]);
        }
        rows.push(['Distancia [m]', 'Altura [m]', 'Longitud', 'Latitud']);
        return rows.reverse();
    }

    _getDownloadName() {
        return `perfil_topografico_${this.app.mapLoader.currentMap}`;
    }

    /** Creates a csv blob from this object */
    _toCsv() {
        // TODO: Move this to Utils
        let data = this._getDataAsTableArray();
        let dataStr = data.map((e) => e.join('\t')).join('\n');
        return 'data:text/csv;charset=UTF-8,sep=\t\n' + dataStr;
    }

    /** Prompts download of a .csv file containing this topographical profile's data. */
    _downloadCsv() {
        var fileName = this._getDownloadName() + '.csv';
        var csvStr = this._toCsv();
        downloadUri(csvStr, fileName);
    }

    /** Creates excel (xlsx) binary data from this object */
    _toXlsx() {
        var mapName = this.app.mapMeta.name;
        var wb = XLSX.utils.book_new();
        wb.Props = {
            Title: `Perfil topografico en ${mapName}`,
        };
        wb.SheetNames.push(mapName);

        var ws_data = this._getDataAsTableArray();
        var ws = XLSX.utils.aoa_to_sheet(ws_data);
        wb.Sheets[mapName] = ws;

        var wb_out = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        return wb_out;
    }

    /** Prompts download of a .xlsx file containing this topographical profile's data. */
    _downloadXlsx() {
        var fileName = this._getDownloadName() + '.xlsx';
        var s = this._toXlsx();

        // Convert binary data to octet stream
        var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        var view = new Uint8Array(buf); //create uint8array as viewer
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff; //convert to octet

        // Download
        let blob = new Blob([buf], { type: 'application/octet-stream' });
        downloadBlob(blob, fileName);
    }

    _downloadPng() {
        let s = this.mySvg as any;
        try {
            // Firefox needs these attributes to render the image.
            s.setAttribute('width', s.width.baseVal.value);
            s.setAttribute('height', s.height.baseVal.value);
            // Chrome doesnt even need/have this, so it will throw error...
        } catch (e) {}

        svgToPng(s.outerHTML, (data) => {
            downloadUri(data, this._getDownloadName() + '.png');
        });

        // Remove the Firefox's attributes, so image can autoscale again.
        s.removeAttribute('width');
        s.removeAttribute('height');
    }

    _downloadSvg() {
        let url = getSvgUrl(this.mySvg.outerHTML);
        downloadUrl(url, this._getDownloadName() + '.svg');
        URL.revokeObjectURL(url);
    }

    _extraNodeButtons(editNode: HTMLElement) {
        lineBreak(editNode);

        createButton(
            editNode,
            '<i class="fas fa-exchange-alt"></i><span>Invertir A/B</span>',
            () => {
                this.parentMapLine.l.flip();
                this.reverseList();
                this.app.draw();
                this.updateNodeRender();
            },
            'Invertir el orden de los puntos de inicio/fin. Ej. en vez de A a B, sera de B a A.'
        );

        createButton(
            editNode,
            '<i class="fas fa-file-download"></i><span>Descargar perfil</span>',
            () => {
                let d = document.createElement('div');
                createElement(d, 'h1', 'Descargar perfil topografico');
                let btnWrap = createElement(d, 'div');
                btnWrap.classList.add('grid-2-cols');
                btnWrap.style.width = '100%';

                createButton(
                    btnWrap,
                    '<i class="fas fa-file-excel"></i><span>Descargar Excel</span>',
                    () => {
                        this._downloadXlsx();
                    },
                    'Descargar la lista de puntos topográficos de esta linea en formato .xlsx'
                );
                createButton(
                    btnWrap,
                    '<i class="fas fa-file-image"></i><span>Descargar PNG</span>',
                    () => this._downloadPng(),
                    'Descargar el perfil topográfico ya graficado (formato .png)'
                );
                createButton(
                    btnWrap,
                    '<i class="fas fa-file-csv"></i><span>Descargar CSV</span>',
                    () => this._downloadCsv(),
                    'Descargar el perfil topográfico en formato .csv separado por tabulación.'
                );
                createButton(
                    btnWrap,
                    '<i class="fas fa-bezier-curve"></i><span>Descargar SVG</span>',
                    () => this._downloadSvg(),
                    'Descargar el perfil topográfico ya graficado (formato .svg)'
                );

                this.app.interman.out.dialog.setNode(d);
            },
            'Descargar el perfil seleccionado en varios formatos.'
        );

        createButton(
            editNode,
            '<i class="fas fa-info-circle"></i><span>Info</span>',
            () => this._infoDialog(),
            'Informacion sobre la linea.'
        );
    }

    _infoDialog() {
        let diag = this.app.interman.out.dialog;

        let d = document.createElement('div');
        createElement(d, 'h1', 'Información');

        // 2 col grid
        let g = createElement(d, 'div');
        g.style.display = 'grid';
        g.style.gridTemplateColumns = 'auto auto';
        g.style.gridAutoRows = '1fr';
        g.style.columnGap = '1rem';
        g.style.justifyItems = 'end';
        g.style.alignItems = 'center';

        let divide = (parentNode: HTMLElement) => {
            let s = createElement(parentNode,'span');
            s.style.background = 'black';
            s.style.gridColumn = '1 / 3';
            s.style.width = '100%';
            s.style.height = '1px';
            return s;
        }

        createElement(g,'span','Longitud de linea: ');
        createElement(g,'span',this.parentMapLine.getFormattedLength());

        let data = this._getDataAsPointList();
        if (data.length > 1) {
            let n = data.length;
            let h1 = data[0].y;
            let h2 = data[n - 1].y;
            let dh = h2 - h1;
            let dd = data[n - 1].x - data[0].x;
            
            let min_h = Infinity;
            let max_h = -Infinity;
            data.forEach((e) => {
                if (min_h > e.y) min_h = e.y;
                if (max_h < e.y) max_h = e.y;
            })
            let abs_dh = max_h - min_h;

            /** Converts metres to canvasUnits (data.x is in metres) */
            let m2u = (d) => this.app.DistanceUtils.unit2canvas(d, 'm');
            /** Converts canvasUnits to a formatted string */
            let u2str = (d) => this.app.DistanceFormat.canvas2unit(d);
            /** Formats a number in metre (rounds and adds 'm') */
            let m2str = (d) => this.app.DistanceFormat.round(d) + ' m';

            divide(g);

            createElement(g,'span','Longitud entre A/B: ');
            createElement(g,'span',u2str(m2u(dd)));

            createElement(g,'span','Altura A: ');
            createElement(g,'span',m2str(h1));

            createElement(g,'span','Altura B: ');
            createElement(g,'span',m2str(h2));

            createElement(g,'span','Diferencia de altura A/B: ');
            createElement(g,'span',m2str(Math.abs(dh)));

            createElement(g,'span','Diferencia entre mayor y menor altitud: ');
            createElement(g,'span',m2str(abs_dh));

            divide(g);
            /**
             * Ask for: FREQ
             * Perdidas espacio libre
             * Maxima distancia permisible
             * Reflexion
             * Radio de Fresnel <n> a <d> desde <A||B>
             * Verificacion de obstaculos (en cada punto)
             */

            let round = (n: number) => n.toFixed(this.app.settings.calcDigits);
            let f = this.app.settings.calcFrequency;

            createElement(g,'span','Frecuencia de operación: ');
            let opFrecSpan = diag.createEngineerNumberInput(
                (code, str, num) => {
                    this.app.settings.prop('calcFrequency', num);
                    diag.clear();
                    this._infoDialog();
                },
                f,
                'Hz',
                'Frecuencia de operacion: ',
                3,
                false
            );
            g.appendChild(opFrecSpan);

            let x;
            createElement(g,'span','Perdidas de espacio libre: ');
            x = TopoCalculator.freeSpaceLossDB(dd,f);
            createElement(g,'span',`${round(x)} dB @ d=${u2str(m2u(dd))} & f=${formatEng(f, 'Hz')}`);

            createElement(g, 'span','Máxima distancia permisible: ');
            x = TopoCalculator.maxPermisibleDistance(data[0].y, data[n-1].y);
            createElement(g,'span',`${u2str(m2u(x))} @ h1=${h1} m & h2=${h2} m`);
            
            createElement(g, 'span','Punto de reflexión: ');
            x = TopoCalculator.reflectionPoint(dd, h1, h2);
            createElement(g,'span',`[A] -- ${u2str(m2u(x[0]))} -- [P] -- ${u2str(m2u(x[1]))} -- [B]`);

            createElement(g, 'span','Maximo radio de Fresnel[n1]: ');
            x = TopoCalculator.fresnelRadius(dd/2, dd/2, f, 1);
            createElement(g,'span',m2str(x));

        }

        diag.setNode(d);
    }

    /** Returns a point array {x: distanceFromStart, y: height} */
    _getDataAsPointList() {
        let out = [] as Point[];
        let totalLength = this.parentMapLine.getLengthMetre();
        this.list.forEach((currentPoint) => {
            let d = currentPoint.position * totalLength;
            let h = currentPoint.height;
            out.push(new Point(d, h));
        });
        return out;
    }

    /** Generates this.mySvg and this.myPolyline */
    async _generateSvgNode() {
        if (!this.mySvg) {
            let i = document.createElement('img');
            i.src = 'PERFIL TOPO.svg';
            i.id = 'perfilTopo';
            i.title = 'Click para descargar la imagen.';
            this.nodeRender.appendChild(i);
            await SVGInject(i);
            this.mySvg = document.getElementById('perfilTopo');
            if (!this.mySvg) return; // In case the original svg is not loaded...
            this.mySvg.id = ''; // remove Id...

            {
                let p = document.createElement('polyline');
                p.setAttribute('style', 'fill:none;stroke:red;stroke-width:2');

                this.mySvg.appendChild(p);
                this.myPolyline = p;
            }
            {
                let p = document.createElement('rect');
                p.setAttribute('style', 'fill:none;stroke:red;stroke-width:2');
                p.setAttribute('x', '417.10');
                p.setAttribute('y', '448.13');
                p.setAttribute('width', '57.19');
                p.setAttribute('height', '10.70');

                this.mySvg.appendChild(p);
                this.myRectangle = p;
            }
            {
                let p = document.createElement('line');
                p.setAttribute(
                    'style',
                    'fill:none;stroke:red;stroke-width:1;stroke-dasharray:4'
                );
                this.mySvg.appendChild(p);
                this.myLine = p;
            }
            let textStyle =
                'fill: red; font: 10px "Segoe UI", "Segoe", Helvetica, Arial, sans-serif';
            {
                let p = document.createElement('text');
                p.setAttribute('style', textStyle);
                p.setAttribute('x', '305.78');
                p.setAttribute('y', '530.60');
                p.setAttribute('text-anchor', 'end');

                this.mySvg.appendChild(p);
                this.myTextAltitud1 = p;
            }
            {
                let p = document.createElement('text');
                p.setAttribute('style', textStyle);
                p.setAttribute('x', '623.40');
                p.setAttribute('y', '530.60');
                p.setAttribute('text-anchor', 'end');

                this.mySvg.appendChild(p);
                this.myTextAltitud2 = p;
            }
            {
                let p = document.createElement('text');
                p.setAttribute('style', textStyle);
                p.setAttribute('x', '623.40');
                p.setAttribute('y', '530.60');
                p.setAttribute('text-anchor', 'end');

                this.mySvg.appendChild(p);
                this.myTextAltitud2 = p;
            }
            {
                let p = document.createElement('text');
                p.setAttribute('style', textStyle);
                p.setAttribute('x', '460.17');
                p.setAttribute('y', '519.11');
                p.setAttribute('text-anchor', 'end');

                this.mySvg.appendChild(p);
                this.myTextDistancia = p;
            }
        }
        return this.mySvg;
    }

    async updateNodeRender() {
        if (this.nodeRender) {
            this.nodeRender.innerHTML = '';

            if (!this.mySvg) {
                await this._generateSvgNode();
            }

            //#region get Points and scale
            let pointList = this._getDataAsPointList();

            let h_min = Infinity;
            let h_max = -Infinity;
            let d_min = Infinity;
            let d_max = -Infinity;
            pointList.forEach((p) => {
                let d = p.x;
                let h = p.y;
                if (d > d_max) d_max = d;
                if (d < d_min) d_min = d;
                if (h > h_max) h_max = h;
                if (h < h_min) h_min = h;
            });

            let dh = h_max - h_min;
            let dd = d_max - d_min;

            // Choose scale (A = 240/4000, B=120/1000, C=60/250)
            const scales = {
                A: [240e3, 4e3],
                B: [120e3, 1e3],
                C: [60e3, 250],
            };
            let selectedScaleIndex = 'A';
            if (dh <= scales.C[1] * 1.1 && dd <= scales.C[0])
                selectedScaleIndex = 'C';
            else if (dh <= scales.B[1] * 1.1 && dd <= scales.B[0])
                selectedScaleIndex = 'B';

            let selectedScale = scales[selectedScaleIndex];
            switch (selectedScaleIndex) {
                case 'A':
                    this.myRectangle.setAttribute('y', '448.13');
                    break;
                case 'B':
                    this.myRectangle.setAttribute('y', '458.28');
                    break;
                case 'C':
                    this.myRectangle.setAttribute('y', '468.73');
                    break;
            }

            // Scale the points according to scale
            let p1 = new Point(90.81, 485.91); // Lower left
            let p2 = new Point(733.45, 161.32); // Upper right
            let pc = new Point(412.13, 1176.85); // Circle point (for curvature)
            let pr = 762; // Circle radius (for curvature)
            let pd = Point.Minus(p2, p1);
            let mappedPointList = pointList.map((p) => {
                let x = ((p.x - d_min) * pd.x) / selectedScale[0] + p1.x;
                let y_t = ((p.y - h_min) * pd.y) / selectedScale[1];
                let y = -Math.sqrt(pr ** 2 - (x - pc.x) ** 2) + pc.y + y_t;
                return new Point(x, y);
            });

            // Create polyline string
            let polyStr = '';
            if (mappedPointList.length > 1) {
                let l = mappedPointList.length;
                for (let i = 0; i < l; i++) {
                    polyStr += `${mappedPointList[i].x.toFixed(
                        2
                    )},${mappedPointList[i].y.toFixed(2)} `;
                }

                // Add start-end line
                this.myLine.setAttribute('x1', mappedPointList[0].x.toFixed(2));
                this.myLine.setAttribute('y1', mappedPointList[0].y.toFixed(2));
                this.myLine.setAttribute(
                    'x2',
                    mappedPointList[l - 1].x.toFixed(2)
                );
                this.myLine.setAttribute(
                    'y2',
                    mappedPointList[l - 1].y.toFixed(2)
                );

                this.myTextAltitud1.innerHTML = pointList[0].y.toString();
                this.myTextAltitud2.innerHTML = pointList[l - 1].y.toString();
                this.myTextDistancia.innerHTML = (dd / 1e3).toFixed(2);
            } else {
                this.myRectangle.setAttribute('y', '-100'); // yeet it out

                this.myLine.removeAttribute('x1');
                this.myLine.removeAttribute('y1');
                this.myLine.removeAttribute('x2');
                this.myLine.removeAttribute('y2');

                this.myTextAltitud1.innerHTML = '';
                this.myTextAltitud2.innerHTML = '';
                this.myTextDistancia.innerHTML = '';
            }
            this.myPolyline.setAttribute('points', polyStr);

            //#endregion

            this.nodeRender.appendChild(this.mySvg);
            this.nodeRender.innerHTML += ' ';
        }
    }
}

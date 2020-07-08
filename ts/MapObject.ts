import { Restorable, ObjectAssignProperty, createButton, createElement } from './Utils.js';
import { Point } from './Point.js';
import { App } from './App.js';
import { Line } from './Line.js';

//#region Generics
/** Stype definition for a MapObject. Used in draw() */
type MapObjectStyle = {
    color: string;
    width: number;
    type: string;
    [key: string]: any;
};

/** Style container used to draw the corresponding MapObject */
type MapObjectStyleList = {
    normal: MapObjectStyle;
    hover: MapObjectStyle;
    active: MapObjectStyle;
    disabled: MapObjectStyle;
    [key: string]: any;
};

/** Possible mapObject interactivity states */
type MapObjectState = 'normal' | 'hover' | 'active' | 'disabled';

/** Generic MapObject that can be drawn, saved, and restored. */
abstract class MapObject implements Restorable {
    /** The current interaction status of this object */
    state = {
        hover: false,
        active: false,
        disabled: false,
    };

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
    abstract getListNodeElementContent(index?: number, array?: any[]): HTMLElement;
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
abstract class MapObjectList<T extends MapObject> implements Restorable{
    list: T[] = [];
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
        createElement: string,
        deleteElement: string,
    }

    abstract toolbox: {
        createElement: Function,
        deleteElement: Function,
    }

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
            return this.list.filter((e) => (!e.state[state]));
        } else {
            return this.list.filter((e) => (e.state[state]));
        }
    }

    /** 
     * Sets the state of all objects inside to the given value. 
     * Direct replacement to deselectAll();
     */
    setState(state: MapObjectState, value: boolean) {
        this.list.forEach((e) => e.state[state] = value)
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
        this.list.forEach((e) => e.state[state] = !e.state[state]);
        return this.list;
    }

    /** Pushes the given MapObject to this list. */
    add(object: T) {
        object.globalStyle = this.globalStyle;
        this.list.push(object);
        this.updateNode();
    }

    /** Evaluates each element's getDistanceToScreenPoint() */
    getCloseToScreenPoint(p, distance) {
        return this.list.filter((e) => (e.getDistanceToScreenPoint(p) < distance));
    }

    abstract toJObject():object
    //  {
    //     let l = this.list.map((e) => e.toJObject());
    //     let o = {
    //         globalStyle: this.globalStyle,
    //         list: l
    //     };
    //     return o;
    // }

    abstract assign(o): boolean 
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
            this.node.innerHTML = "";
            let T = this;

            for (let i = 0; i < this.list.length; i++) {
                let obj = this.list[i];

                let div = document.createElement('div');
                let divJQuery = $(div);

                if (obj.state.active) {divJQuery.addClass('active')}
                if (obj.state.hover) {divJQuery.addClass('hover')}
                if (obj.state.disabled) {divJQuery.addClass('disabled')}

                let ElementContents = obj.getListNodeElementContent(i, this.list);
                div.appendChild(ElementContents);

                // Events
                divJQuery.addClass('objectList') // TODO: change lineList to objectList on css
                divJQuery.on('click', () => {
                    if (!this.app.interman.modifier.shift) {this.setState('active', false)}
                    obj.state.active = !obj.state.active;

                    if (obj.state.active) {divJQuery.addClass('active')}
                    else {divJQuery.removeClass('active')}

                    this.app.draw();
                })

                divJQuery.on("mouseover", () => {
                    obj.state.hover = true;
                    this.app.draw();
                });

                divJQuery.on("mouseout", () => {
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

    /** Recreates the tool buttons (add, remove...) for the list. */
    updateNodeButtons(toolNode: HTMLElement) {
        if (toolNode) {
            toolNode.innerHTML = '';

            createButton(toolNode, '+', () => this.toolbox.createElement(), this.toolboxTooltips.createElement);
            createButton(toolNode, '-', () => this.toolbox.deleteElement(), this.toolboxTooltips.deleteElement);

            createButton(toolNode, 'Todos', () => {
                let elements = this.list;
                let activeElements = this.getState('active');

                // Deselect all if everything is already selected
                let allActiveState = !(activeElements.length == elements.length);
                this.setState('active', allActiveState);
                this.updateNode();
                this.app.draw();
            }, 'Selecciona/deselecciona todos los elementos de la lista.');
    
            createButton(toolNode, 'Invertir', () => {
                this.flipState('active');
                this.updateNode();
                this.app.draw();
            }, 'Invierte la seleccion de la lista.');

        }
    }
}

//#endregion

/** A line that can be drawed on the map */
export class MapLine extends MapObject {
    l: Line;
    divisions = 0;

    /** Creates a new line and sets its defining points. */
    static fromPoints(p1: Point, p2: Point, app: App) {
        let x = new this(app);
        x.l = new Line(p1, p2);
        return x;
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

        return o;
    }

    /** Is this object had a global style, return true. */
    assign(o: any): boolean {
        this.l = Line.fromObject(o.l);

        ObjectAssignProperty(this, o, 'divisions');
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

    /** Returns the distance from this line to the given point, supposing that this line is infinite. */
    getDistanceToPointAsInfiniteLine(ps: Point) {
        let pl = this.getGetLineAtScreenPoints();
        let denominator = Point.Distance(pl.p1, pl.p2);
        let numerator = Math.abs(
            (pl.p2.y - pl.p1.y) * ps.x 
            -(pl.p2.x - pl.p1.x) * ps.y
            + pl.p2.x * pl.p1.y
            - pl.p2.y * pl.p1.x);
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

        let styleList = this.globalStyle ? this.globalStyle : this.style;
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
        let p = document.createElement("p");
        p.innerHTML = `(${index+1}) d=${this.getLengthMetre().toFixed(2)}m`;
        return p;
    }
}

export class MapLineList extends MapObjectList<MapLine> {
    toolboxTooltips = { 
        createElement: 'Crear nueva linea.', 
        deleteElement: 'Eliminar lineas seleccionadas.' 
    };

    toolbox = {
        createElement: () => {
            this.app.interman.clickMode.set('setLinePoint1');
            this.app.interman.out.topMsgBar.set('Click en el 1er punto de la linea');
        },
        deleteElement: () => {
            this.deleteState('active');
            this.updateNode();
            this.app.draw();
        }
    }

    toJObject(): object {
        let l = this.list.map((e) => e.toJObject());
        let o = {
            globalStyle: this.globalStyle,
            list: l
        };
        return o;
    }

    assign(o: any): boolean {
        let JObjectList = o['list'];
        ObjectAssignProperty(this, o, 'globalStyle');
        let newList = JObjectList.map((e) => MapLine.fromJObject(e, this.app, this.globalStyle));
        this.list = newList;

        return true;
    };


    
}
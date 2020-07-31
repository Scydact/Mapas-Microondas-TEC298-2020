import { Point } from './Point.js';
import { MapPosState } from './MapPosState.js';
import { MapMeta } from './MapMeta.js';
import { MapLoader } from './MapLoader.js';
import { InteractivityManager } from './UIControl.js';
import { Settings, DistanceUnits, MetreConversion } from './Settings.js';
import { MapLineList, MapPointList, MapObjectStyleList } from './MapObject.js';
import { Restorable } from './Utils.js';
import { UndoRedoManager } from './UndoRedoManager.js';

/**
 * Main class of this map application. Should be loaded once.
 * (Though nothing stops you from creating more than one.)
 *
 * - To add new settings, refer to Settings.ts
 * - To add new interactivity, refer to UiControl.ts
 * - Any loose pure functions should go on Utils.ts
 */
export class App {
    DEBUG = false;
    /**
     * Contains all points related to the mouse:
     * - screen: Position on the user screen.
     * - canvas: Position inside the zoomed and translated canvas.
     * - screenSnap: Used by tools when snap is enabled.
     */
    mouse = {
        screen: Point.ZERO(),
        canvas: Point.ZERO(),
        screenSnap: Point.ZERO(),
        canvasSnap: Point.ZERO(),
    };

    /**
     * Contains the transforms applied to the map:
     * - translate
     * - scale
     */
    posState = new MapPosState();

    /** Contains information about a map's fixed points (coordinates). */
    mapMeta = new MapMeta();

    /** Loads the map sections to the DOM and draws them on the canvas. */
    mapLoader = new MapLoader();

    /** Simple settings manager. */
    settings: Settings;

    /** Canvas element that the app draws to. */
    canvas: HTMLCanvasElement;

    /** Interactivity manager: handles user input, shortcuts, and some DOM changes. */
    interman: InteractivityManager;

    /** Manages doing/undoing actions via Ctrl+Z / Ctrl+Y */
    undoman: UndoRedoManager;

    /** Contains all the object lists of this app. */
    objectList = {
        line: new MapLineList(this),
        point: new MapPointList(this),
    };

    objectListList = [this.objectList.line, this.objectList.point];

    globalDefaultStyle: MapObjectStyleList = {
        normal: {
            color: 'rgba(53,103,240,1)',
            width: 3,
            type: 'solid',
        },
        hover: {
            color: 'rgba(53, 232, 255,.8)',
            width: 4,
            type: 'solid',
        },
        active: {
            color: 'rgba(20,40,100,1)',
            width: 4,
            type: 'solid',
        },
        disabled: {
            color: 'gray',
            width: 1,
            type: 'solid',
        },
    };

    // DEBUG
    DEBUG_RESET_SAVE = false;

    /** Initializes the canvas to #renderCanvas */
    constructor() {
        this.canvas = document.getElementById(
            'renderCanvas'
        ) as HTMLCanvasElement;

            
        this.interman = new InteractivityManager(this);
        this.settings = new Settings();

        this.updateSettingsNode();
        this.settings.eventHandlerList_PropertyChanged.push((property, val) => {
            if (property == 'map') {
                this.load(val);
            }
        });

        this.objectList.line.node = $('#lineListWrapper')[0];
        this.objectList.line.globalStyle = this.globalDefaultStyle;
        this.objectList.line.updateNode();
        this.objectList.line.updateNodeButtons($('#lineListButtonWrapper')[0]);

        this.objectList.point.node = $('#pointListWrapper')[0];
        this.objectList.point.globalStyle = this.globalDefaultStyle;
        this.objectList.point.updateNode();
        this.objectList.point.updateNodeButtons(
            $('#pointListButtonWrapper')[0]
        );
    }

    /** Util functions to convert canvas units to distance units */
    DistanceUtils = {
        /** Converts canvas units to metre */
        canvas2metre: (d: number) => d / this.mapMeta.oneMetreInPx,
        /** Converts canvas units to km */
        canvas2km: (d: number) => (d * 1e-3) / this.mapMeta.oneMetreInPx,
        /** Converts canvas units to the unit specified by settings. */
        canvas2unit: (d: number, unit = this.settings.distanceUnits) => {
            if (unit != 'cu') {
                return (d / this.mapMeta.oneMetreInPx) * MetreConversion[unit];
            } else {
                return d;
            }
        },
        unit2canvas: (d: number, unit: DistanceUnits) => {
            if (unit != 'cu') {
                let m = d / MetreConversion[unit];
                return m * this.mapMeta.oneMetreInPx;
            } else {
                return d; // Conversion to canvas not necessary.
            }
        },
        /**
         * Converts from one unit to another.
         * @param d Number to convert to another unit.
         * @param unit1 Unit of the given number (to convert from).
         * @param unit2 Unit to convert to.
         */
        unit2unit: (d: number, unit1: DistanceUnits, unit2: DistanceUnits) => {
            // Convert to m
            let m = d / MetreConversion[unit1];
            // Convert to desired unit
            let o = d * MetreConversion[unit2];
            return o;
        },
    };

    private _gdd() {
        return this.settings.distanceDigits;
    }

    /** Util functions that convert number to a distance string */
    DistanceFormat = {
        /** Rounds the number to the amount of digits set by Settings */
        round: (d: number) => d.toFixed(this._gdd()),
        /** Converts from canvas units to metre */
        canvas2metre: (d: number, appendUnit = true) => {
            let a = appendUnit ? ' m' : '';
            this.DistanceUtils.canvas2metre(d).toFixed(this._gdd()) + a;
        },
        /** Converts from canvas units to km */
        canvas2km: (d: number, appendUnit = true) => {
            let a = appendUnit ? ' km' : '';
            return this.DistanceUtils.canvas2km(d).toFixed(this._gdd()) + a;
        },

        /** Converts to the unit specified by Settings */
        canvas2unit: (
            d: number,
            appendUnit = true,
            unit = this.settings.distanceUnits
        ) => {
            let a = appendUnit ? ' ' + unit : '';
            return (
                this.DistanceFormat.round(
                    this.DistanceUtils.canvas2unit(d, unit)
                ) + a
            );
        },
    };

    /** Calls this.settings.updateSettingsNode(ARGS) to update the settings node */
    updateSettingsNode() {
        this.settings.updateSettingsNode(
            this.interman,
            document.querySelector('#settings'),
            this.mapLoader
        );
    }

    /**
     * Loads a map.
     * @param map Map ID to load.
     */
    load(map: string) {
        this.mapLoader.load(this.mapMeta, map, this.posState, () =>
            this.draw()
        );
    }

    /** Converts a screen point to a canvas point. */
    screenPointToCanvasPoint(p: Point) {
        return Point.BinaryOperation(
            p,
            this.posState.translate,
            (pos, translate) => (pos - translate) / this.posState.scale
        );
    }

    /** Converts a canvas point to a screen point. */
    canvasPointToScreenPoint(p: Point) {
        return Point.BinaryOperation(
            p,
            this.posState.translate,
            (pos, translate) => this.posState.scale * pos + translate
        );
    }

    /** Returns an object that can be saved to JSON and loaded via assignSaveObject() */
    toSaveObject() {
        let o = {
            map: this.mapLoader.currentMap,
            posState: this.posState.toJObject(),
            settings: this.settings.toJObject(),

            lines: this.objectList.line.toJObject(),
            points: this.objectList.point.toJObject(),
        };

        return o;
    }

    /** Loads a save object */
    assignSaveObject(o) {
        function tryAssign(target: Restorable, source: any, property: string) {
            if (source[property] !== undefined) {
                target.assign(source[property]);
                return true;
            }
            return false;
        }
        try {
            this.load(o.map);
            tryAssign(this.posState, o, 'posState');
            if (tryAssign(this.settings, o, 'settings')) {
                this.updateSettingsNode();
            }

            if (tryAssign(this.objectList.line, o, 'lines')) {
                this.objectList.line.node = $('#lineListWrapper')[0];
                this.objectList.line.globalStyle = this.globalDefaultStyle;
                this.objectList.line.updateNode();
                this.objectList.line.updateNodeButtons(
                    $('#lineListButtonWrapper')[0]
                );
            }

            if (tryAssign(this.objectList.point, o, 'points')) {
                this.objectList.point.node = $('#pointListWrapper')[0];
                this.objectList.point.globalStyle = this.globalDefaultStyle;
                this.objectList.point.updateNode();
                this.objectList.point.updateNodeButtons(
                    $('#pointListButtonWrapper')[0]
                );
            }

            return true;
        } catch (error) {
            console.warn('Could not restore App object:');
            console.warn(error);
            return false;
        }
    }

    /** Saves settings and objects to localStorage */
    saveToLocalStorage(identifier: string) {
        let saveObject = this.toSaveObject();
        let jstring = JSON.stringify(saveObject);

        try {
            window.localStorage.setItem(identifier, jstring);
            return true;
        } catch (error) {
            console.warn(`Could not save '${identifier}' to localStorage.`);
            console.warn(error);
            return false;
        }
    }

    /** Loads settings and objects to localStorage */
    loadFromLocalStorage(identifier: string) {
        let jstring = window.localStorage.getItem(identifier);
        if (jstring == null) return false;
        let saveObject = JSON.parse(jstring);
        this.assignSaveObject(saveObject);
        return true;
    }

    /** Clears the saved settings (if any) from localStorage */
    clearLocalStorage(identifier: string) {
        localStorage.removeItem(identifier);
        console.log(`Removed '${identifier} from localStorage'`);
    }

    /** Draws on the associated canvas */
    draw() {
        let canvas = this.canvas;
        let context = canvas.getContext('2d');
        let clickMode = this.interman
            ? this.interman.clickMode
            : { mode: null };

        // Update width/height of canvas
        let windowScale = window.devicePixelRatio;
        canvas.width = innerWidth * windowScale;
        canvas.height = innerHeight * windowScale;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw map
        this.mapLoader.draw(context, this.posState);

        // Map lines
        // mapLineList.draw(context);
        this.objectList.line.draw(context);
        if (clickMode.mode == 'setLinePoint2') {
            this.interman.temp.lineTool.draftLine.draw(context);
        }
        if (clickMode.mode == 'setTopographicPoint') {
            this.interman.temp.topoPointTool.draftLine.draw(context);
        }

        // Map points
        this.objectList.point.draw(context);
    }
}

let saveString = 'saved_data_default';

$(document).ready(function () {
    let mapApp = new App();
    (<any>window).mapApp = mapApp;

    let hasSavedData = mapApp.loadFromLocalStorage(saveString);
    if (!hasSavedData) {
        console.log('First run detected!');
    }
    mapApp.load(mapApp.settings.map);
    //mapApp.interman = new InteractivityManager(mapApp);
    mapApp.undoman = new UndoRedoManager(mapApp);

    $(window).ready(() => mapApp.interman.onWindowReady());
});

window.onbeforeunload = function (event) {
    //form saving request
    //event.returnValue = "The form is being saved. Please wait";
    let mapApp = window['mapApp'] as App;
    if (mapApp.DEBUG_RESET_SAVE) {
        mapApp.clearLocalStorage(saveString);
    } else {
        mapApp.saveToLocalStorage(saveString);
    }
    window.scrollTo(0, 1);
};

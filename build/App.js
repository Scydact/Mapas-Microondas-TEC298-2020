var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Point } from './Point.js';
import { MapPosState } from './MapPosState.js';
import { MapMeta } from './MapMeta.js';
import { MapLoader } from './MapLoader.js';
import { InteractivityManager } from './UIControl.js';
import { Settings, MetreConversion } from './Settings.js';
import { MapLineList, MapPointList } from './MapObject.js';
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
    /** Initializes the canvas to #renderCanvas */
    constructor() {
        this.DEBUG = false;
        /**
         * Contains all points related to the mouse:
         * - screen: Position on the user screen.
         * - canvas: Position inside the zoomed and translated canvas.
         * - screenSnap: Used by tools when snap is enabled.
         */
        this.mouse = {
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
        this.posState = new MapPosState();
        /** Contains information about a map's fixed points (coordinates). */
        this.mapMeta = new MapMeta();
        /** Loads the map sections to the DOM and draws them on the canvas. */
        this.mapLoader = new MapLoader();
        /** Contains all the object lists of this app. */
        this.objectList = {
            line: new MapLineList(this),
            point: new MapPointList(this),
        };
        this.objectListList = [this.objectList.line, this.objectList.point];
        this.globalDefaultStyle = {
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
        this.DEBUG_RESET_SAVE = false;
        /** Util functions to convert canvas units to distance units */
        this.DistanceUtils = {
            /** Converts canvas units to metre */
            canvas2metre: (d) => d / this.mapMeta.oneMetreInPx,
            /** Converts canvas units to km */
            canvas2km: (d) => (d * 1e-3) / this.mapMeta.oneMetreInPx,
            /** Converts canvas units to the unit specified by settings. */
            canvas2unit: (d, unit = this.settings.distanceUnits) => {
                if (unit != 'cu') {
                    return (d / this.mapMeta.oneMetreInPx) * MetreConversion[unit];
                }
                else {
                    return d;
                }
            },
            unit2canvas: (d, unit) => {
                if (unit != 'cu') {
                    let m = d / MetreConversion[unit];
                    return m * this.mapMeta.oneMetreInPx;
                }
                else {
                    return d; // Conversion to canvas not necessary.
                }
            },
            /**
             * Converts from one unit to another.
             * @param d Number to convert to another unit.
             * @param unit1 Unit of the given number (to convert from).
             * @param unit2 Unit to convert to.
             */
            unit2unit: (d, unit1, unit2) => {
                // Convert to m
                let m = d / MetreConversion[unit1];
                // Convert to desired unit
                let o = d * MetreConversion[unit2];
                return o;
            },
        };
        /** Util functions that convert number to a distance string */
        this.DistanceFormat = {
            /** Rounds the number to the amount of digits set by Settings */
            round: (d) => d.toFixed(this._gdd()),
            /** Converts from canvas units to metre */
            canvas2metre: (d, appendUnit = true) => {
                let a = appendUnit ? ' m' : '';
                this.DistanceUtils.canvas2metre(d).toFixed(this._gdd()) + a;
            },
            /** Converts from canvas units to km */
            canvas2km: (d, appendUnit = true) => {
                let a = appendUnit ? ' km' : '';
                return this.DistanceUtils.canvas2km(d).toFixed(this._gdd()) + a;
            },
            /** Converts to the unit specified by Settings */
            canvas2unit: (d, appendUnit = true, unit = this.settings.distanceUnits) => {
                let a = appendUnit ? ' ' + unit : '';
                return (this.DistanceFormat.round(this.DistanceUtils.canvas2unit(d, unit)) + a);
            },
        };
        this.canvas = document.getElementById('renderCanvas');
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
        this.objectList.point.updateNodeButtons($('#pointListButtonWrapper')[0]);
        if (false)
            console.log(JSON.stringify(Object.entries(MapLoader.mapStruct)
                .map(([key, val]) => {
                var { mapMeta } = val, rest = __rest(val, ["mapMeta"]);
                var { name } = mapMeta, rest2 = __rest(mapMeta, ["name"]);
                return [key, Object.assign(Object.assign({ name }, rest), rest2)];
            })
                .reduce((accum, curr) => {
                let o = Object.assign({}, accum);
                o[curr[0]] = curr[1];
                return o;
            }, {})));
    }
    _gdd() {
        return this.settings.distanceDigits;
    }
    /** Calls this.settings.updateSettingsNode(ARGS) to update the settings node */
    updateSettingsNode() {
        this.settings.updateSettingsNode(this.interman, document.querySelector('#settings'), this.mapLoader);
    }
    /**
     * Loads a map.
     * @param map Map ID to load.
     */
    load(map) {
        this.mapLoader.load(this.mapMeta, map, this.posState, () => this.draw());
    }
    /** Converts a screen point to a canvas point. */
    screenPointToCanvasPoint(p) {
        return Point.BinaryOperation(p, this.posState.translate, (pos, translate) => (pos - translate) / this.posState.scale);
    }
    /** Converts a canvas point to a screen point. */
    canvasPointToScreenPoint(p) {
        return Point.BinaryOperation(p, this.posState.translate, (pos, translate) => this.posState.scale * pos + translate);
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
        function tryAssign(target, source, property) {
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
                this.objectList.line.updateNodeButtons($('#lineListButtonWrapper')[0]);
            }
            if (tryAssign(this.objectList.point, o, 'points')) {
                this.objectList.point.node = $('#pointListWrapper')[0];
                this.objectList.point.globalStyle = this.globalDefaultStyle;
                this.objectList.point.updateNode();
                this.objectList.point.updateNodeButtons($('#pointListButtonWrapper')[0]);
            }
            return true;
        }
        catch (error) {
            console.warn('Could not restore App object:');
            console.warn(error);
            return false;
        }
    }
    /** Saves settings and objects to localStorage */
    saveToLocalStorage(identifier) {
        let saveObject = this.toSaveObject();
        let jstring = JSON.stringify(saveObject);
        try {
            window.localStorage.setItem(identifier, jstring);
            return true;
        }
        catch (error) {
            console.warn(`Could not save '${identifier}' to localStorage.`);
            console.warn(error);
            return false;
        }
    }
    /** Loads settings and objects to localStorage */
    loadFromLocalStorage(identifier) {
        let jstring = window.localStorage.getItem(identifier);
        if (jstring == null)
            return false;
        let saveObject = JSON.parse(jstring);
        this.assignSaveObject(saveObject);
        return true;
    }
    /** Clears the saved settings (if any) from localStorage */
    clearLocalStorage(identifier) {
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
    window.mapApp = mapApp;
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
    let mapApp = window['mapApp'];
    if (mapApp.DEBUG_RESET_SAVE) {
        mapApp.clearLocalStorage(saveString);
    }
    else {
        mapApp.saveToLocalStorage(saveString);
    }
    window.scrollTo(0, 1);
};
//# sourceMappingURL=App.js.map
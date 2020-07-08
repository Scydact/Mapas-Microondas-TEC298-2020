import { Point } from './Point.js';
import { MapPosState } from './MapPosState.js';
import { MapMeta } from './MapMeta.js';
import { MapLoader } from './MapLoader.js';
import { InteractivityManager } from './UIControl.js';
import { Settings } from './Settings.js';
import { MapLineList, MapPointList } from './MapObject.js';
import { Restorable } from './Utils.js';
import { UndoRedoManager } from './UndoRedoManager.js';
import { map } from 'jquery';

/**
 * Main class of this map application. Should be loaded once.
 * (Though nothing stops you from creating more than one.)
 *
 * - To add new settings, refer to Settings.ts
 * - To add new interactivity, refer to UiControl.ts
 * - Any loose pure functions should go on Utils.ts
 */
export class App {
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
    settings = new Settings();

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

    objectListList = [
        this.objectList.line,
        this.objectList.point,
    ];

    // DEBUG
    DEBUG_RESET_SAVE = false;

    /** Initializes the canvas to #renderCanvas */
    constructor() {
        this.canvas = document.getElementById(
            'renderCanvas'
        ) as HTMLCanvasElement;
        this.updateSettingsNode();
        this.settings.eventHandlerList_PropertyChanged.push((property, val) => {
            if (property == 'map') {
                this.load(val);
            }
        });

        this.objectList.line.node = $('#lineListWrapper')[0];
        this.objectList.line.updateNode();
        this.objectList.line.updateNodeButtons($('#lineListButtonWrapper')[0]);
    
        this.objectList.point.node = $('#pointListWrapper')[0];
        this.objectList.point.updateNode();
        this.objectList.point.updateNodeButtons($('#pointListButtonWrapper')[0]);
    
    }

    /** Calls this.settings.updateSettingsNode(ARGS) to update the settings node */
    updateSettingsNode() {
        this.settings.updateSettingsNode(
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
                this.objectList.line.updateNode();
                this.objectList.line.updateNodeButtons(
                    $('#lineListButtonWrapper')[0]
                );
            }

            if (tryAssign(this.objectList.point, o, 'points')) {
                this.objectList.point.node = $('#pointListWrapper')[0];
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
        let clickMode = (this.interman) ? this.interman.clickMode : {mode: null}

        // Update width/height of canvas
        canvas.width = innerWidth;
        canvas.height = innerHeight;

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
        if (clickMode.mode == "setTopographicPoint") {
            this.interman.temp.topoPointTool.draftLine.draw(context);
        }

        // Map points
        this.objectList.point.draw(context);
    }
}

let saveString = 'saved_data_test';

$(document).ready(function () {
    let mapApp = new App();
    (<any>window).mapApp = mapApp;

    // TODO: Change to save_data_default when done testing.
    let hasSavedData = mapApp.loadFromLocalStorage(saveString);
    if (!hasSavedData) {
        console.log('First run detected!');
    }
    mapApp.load(mapApp.settings.map);
    mapApp.interman = new InteractivityManager(mapApp);
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
};
